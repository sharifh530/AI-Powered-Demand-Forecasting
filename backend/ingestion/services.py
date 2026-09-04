import uuid
import logging
from datetime import datetime, date, timedelta
import numpy as np
import pandas as pd
from django.db import transaction
from django.utils import timezone

from accounts.models import User
from forecasting.models import Category, Location, Product
from inventory.models import InventorySnapshot
from ingestion.models import IngestionLog, SalesTransaction
from analytics.models import DemandHistoryAggregated, TimeSeriesFeatures

logger = logging.getLogger(__name__)


class DataIngestionService:
    """Service for handling, validating, and ingesting raw sales and inventory data."""

    @classmethod
    def ingest_sales_dataframe(cls, df: pd.DataFrame, source_reference: str = 'dataframe_upload',
                               triggered_by: User = None, trigger_type: str = 'manual') -> IngestionLog:
        """
        Ingest sales data from a pandas DataFrame.
        Expected columns: sku, location_code, transaction_date, quantity_sold, unit_price
        Optional columns: is_promotion, promotion_code, discount_amount
        """
        ingestion_id = f"ING-SALES-{uuid.uuid4().hex[:8].upper()}"
        start_time = timezone.now()

        log = IngestionLog.objects.create(
            ingestion_id=ingestion_id,
            source_type='api' if trigger_type == 'api' else 'csv',
            source_reference=source_reference,
            data_type='sales_transactions',
            records_processed=len(df),
            status='running',
            triggered_by=triggered_by,
            trigger_type=trigger_type,
            start_time=start_time
        )

        try:
            # Data cleansing & validation
            df = df.copy()
            required_cols = ['sku', 'location_code', 'transaction_date', 'quantity_sold', 'unit_price']
            missing_cols = [col for col in required_cols if col not in df.columns]
            if missing_cols:
                raise ValueError(f"Missing required columns: {missing_cols}")

            # Parse transaction_date
            df['transaction_date'] = pd.to_datetime(df['transaction_date']).dt.date
            df['quantity_sold'] = pd.to_numeric(df['quantity_sold'], errors='coerce').fillna(0).astype(int)
            df['unit_price'] = pd.to_numeric(df['unit_price'], errors='coerce').fillna(0.0)

            # Optional columns
            if 'is_promotion' not in df.columns:
                df['is_promotion'] = False
            else:
                df['is_promotion'] = df['is_promotion'].astype(bool)

            if 'promotion_code' not in df.columns:
                df['promotion_code'] = ''
            else:
                df['promotion_code'] = df['promotion_code'].fillna('').astype(str)

            if 'discount_amount' not in df.columns:
                df['discount_amount'] = 0.00
            else:
                df['discount_amount'] = pd.to_numeric(df['discount_amount'], errors='coerce').fillna(0.0)

            # Calculate revenue
            df['revenue'] = df['quantity_sold'] * df['unit_price'] - df['discount_amount']
            df['revenue'] = df['revenue'].apply(lambda x: max(0.0, float(x)))

            # Bulk create objects
            records_to_create = []
            for _, row in df.iterrows():
                records_to_create.append(
                    SalesTransaction(
                        sku=row['sku'],
                        location_code=row['location_code'],
                        transaction_date=row['transaction_date'],
                        quantity_sold=row['quantity_sold'],
                        revenue=row['revenue'],
                        unit_price=row['unit_price'],
                        is_promotion=row['is_promotion'],
                        promotion_code=row['promotion_code'],
                        discount_amount=row['discount_amount'],
                        ingestion_log=log
                    )
                )

            with transaction.atomic():
                SalesTransaction.objects.bulk_create(records_to_create, batch_size=2000)

            log.records_inserted = len(records_to_create)
            log.status = 'completed'
            log.end_time = timezone.now()
            log.save()

            # Trigger aggregation & feature updates for affected data
            FeatureEngineeringService.generate_aggregations_and_features()

            return log

        except Exception as e:
            logger.error(f"Error during ingestion {ingestion_id}: {str(e)}", exc_info=True)
            log.status = 'failed'
            log.error_message = str(e)
            log.end_time = timezone.now()
            log.save()
            raise e


class FeatureEngineeringService:
    """Service for calculating historical demand aggregations and ML time series features."""

    @classmethod
    def generate_aggregations_and_features(cls):
        """Aggregate raw sales transactions into daily/weekly tables and compute ML features."""
        # 1. Daily Aggregations
        sales_qs = SalesTransaction.objects.all().values(
            'sku', 'location_code', 'transaction_date', 'quantity_sold', 'revenue', 'unit_price', 'is_promotion'
        )
        if not sales_qs.exists():
            return

        df = pd.DataFrame(list(sales_qs))
        if df.empty:
            return

        locations_map = {loc.location_code: loc for loc in Location.objects.all()}

        # Group by SKU, Location, Date
        daily_grp = df.groupby(['sku', 'location_code', 'transaction_date']).agg(
            total_demand=('quantity_sold', 'sum'),
            total_revenue=('revenue', 'sum'),
            avg_unit_price=('unit_price', 'mean'),
            promotion_flag=('is_promotion', 'any')
        ).reset_index()

        daily_records = []
        for _, row in daily_grp.iterrows():
            loc = locations_map.get(row['location_code'])
            if not loc:
                continue
            daily_records.append(
                DemandHistoryAggregated(
                    sku=row['sku'],
                    location=loc,
                    aggregation_level='daily',
                    period_start_date=row['transaction_date'],
                    period_end_date=row['transaction_date'],
                    total_demand=row['total_demand'],
                    total_revenue=row['total_revenue'],
                    average_unit_price=row['avg_unit_price'],
                    promotion_flag=row['promotion_flag'],
                    stockout_flag=(row['total_demand'] == 0)
                )
            )

        # Clear old and bulk create daily aggregations
        with transaction.atomic():
            DemandHistoryAggregated.objects.filter(aggregation_level='daily').delete()
            DemandHistoryAggregated.objects.bulk_create(daily_records, batch_size=2000)

        # 2. Compute Time Series Features for each SKU + Location series
        cls.compute_time_series_features(daily_grp, locations_map)

    @classmethod
    def compute_time_series_features(cls, daily_df: pd.DataFrame, locations_map: dict):
        """Compute lag features, rolling statistics, calendar encodings, and promotional signals."""
        feature_records = []

        daily_df['transaction_date'] = pd.to_datetime(daily_df['transaction_date'])

        # Process each SKU-Location time series
        for (sku, loc_code), grp in daily_df.groupby(['sku', 'location_code']):
            loc = locations_map.get(loc_code)
            if not loc:
                continue

            grp = grp.sort_values('transaction_date').set_index('transaction_date')

            # Reindex to full daily date range so lag calculations are physically consistent
            full_idx = pd.date_range(start=grp.index.min(), end=grp.index.max(), freq='D')
            grp_full = grp.reindex(full_idx)
            grp_full['total_demand'] = grp_full['total_demand'].fillna(0)
            grp_full['promotion_flag'] = grp_full['promotion_flag'].fillna(False)

            # Lags (7 days = 1 week, 14 days = 2 weeks, 28 days = 4 weeks, etc.)
            grp_full['lag_1'] = grp_full['total_demand'].shift(7).fillna(0).astype(int)
            grp_full['lag_2'] = grp_full['total_demand'].shift(14).fillna(0).astype(int)
            grp_full['lag_4'] = grp_full['total_demand'].shift(28).fillna(0).astype(int)
            grp_full['lag_12'] = grp_full['total_demand'].shift(84).fillna(0).astype(int)
            grp_full['lag_52'] = grp_full['total_demand'].shift(364).fillna(0).astype(int)

            # Rolling stats
            grp_full['rolling_mean_7d'] = grp_full['total_demand'].rolling(window=7, min_periods=1).mean()
            grp_full['rolling_mean_14d'] = grp_full['total_demand'].rolling(window=14, min_periods=1).mean()
            grp_full['rolling_mean_30d'] = grp_full['total_demand'].rolling(window=30, min_periods=1).mean()
            grp_full['rolling_std_7d'] = grp_full['total_demand'].rolling(window=7, min_periods=1).std().fillna(0)
            grp_full['rolling_std_30d'] = grp_full['total_demand'].rolling(window=30, min_periods=1).std().fillna(0)

            for dt, row in grp_full.iterrows():
                feature_date = dt.date()
                feature_records.append(
                    TimeSeriesFeatures(
                        sku=sku,
                        location=loc,
                        feature_date=feature_date,
                        lag_1=int(row['lag_1']),
                        lag_2=int(row['lag_2']),
                        lag_4=int(row['lag_4']),
                        lag_12=int(row['lag_12']),
                        lag_52=int(row['lag_52']),
                        rolling_mean_7d=round(float(row['rolling_mean_7d']), 2),
                        rolling_mean_14d=round(float(row['rolling_mean_14d']), 2),
                        rolling_mean_30d=round(float(row['rolling_mean_30d']), 2),
                        rolling_std_7d=round(float(row['rolling_std_7d']), 2),
                        rolling_std_30d=round(float(row['rolling_std_30d']), 2),
                        day_of_week=feature_date.weekday(),
                        day_of_month=feature_date.day,
                        week_of_year=feature_date.isocalendar()[1],
                        month=feature_date.month,
                        quarter=(feature_date.month - 1) // 3 + 1,
                        is_weekend=(feature_date.weekday() >= 5),
                        is_holiday=(feature_date.month == 12 and feature_date.day in [24, 25, 31]) or (feature_date.month == 1 and feature_date.day == 1),
                        promotion_active=bool(row['promotion_flag']),
                        days_since_promotion=0 if bool(row['promotion_flag']) else None
                    )
                )

        with transaction.atomic():
            TimeSeriesFeatures.objects.all().delete()
            TimeSeriesFeatures.objects.bulk_create(feature_records, batch_size=2000)


class SampleDataGenerator:
    """Generates enterprise-grade mock data for products, categories, locations, sales & inventory."""

    @classmethod
    def populate_all(cls, start_date_str='2024-01-01', end_date_str='2026-08-31'):
        """Create complete realistic sample data suite."""
        logger.info("Starting sample data generation...")
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()

        # 1. Categories
        cat_data = [
            {'name': 'Consumer Electronics', 'code': 'ELEC', 'description': 'Smartphones, audio, accessories'},
            {'name': 'Apparel & Footwear', 'code': 'APPR', 'description': 'Clothing, sportswear, shoes'},
            {'name': 'Home & Kitchen', 'code': 'HOME', 'description': 'Appliances, cookware, decor'},
            {'name': 'Health & Personal Care', 'code': 'HLTH', 'description': 'Vitamins, grooming, wellness'},
            {'name': 'Packaged Foods & Beverages', 'code': 'FOOD', 'description': 'Snacks, specialty coffee, pantry'},
        ]
        categories = {}
        for c in cat_data:
            cat_obj, _ = Category.objects.get_or_create(
                code=c['code'],
                defaults={'name': c['name'], 'description': c['description']}
            )
            categories[c['code']] = cat_obj

        # 2. Locations
        loc_data = [
            {'code': 'STORE-NYC-01', 'name': 'Manhattan Flagship Store', 'type': 'store', 'region': 'Northeast', 'capacity': 15000},
            {'code': 'STORE-SFO-01', 'name': 'San Francisco Union Square', 'type': 'store', 'region': 'West', 'capacity': 12000},
            {'code': 'STORE-CHI-01', 'name': 'Chicago Michigan Ave', 'type': 'store', 'region': 'Midwest', 'capacity': 10000},
            {'code': 'STORE-MIA-01', 'name': 'Miami Lincoln Road', 'type': 'store', 'region': 'Southeast', 'capacity': 8000},
            {'code': 'DC-EAST-01', 'name': 'Eastern Regional Distribution Center', 'type': 'dc', 'region': 'Northeast', 'capacity': 150000},
            {'code': 'DC-WEST-01', 'name': 'Western Logistics Hub', 'type': 'dc', 'region': 'West', 'capacity': 180000},
            {'code': 'WH-CENTRAL-01', 'name': 'Central Regional Warehouse', 'type': 'warehouse', 'region': 'Midwest', 'capacity': 85000},
        ]
        locations = {}
        for l in loc_data:
            loc_obj, _ = Location.objects.get_or_create(
                location_code=l['code'],
                defaults={
                    'name': l['name'],
                    'location_type': l['type'],
                    'region': l['region'],
                    'capacity_units': l['capacity']
                }
            )
            locations[l['code']] = loc_obj

        # 3. Products
        prod_data = [
            # Electronics - Mobile Phones & Smartwatches
            {'sku': 'SKU-ELEC-PHONE-PRO-MAX', 'name': 'Horizon Pro Max 5G Smartphone 256GB', 'cat': 'ELEC', 'cost': 420.00, 'price': 999.99, 'lead': 21, 'moq': 20, 'safety': 15, 'base_daily': 12, 'seasonality': 'q4_high'},
            {'sku': 'SKU-ELEC-PHONE-LITE', 'name': 'Horizon Lite 5G Smartphone 128GB', 'cat': 'ELEC', 'cost': 210.00, 'price': 499.99, 'lead': 18, 'moq': 30, 'safety': 12, 'base_daily': 18, 'seasonality': 'q4_high'},
            {'sku': 'SKU-ELEC-WATCH-SPORT', 'name': 'AthletePulse Pro GPS Sports Smartwatch', 'cat': 'ELEC', 'cost': 145.00, 'price': 349.99, 'lead': 16, 'moq': 25, 'safety': 10, 'base_daily': 15, 'seasonality': 'q4_high'},
            {'sku': 'SKU-ELEC-WATCH-ELITE', 'name': 'EliteTime Luxury Titanium Smartwatch', 'cat': 'ELEC', 'cost': 280.00, 'price': 699.99, 'lead': 25, 'moq': 15, 'safety': 8, 'base_daily': 8, 'seasonality': 'q4_high'},
            {'sku': 'SKU-ELEC-WATCH-FIT', 'name': 'FitTrack Health & Fitness Smartwatch', 'cat': 'ELEC', 'cost': 75.00, 'price': 179.99, 'lead': 14, 'moq': 40, 'safety': 12, 'base_daily': 20, 'seasonality': 'jan_spike'},
            {'sku': 'SKU-ELEC-BUDS-PRO', 'name': 'AeroPro Wireless Noise-Cancelling Earbuds', 'cat': 'ELEC', 'cost': 65.00, 'price': 149.99, 'lead': 14, 'moq': 50, 'safety': 10, 'base_daily': 25, 'seasonality': 'q4_high'},
            {'sku': 'SKU-ELEC-TABLET-10', 'name': 'NexTab 10.5" Ultra HD Android Tablet', 'cat': 'ELEC', 'cost': 180.00, 'price': 449.99, 'lead': 20, 'moq': 20, 'safety': 10, 'base_daily': 10, 'seasonality': 'q4_high'},
            {'sku': 'SKU-ELEC-4K-WEBCAM', 'name': 'VisionClear 4K Ultra HD Streaming Webcam', 'cat': 'ELEC', 'cost': 45.00, 'price': 99.99, 'lead': 21, 'moq': 30, 'safety': 7, 'base_daily': 18, 'seasonality': 'steady'},
            {'sku': 'SKU-ELEC-CHG-PAD-3IN1', 'name': 'MagCharge 3-in-1 Fast Charging Station', 'cat': 'ELEC', 'cost': 22.00, 'price': 59.99, 'lead': 10, 'moq': 100, 'safety': 14, 'base_daily': 35, 'seasonality': 'q4_high'},
            {'sku': 'SKU-ELEC-SMART-PLUG', 'name': 'NovaLink WiFi Smart Power Strip (4-Port)', 'cat': 'ELEC', 'cost': 14.00, 'price': 34.99, 'lead': 14, 'moq': 80, 'safety': 10, 'base_daily': 20, 'seasonality': 'steady'},
            # Apparel
            {'sku': 'SKU-APPR-RUN-SHOE-M', 'name': 'StrataFlex Men Aero Dynamic Running Shoes', 'cat': 'APPR', 'cost': 42.00, 'price': 119.99, 'lead': 30, 'moq': 40, 'safety': 15, 'base_daily': 22, 'seasonality': 'spring_summer'},
            {'sku': 'SKU-APPR-THERM-JKT', 'name': 'SummitShield Polar Thermal Windbreaker', 'cat': 'APPR', 'cost': 55.00, 'price': 159.99, 'lead': 45, 'moq': 25, 'safety': 20, 'base_daily': 15, 'seasonality': 'winter_spike'},
            {'sku': 'SKU-APPR-YOGA-PANT', 'name': 'ZenFlow Seamless High-Waist Yoga Leggings', 'cat': 'APPR', 'cost': 18.00, 'price': 49.99, 'lead': 14, 'moq': 60, 'safety': 12, 'base_daily': 30, 'seasonality': 'jan_spike'},
            # Home & Kitchen
            {'sku': 'SKU-HOME-AIR-FRYER', 'name': 'CrispChef 6.5Qt Digital Air Fryer Pro', 'cat': 'HOME', 'cost': 48.00, 'price': 129.99, 'lead': 28, 'moq': 20, 'safety': 10, 'base_daily': 16, 'seasonality': 'q4_high'},
            {'sku': 'SKU-HOME-EXP-MACHINE', 'name': 'BaristaCraft 15-Bar Compact Espresso Maker', 'cat': 'HOME', 'cost': 95.00, 'price': 249.99, 'lead': 35, 'moq': 15, 'safety': 8, 'base_daily': 10, 'seasonality': 'q4_high'},
            {'sku': 'SKU-HOME-ROBOT-VAC', 'name': 'SmartSweep LiDAR Navigation Robot Vacuum', 'cat': 'HOME', 'cost': 120.00, 'price': 299.99, 'lead': 40, 'moq': 10, 'safety': 12, 'base_daily': 8, 'seasonality': 'q4_high'},
            # Health & Care
            {'sku': 'SKU-HLTH-VIT-D3K2', 'name': 'VitalPeak High-Potency Vitamin D3+K2 120ct', 'cat': 'HLTH', 'cost': 8.50, 'price': 24.99, 'lead': 10, 'moq': 150, 'safety': 14, 'base_daily': 45, 'seasonality': 'winter_spike'},
            {'sku': 'SKU-HLTH-COLLAGEN', 'name': 'PureGlow Hydrolyzed Peptides Collagen Powder', 'cat': 'HLTH', 'cost': 14.00, 'price': 39.99, 'lead': 14, 'moq': 100, 'safety': 14, 'base_daily': 28, 'seasonality': 'steady'},
            # Food & Beverage
            {'sku': 'SKU-FOOD-COLD-BREW', 'name': 'Artisan Roast Nitro Cold Brew Blend 2lb', 'cat': 'FOOD', 'cost': 9.00, 'price': 22.99, 'lead': 7, 'moq': 120, 'safety': 10, 'base_daily': 40, 'seasonality': 'summer_spike'},
            {'sku': 'SKU-FOOD-ORGANIC-TEA', 'name': 'MatchaZen Ceremonial Grade Organic Matcha 100g', 'cat': 'FOOD', 'cost': 12.50, 'price': 32.99, 'lead': 12, 'moq': 80, 'safety': 10, 'base_daily': 24, 'seasonality': 'jan_spike'},
        ]

        products = {}
        for p in prod_data:
            prod_obj, _ = Product.objects.get_or_create(
                sku=p['sku'],
                defaults={
                    'name': p['name'],
                    'category': categories[p['cat']],
                    'unit_cost': p['cost'],
                    'unit_price': p['price'],
                    'lead_time_days': p['lead'],
                    'min_order_qty': p['moq'],
                    'safety_stock_days': p['safety'],
                    'lifecycle_status': 'active',
                    'attributes': {'seasonality_pattern': p['seasonality'], 'base_daily_demand': p['base_daily']}
                }
            )
            products[p['sku']] = prod_obj

        # 4. Generate Realistic Daily Sales Transactions
        num_days = (end_date - start_date).days + 1
        date_list = [start_date + timedelta(days=i) for i in range(num_days)]

        np.random.seed(42)
        sales_records = []
        snapshots = []

        # Target primary store locations for sales transactions
        active_stores = [locations['STORE-NYC-01'], locations['STORE-SFO-01'], locations['STORE-CHI-01'], locations['STORE-MIA-01']]

        for p_info in prod_data:
            sku = p_info['sku']
            base_demand = p_info['base_daily']
            seasonality = p_info['seasonality']
            price = p_info['price']
            cost = p_info['cost']
            lead_time = p_info['lead']
            safety_days = p_info['safety']

            for store in active_stores:
                # Location factor multiplier
                loc_mult = 1.25 if 'NYC' in store.location_code else (1.1 if 'SFO' in store.location_code else 0.85)

                for curr_date in date_list:
                    # Day of week multiplier (Saturday & Sunday peak)
                    dow = curr_date.weekday()
                    dow_mult = 1.4 if dow == 5 else (1.3 if dow == 6 else (1.1 if dow == 4 else 0.9))

                    # Month / Season multiplier
                    month = curr_date.month
                    if seasonality == 'q4_high':
                        season_mult = 2.2 if month in [11, 12] else (1.2 if month == 10 else 0.85)
                    elif seasonality == 'spring_summer':
                        season_mult = 1.5 if month in [4, 5, 6, 7] else 0.75
                    elif seasonality == 'winter_spike':
                        season_mult = 1.8 if month in [11, 12, 1, 2] else 0.65
                    elif seasonality == 'summer_spike':
                        season_mult = 1.7 if month in [6, 7, 8] else 0.8
                    elif seasonality == 'jan_spike':
                        season_mult = 1.9 if month == 1 else (1.2 if month in [2, 9] else 0.9)
                    else:  # steady
                        season_mult = 1.0 + 0.1 * np.sin(curr_date.timetuple().tm_yday / 365.0 * 2 * np.pi)

                    # Year trend (+10% annual growth from 2024 to 2026)
                    days_from_start = (curr_date - start_date).days
                    trend_mult = 1.0 + (0.12 * (days_from_start / 365.0))

                    # Promotion probability (e.g. 5% random days, plus Black Friday / Prime Day)
                    is_bf = (curr_date.month == 11 and curr_date.day in [25, 26, 27, 28, 29] and curr_date.weekday() == 4)
                    is_summer_sale = (curr_date.month == 7 and curr_date.day in [10, 11, 12])
                    is_random_promo = (np.random.rand() < 0.03)

                    is_promo = is_bf or is_summer_sale or is_random_promo
                    promo_mult = 2.5 if is_bf else (1.8 if is_summer_sale else (1.4 if is_promo else 1.0))
                    promo_code = 'BF-DEAL' if is_bf else ('SUMMER-PROMO' if is_summer_sale else ('FLASH-SALE' if is_promo else ''))
                    discount = round(price * 0.2, 2) if is_promo else 0.00

                    # Expected demand calculation with Poisson noise
                    lambda_param = base_demand * loc_mult * dow_mult * season_mult * trend_mult * promo_mult
                    qty_sold = int(np.random.poisson(max(1.0, lambda_param)))

                    revenue = round(qty_sold * (price - discount), 2)

                    sales_records.append(
                        SalesTransaction(
                            sku=sku,
                            location_code=store.location_code,
                            transaction_date=curr_date,
                            quantity_sold=qty_sold,
                            revenue=revenue,
                            unit_price=price,
                            is_promotion=is_promo,
                            promotion_code=promo_code,
                            discount_amount=discount
                        )
                    )

                # Generate modern inventory snapshot for the latest date (2026-08-31)
                latest_date = end_date
                reorder_trigger = int(base_demand * loc_mult * (lead_time + safety_days))
                safety_stock_units = int(base_demand * loc_mult * safety_days)
                # Current stock with some realistic random variation (some understocked, some normal, some excess)
                stock_factor = np.random.choice([0.4, 0.8, 1.2, 1.5, 2.2], p=[0.15, 0.35, 0.30, 0.15, 0.05])
                current_stock = int(reorder_trigger * stock_factor)
                in_transit = int(reorder_trigger * 0.5) if stock_factor < 1.0 else 0

                snapshots.append(
                    InventorySnapshot(
                        sku=sku,
                        location=store,
                        snapshot_date=latest_date,
                        stock_on_hand=current_stock,
                        stock_in_transit=in_transit,
                        reorder_point=reorder_trigger,
                        safety_stock=safety_stock_units,
                        unit_cost=cost
                    )
                )

        logger.info(f"Bulk inserting {len(sales_records)} sales records...")
        with transaction.atomic():
            SalesTransaction.objects.all().delete()
            SalesTransaction.objects.bulk_create(sales_records, batch_size=3000)

            InventorySnapshot.objects.all().delete()
            InventorySnapshot.objects.bulk_create(snapshots, batch_size=1000)

        # Create IngestionLog record
        IngestionLog.objects.create(
            ingestion_id=f"ING-SAMPLE-DATA",
            source_type='manual',
            source_reference='SampleDataGenerator.populate_all()',
            data_type='synthetic_sales_inventory_master',
            records_processed=len(sales_records),
            records_inserted=len(sales_records),
            status='completed',
            trigger_type='system',
            start_time=timezone.now() - timedelta(minutes=2),
            end_time=timezone.now()
        )

        logger.info("Computing demand aggregations and ML time-series features...")
        FeatureEngineeringService.generate_aggregations_and_features()
        logger.info("Sample data population completed successfully!")
