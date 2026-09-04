import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const ConfidenceChart = ({
  forecasts = [],
  title = '14-Day Forward Demand Forecast (90% Confidence Interval)',
  skuLabel = 'BEV-001',
  locationLabel = 'Central Hub'
}) => {
  if (!forecasts || forecasts.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-slate-500 text-sm">
        No forecast data points available.
      </div>
    );
  }

  const labels = forecasts.map(f => {
    const parts = f.forecast_date.split('-');
    return `${parts[1]}/${parts[2]}`; // MM/DD
  });

  const predictedData = forecasts.map(f => f.predicted_demand);
  const lowerData = forecasts.map(f => f.lower_bound);
  const upperData = forecasts.map(f => f.upper_bound);

  const data = {
    labels,
    datasets: [
      {
        label: 'Upper Bound (95th %ile)',
        data: upperData,
        borderColor: 'rgba(226, 163, 61, 0.35)',
        backgroundColor: 'rgba(226, 163, 61, 0.10)',
        borderDash: [4, 4],
        borderWidth: 1.5,
        pointRadius: 0,
        fill: '+1', // Fill down to Lower Bound
        tension: 0.2,
      },
      {
        label: 'Lower Bound (5th %ile)',
        data: lowerData,
        borderColor: 'rgba(226, 163, 61, 0.35)',
        backgroundColor: 'rgba(226, 163, 61, 0.10)',
        borderDash: [4, 4],
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
        tension: 0.2,
      },
      {
        label: 'Predicted demand (AI champion)',
        data: predictedData,
        borderColor: '#E2A33D',
        backgroundColor: '#E2A33D',
        borderWidth: 2.5,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: '#E2A33D',
        pointBorderColor: '#1A1F26',
        pointBorderWidth: 2,
        fill: false,
        tension: 0.2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          color: '#8E8B82',
          font: { family: 'Inter', size: 11, weight: '500' },
          usePointStyle: true,
          boxWidth: 8,
          boxHeight: 8,
          padding: 15,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(26, 31, 38, 0.97)',
        titleColor: '#E9E6DD',
        bodyColor: '#B4B0A4',
        borderColor: 'rgba(44, 51, 61, 0.9)',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: (context) => {
            const val = context.raw;
            return ` ${context.dataset.label}: ${val} units`;
          },
          afterBody: (tooltipItems) => {
            if (tooltipItems.length >= 3) {
              const upper = tooltipItems[0].raw;
              const lower = tooltipItems[1].raw;
              const pred = tooltipItems[2].raw;
              const spread = upper - lower;
              return [
                `------------------------`,
                ` Uncertainty Span: ±${(spread / 2).toFixed(1)} units`,
                ` 90% Confidence Span: [${lower} - ${upper}]`
              ];
            }
          }
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(44, 51, 61, 0.6)',
          drawBorder: false,
        },
        ticks: {
          color: '#8E8B82',
          font: { family: 'Inter', size: 11 },
        },
      },
      y: {
        grid: {
          color: 'rgba(44, 51, 61, 0.6)',
          drawBorder: false,
        },
        ticks: {
          color: '#8E8B82',
          font: { family: 'Fira Code', size: 11 },
        },
        title: {
          display: true,
          text: 'Projected daily demand (units)',
          color: '#8E8B82',
          font: { family: 'Inter', size: 11, weight: '500' },
        },
      },
    },
  };

  return (
    <div className="w-full h-80">
      <Line data={data} options={options} />
    </div>
  );
};
