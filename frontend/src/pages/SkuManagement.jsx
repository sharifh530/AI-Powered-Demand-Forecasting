import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  CheckCircle2,
  X
} from 'lucide-react';
import APIService from '../services/api';

export const SkuManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: 'Beverages',
    unit_price: '4.50',
    safety_stock: '150',
    lead_time_days: '3',
    status: 'active'
  });

  const fetchProducts = async () => {
    setLoading(true);
    const res = await APIService.getProducts();
    setProducts(res.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      sku: `SKU-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      category: 'Beverages',
      unit_price: '5.00',
      safety_stock: '200',
      lead_time_days: '4',
      status: 'active'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (prod) => {
    setEditingProduct(prod);
    setFormData({
      sku: prod.sku,
      name: prod.name,
      category: prod.category,
      unit_price: prod.unit_price.toString(),
      safety_stock: (prod.safety_stock || 200).toString(),
      lead_time_days: (prod.lead_time_days || 4).toString(),
      status: 'active'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingProduct) {
      setProducts(prev =>
        prev.map(p => (p.sku === editingProduct.sku ? { ...p, ...formData, unit_price: parseFloat(formData.unit_price) } : p))
      );
      showToast(`SKU ${formData.sku} updated successfully.`);
    } else {
      setProducts(prev => [
        ...prev,
        {
          id: prev.length + 1,
          ...formData,
          unit_price: parseFloat(formData.unit_price),
          safety_stock: parseInt(formData.safety_stock),
          lead_time_days: parseInt(formData.lead_time_days)
        }
      ]);
      showToast(`New SKU ${formData.sku} added to catalog.`);
    }
    setIsModalOpen(false);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    const matchesSearch =
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="panel p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-display font-bold text-paper flex items-center gap-2">
            <Package className="w-4 h-4 text-signal-amber" />
            <span>Product master catalog &amp; policy settings</span>
          </h2>
          <p className="text-xs text-paper-muted mt-0.5">
            Configure safety stock floors, lead times, and retail unit economics across demand nodes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchProducts}
            className="p-2 bg-graphite-800 hover:bg-graphite-850 text-paper-muted border border-hairline text-xs font-medium transition flex items-center gap-1.5"
            title="Refresh Products"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-signal-amber hover:bg-signal-amber/90 text-graphite-950 text-xs font-semibold transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add new SKU</span>
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="panel border-l-[3px] border-l-status-healthy p-4 text-status-healthy text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="panel p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-medium whitespace-nowrap transition capitalize ${
                categoryFilter === cat
                  ? 'text-signal-amber border-b-2 border-signal-amber'
                  : 'text-paper-muted hover:text-paper'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-paper-dim absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Search SKU or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-graphite-950 border border-hairline text-xs text-paper focus:outline-none focus:border-signal-amber font-mono"
          />
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((p) => (
          <div
            key={p.sku}
            className="panel hover:border-paper-dim/40 transition p-5 space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono text-signal-amber">
                    {p.sku}
                  </span>
                  <h3 className="text-sm font-semibold text-paper mt-1">{p.name}</h3>
                </div>
                <button
                  onClick={() => openEditModal(p)}
                  className="p-1.5 text-paper-muted hover:text-paper hover:bg-graphite-800 transition"
                  title="Edit SKU Policy"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <span className="text-[11px] text-paper-muted">
                  {p.category}
                </span>
                <span className="text-[11px] text-paper font-mono font-semibold">
                  ${typeof p.unit_price === 'number' ? p.unit_price.toFixed(2) : p.unit_price} / unit
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-hairline grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-graphite-950 border border-hairline">
                <p className="text-[10px] text-paper-muted">Safety buffer</p>
                <p className="font-mono font-semibold text-paper mt-0.5">{p.safety_stock || 200} units</p>
              </div>
              <div className="p-2.5 bg-graphite-950 border border-hairline">
                <p className="text-[10px] text-paper-muted">Supplier lead time</p>
                <p className="font-mono font-semibold text-paper mt-0.5">{p.lead_time_days || 4} days</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-950/80">
          <div className="w-full max-w-md bg-graphite-900 border border-hairline shadow-2xl p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-paper-muted hover:text-paper transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-hairline">
              <Package className="w-5 h-5 text-signal-amber shrink-0" />
              <div>
                <h2 className="text-lg font-display font-bold text-paper">
                  {editingProduct ? 'Edit SKU policy' : 'Create new product SKU'}
                </h2>
                <p className="text-xs text-paper-muted">Configure catalog metadata and replenishment policies</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-paper-muted font-medium mb-1">SKU identifier</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    required
                    disabled={!!editingProduct}
                    className="w-full px-3 py-2 bg-graphite-950 border border-hairline text-paper font-mono focus:outline-none focus:border-signal-amber disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-paper-muted font-medium mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-graphite-950 border border-hairline text-paper focus:outline-none focus:border-signal-amber"
                  >
                    <option value="Beverages">Beverages</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Home & Living">Home & Living</option>
                    <option value="Personal Care">Personal Care</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-paper-muted font-medium mb-1">Product title</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g. Organic Matcha Powder (100g)"
                  className="w-full px-3 py-2 bg-graphite-950 border border-hairline text-paper focus:outline-none focus:border-signal-amber"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-paper-muted font-medium mb-1">Unit price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                    required
                    className="w-full px-2.5 py-2 bg-graphite-950 border border-hairline text-paper font-mono"
                  />
                </div>
                <div>
                  <label className="block text-paper-muted font-medium mb-1">Safety stock</label>
                  <input
                    type="number"
                    value={formData.safety_stock}
                    onChange={(e) => setFormData({ ...formData, safety_stock: e.target.value })}
                    required
                    className="w-full px-2.5 py-2 bg-graphite-950 border border-hairline text-paper font-mono"
                  />
                </div>
                <div>
                  <label className="block text-paper-muted font-medium mb-1">Lead time (d)</label>
                  <input
                    type="number"
                    value={formData.lead_time_days}
                    onChange={(e) => setFormData({ ...formData, lead_time_days: e.target.value })}
                    required
                    className="w-full px-2.5 py-2 bg-graphite-950 border border-hairline text-paper font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-graphite-800 hover:bg-graphite-850 text-paper font-semibold transition border border-hairline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-signal-amber hover:bg-signal-amber/90 text-graphite-950 font-semibold transition"
                >
                  {editingProduct ? 'Save changes' : 'Create SKU'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
