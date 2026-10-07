import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import {
  Layers,
  Plus,
  ArrowLeft,
  Edit2,
  Trash2,
  CheckCircle2,
  Wrench,
  DollarSign,
  X
} from 'lucide-react';

export default function CategoryManagerPage() {
  const { success, error } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add / Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'Wrench',
    basePrice: 50,
    hourlyRateEstimate: 65,
    skillsList: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories?all=true');
      if (res.success) {
        setCategories(res.data);
      }
    } catch (err) {
      error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingCat(null);
    setFormData({
      name: '',
      description: '',
      icon: 'Wrench',
      basePrice: 50,
      hourlyRateEstimate: 65,
      skillsList: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCat(cat);
    setFormData({
      name: cat.name,
      description: cat.description,
      icon: cat.icon || 'Wrench',
      basePrice: cat.basePrice,
      hourlyRateEstimate: cat.hourlyRateEstimate || 65,
      skillsList: (cat.skillsList || []).join(', ')
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        icon: formData.icon,
        basePrice: Number(formData.basePrice),
        hourlyRateEstimate: Number(formData.hourlyRateEstimate),
        skillsList: formData.skillsList.split(',').map((s) => s.trim()).filter(Boolean)
      };

      if (editingCat) {
        await api.put(`/categories/${editingCat._id}`, payload);
        success('Category updated successfully!');
      } else {
        await api.post('/categories', payload);
        success('Category created successfully!');
      }
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      error(err.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (catId) => {
    if (!window.confirm('Are you sure you want to deactivate this category?')) return;
    try {
      await api.delete(`/categories/${catId}`);
      success('Category deactivated');
      fetchCategories();
    } catch (err) {
      error(err.message || 'Failed to deactivate category');
    }
  };

  if (loading) {
    return <div className="max-w-6xl mx-auto p-12 text-center text-slate-500">Loading categories...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Admin Hub</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Service Categories & Skills Taxonomy
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Define the service verticals, pricing minimums, and skill taxonomies used for AI request classification.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-md shadow-violet-200 transition flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Service Category</span>
          </button>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => (
          <div
            key={cat._id}
            className={`bg-white rounded-3xl p-6 border shadow-sm flex flex-col justify-between ${
              cat.isActive ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-extrabold text-slate-900 text-lg">
                  {cat.name}
                </span>
                <span className="text-xs font-extrabold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-full border border-violet-200">
                  ${cat.basePrice} base
                </span>
              </div>

              <p className="text-xs text-slate-600 mb-4 line-clamp-2 leading-relaxed">
                {cat.description}
              </p>

              {/* Skills Tags */}
              <div className="space-y-1 mb-4">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Required Skills Taxonomy ({cat.skillsList?.length || 0}):
                </span>
                <div className="flex flex-wrap gap-1">
                  {cat.skillsList?.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Hourly est: ~${cat.hourlyRateEstimate}/hr
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(cat)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-violet-600 hover:bg-violet-50 transition"
                  title="Edit Category"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                {cat.isActive && (
                  <button
                    onClick={() => handleDeactivate(cat._id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Deactivate"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Category Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-lg">
                {editingCat ? 'Edit Service Category' : 'Add New Service Category'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Roofing & Gutter Repair"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Base Price ($)</label>
                  <input
                    type="number"
                    required
                    min="20"
                    max="500"
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hourly Estimate ($)</label>
                  <input
                    type="number"
                    required
                    min="20"
                    max="500"
                    value={formData.hourlyRateEstimate}
                    onChange={(e) => setFormData({ ...formData, hourlyRateEstimate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows="2"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Scope of work and typical jobs handled in this category..."
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-violet-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Skills Taxonomy (comma-separated)
                </label>
                <input
                  type="text"
                  required
                  value={formData.skillsList}
                  onChange={(e) => setFormData({ ...formData, skillsList: e.target.value })}
                  placeholder="e.g. Shingle Replacement, Gutter Cleaning, Flashing Repair"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-violet-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Crucial: The AI request intake engine uses these skills to tag customer requests.
                </span>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-md shadow-violet-200 transition"
              >
                {saving ? 'Saving...' : 'Save Category'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
