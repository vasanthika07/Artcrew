import React, { useEffect, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Search,
  Filter,
  Image as ImageIcon,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import api from '../../api/axios';
import { toast } from '../../components/Toast';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/admin/ConfirmDialog';

const EMPTY_FORM = {
  title: '',
  mediumId: '',
  imageUrl: '',
  description: '',
  artist: '',
  isFeatured: false,
  isPublished: true,
  order: 0,
};

const AdminGallery = () => {
  const [items, setItems] = useState([]);
  const [mediums, setMediums] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search
  const [search, setSearch] = useState('');
  const [selectedMedium, setSelectedMedium] = useState('all');
  const [filterFeatured, setFilterFeatured] = useState('all');

  // Modals & Forms
  const [modalMode, setModalMode] = useState(null); // null | 'create' | 'edit'
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Delete Confirmation
  const [deletingId, setDeletingId] = useState(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.get('/gallery?limit=100&all=true'),
      api.get('/mediums'),
    ])
      .then(([gRes, mRes]) => {
        setItems(gRes.data.data || []);
        setMediums(mRes.data.data || []);
      })
      .catch((err) => {
        console.error('Failed to load gallery:', err);
        toast.error('Failed to load gallery items');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreate = () => {
    setForm({
      ...EMPTY_FORM,
      mediumId: mediums[0]?._id || '',
    });
    setEditingItem(null);
    setModalMode('create');
  };

  const openEdit = (item) => {
    setForm({
      title: item.title,
      mediumId: item.mediumId?._id || item.mediumId,
      imageUrl: item.imageUrl,
      description: item.description || '',
      artist: item.artist || '',
      isFeatured: item.isFeatured || false,
      isPublished: item.isPublished !== undefined ? item.isPublished : true,
      order: item.order || 0,
    });
    setEditingItem(item);
    setModalMode('edit');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title || !form.mediumId || !form.imageUrl) {
      toast.error('Title, medium, and image URL are required');
      return;
    }

    setSaving(true);
    try {
      if (modalMode === 'create') {
        await api.post('/gallery', form);
        toast.success('Artwork created successfully');
      } else {
        await api.put(`/gallery/${editingItem._id}`, form);
        toast.success('Artwork updated successfully');
      }
      setModalMode(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    setDeletingLoading(true);
    try {
      await api.delete(`/gallery/${deletingId}`);
      toast.success('Gallery artwork deleted');
      setItems((prev) => prev.filter((x) => x._id !== deletingId));
      setDeletingId(null);
    } catch (err) {
      toast.error('Failed to delete artwork');
    } finally {
      setDeletingLoading(false);
    }
  };

  // Filter items in memory
  const filtered = items.filter((item) => {
    const matchesSearch =
      item.title?.toLowerCase().includes(search.toLowerCase()) ||
      item.artist?.toLowerCase().includes(search.toLowerCase());

    const mediumId = item.mediumId?._id || item.mediumId;
    const matchesMedium = selectedMedium === 'all' || mediumId === selectedMedium;

    const matchesFeatured =
      filterFeatured === 'all' ||
      (filterFeatured === 'featured' && item.isFeatured) ||
      (filterFeatured === 'standard' && !item.isFeatured);

    return matchesSearch && matchesMedium && matchesFeatured;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingId}
        title="Delete Artwork"
        message="Are you sure you want to permanently delete this artwork from the gallery? This action cannot be undone."
        confirmText="Delete Artwork"
        isLoading={deletingLoading}
        onConfirm={confirmDelete}
        onClose={() => setDeletingId(null)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-charcoal-900">
            Manage Gallery
          </h1>
          <p className="text-charcoal-500 text-sm mt-0.5">
            {items.length} total artworks in catalog
          </p>
        </div>
        <button
          onClick={openCreate}
          className="btn-primary btn-sm inline-flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Artwork
        </button>
      </div>

      {/* Filters & Search Bar */}
      <div className="card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or artist..."
            className="input pl-9 w-full text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={selectedMedium}
            onChange={(e) => setSelectedMedium(e.target.value)}
            className="input text-xs py-1.5"
          >
            <option value="all">All Mediums</option>
            {mediums.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name}
              </option>
            ))}
          </select>

          <select
            value={filterFeatured}
            onChange={(e) => setFilterFeatured(e.target.value)}
            className="input text-xs py-1.5"
          >
            <option value="all">All Status</option>
            <option value="featured">Featured Only</option>
            <option value="standard">Standard Only</option>
          </select>
        </div>
      </div>

      {/* Grid of Artworks */}
      {loading ? (
        <LoadingState message="Loading gallery artworks..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No gallery items found"
          description="Try adjusting your search query or add a new artwork to the catalog."
          action={
            <button onClick={openCreate} className="btn-primary btn-sm">
              <Plus className="w-4 h-4" /> Add First Artwork
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((item) => (
            <div
              key={item._id}
              className="group relative card overflow-hidden flex flex-col justify-between hover:shadow-card-hover transition-all"
            >
              <div className="aspect-square relative overflow-hidden bg-charcoal-900">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />

                {item.isFeatured && (
                  <span className="absolute top-2 left-2 badge bg-canvas-500 text-charcoal-950 font-bold text-[10px] shadow-sm">
                    ★ Featured
                  </span>
                )}

                {/* Hover Actions */}
                <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    title="Edit artwork"
                    className="w-8 h-8 rounded-xl bg-white/95 shadow-md flex items-center justify-center text-charcoal-700 hover:text-canvas-600 cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingId(item._id)}
                    title="Delete artwork"
                    className="w-8 h-8 rounded-xl bg-white/95 shadow-md flex items-center justify-center text-charcoal-700 hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-3">
                <p className="font-semibold text-charcoal-900 text-sm truncate" title={item.title}>
                  {item.title}
                </p>
                <div className="flex items-center justify-between text-xs text-charcoal-500 mt-1">
                  <span className="truncate">{item.mediumId?.name || 'Medium'}</span>
                  {item.artist && <span className="text-[11px] text-charcoal-400 truncate">By {item.artist}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalMode && (
        <div className="fixed inset-0 bg-charcoal-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-charcoal-100 animate-fade-up max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-charcoal-100">
              <h3 className="font-display font-bold text-lg text-charcoal-900">
                {modalMode === 'create' ? 'Add New Artwork' : 'Edit Artwork'}
              </h3>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="p-1 rounded-lg text-charcoal-400 hover:text-charcoal-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="label">Artwork Title *</label>
                <input
                  className="input"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Monsoon Sunset on Canvas"
                  required
                />
              </div>

              <div>
                <label className="label">Assigned Medium *</label>
                <select
                  className="input"
                  value={form.mediumId}
                  onChange={(e) => setForm((f) => ({ ...f, mediumId: e.target.value }))}
                  required
                >
                  <option value="">Select art medium</option>
                  {mediums.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Image URL *</label>
                <input
                  className="input"
                  value={form.imageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                  placeholder="https://images.unsplash.com/..."
                  required
                />
                {form.imageUrl && (
                  <div className="mt-2 rounded-xl overflow-hidden border border-charcoal-200 h-32 bg-charcoal-100">
                    <img
                      src={form.imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => (e.target.style.display = 'none')}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="label">Artist Name</label>
                <input
                  className="input"
                  value={form.artist}
                  onChange={(e) => setForm((f) => ({ ...f, artist: e.target.value }))}
                  placeholder="e.g. Priya Sharma"
                />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  className="input"
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Brief story or technique details..."
                />
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-charcoal-700 font-medium">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
                    className="rounded"
                  />
                  <span>Feature on Home Page</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-sm text-charcoal-700 font-medium">
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
                    className="rounded"
                  />
                  <span>Published</span>
                </label>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-charcoal-100">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="btn-ghost flex-1 justify-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1 justify-center cursor-pointer"
                >
                  {saving ? (
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Artwork
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGallery;
