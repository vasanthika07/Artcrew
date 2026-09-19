import React, { useEffect, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Palette,
  BookOpen,
  DollarSign,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';
import api from '../../api/axios';
import { toast } from '../../components/Toast';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/admin/ConfirmDialog';

const DIFF_OPTIONS = ['Beginner', 'Intermediate', 'Advanced'];
const RESOURCE_TYPES = ['guide', 'video', 'course', 'community', 'supply-list', 'tips'];

const EMPTY_MEDIUM = {
  name: '',
  description: '',
  coverImage: '',
  difficulty: 'Beginner',
  estimatedBudget: '',
  supplies: '',
  beginnerGuide: '',
};

const EMPTY_RESOURCE = {
  title: '',
  description: '',
  url: '',
  resourceType: 'guide',
  level: 'beginner',
  isFree: true,
  provider: 'YouTube',
};

const AdminMediums = () => {
  const [mediums, setMediums] = useState([]);
  const [loading, setLoading] = useState(true);

  // Medium Modal
  const [modalMode, setModalMode] = useState(null); // null | 'create' | 'edit'
  const [editingMedium, setEditingMedium] = useState(null);
  const [form, setForm] = useState(EMPTY_MEDIUM);
  const [saving, setSaving] = useState(false);

  // Nested Resources Modal
  const [activeResourceMedium, setActiveResourceMedium] = useState(null);
  const [resources, setResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [resourceForm, setResourceForm] = useState(EMPTY_RESOURCE);
  const [savingResource, setSavingResource] = useState(false);

  // Delete Confirmations
  const [deletingMediumId, setDeletingMediumId] = useState(null);
  const [deletingLoading, setDeletingLoading] = useState(false);
  const [deletingResourceId, setDeletingResourceId] = useState(null);

  const loadMediums = () => {
    setLoading(true);
    api
      .get('/mediums')
      .then((r) => setMediums(r.data.data || []))
      .catch((err) => {
        console.error('Failed to load mediums:', err);
        toast.error('Failed to load art mediums');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMediums();
  }, []);

  const openCreate = () => {
    setForm(EMPTY_MEDIUM);
    setEditingMedium(null);
    setModalMode('create');
  };

  const openEdit = (m) => {
    setForm({
      name: m.name,
      description: m.description,
      coverImage: m.coverImage || '',
      difficulty: m.difficulty || 'Beginner',
      estimatedBudget: m.estimatedBudget || '',
      supplies: m.supplies?.join(', ') || '',
      beginnerGuide: m.beginnerGuide || '',
    });
    setEditingMedium(m);
    setModalMode('edit');
  };

  const handleSaveMedium = async (e) => {
    e.preventDefault();
    if (!form.name || !form.description) {
      toast.error('Medium name and description are required');
      return;
    }

    setSaving(true);
    const payload = {
      ...form,
      supplies: form.supplies
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };

    try {
      if (modalMode === 'create') {
        await api.post('/mediums', payload);
        toast.success('Art medium created successfully');
      } else {
        await api.put(`/mediums/${editingMedium._id}`, payload);
        toast.success('Art medium updated successfully');
      }
      setModalMode(null);
      loadMediums();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteMedium = async () => {
    if (!deletingMediumId) return;
    setDeletingLoading(true);
    try {
      await api.delete(`/mediums/${deletingMediumId}`);
      toast.success('Medium deleted');
      setMediums((prev) => prev.filter((m) => m._id !== deletingMediumId));
      setDeletingMediumId(null);
    } catch (err) {
      toast.error('Delete failed');
    } finally {
      setDeletingLoading(false);
    }
  };

  // --- Resource Management ---
  const openResourcesModal = async (medium) => {
    setActiveResourceMedium(medium);
    setLoadingResources(true);
    try {
      const { data } = await api.get(`/mediums/${medium._id}/resources`);
      setResources(data.data || []);
    } catch (err) {
      toast.error('Failed to load resources for this medium');
    } finally {
      setLoadingResources(false);
    }
  };

  const handleAddResource = async (e) => {
    e.preventDefault();
    if (!resourceForm.title || !resourceForm.url) {
      toast.error('Title and URL required');
      return;
    }

    setSavingResource(true);
    try {
      const { data } = await api.post(`/mediums/${activeResourceMedium._id}/resources`, resourceForm);
      toast.success('Resource added to medium');
      setResources((prev) => [data.data, ...prev]);
      setResourceForm(EMPTY_RESOURCE);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add resource');
    } finally {
      setSavingResource(false);
    }
  };

  const handleDeleteResource = async (resourceId) => {
    try {
      await api.delete(`/mediums/${activeResourceMedium._id}/resources/${resourceId}`);
      toast.success('Resource removed');
      setResources((prev) => prev.filter((r) => r._id !== resourceId));
    } catch (err) {
      toast.error('Failed to remove resource');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Delete Medium Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingMediumId}
        title="Delete Art Medium"
        message="Are you sure you want to delete this art medium? All associated resources will also be removed."
        confirmText="Delete Medium"
        isLoading={deletingLoading}
        onConfirm={confirmDeleteMedium}
        onClose={() => setDeletingMediumId(null)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-charcoal-900">
            Manage Art Mediums
          </h1>
          <p className="text-charcoal-500 text-sm mt-0.5">
            {mediums.length} art mediums configured
          </p>
        </div>
        <button
          onClick={openCreate}
          className="btn-primary btn-sm inline-flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Medium
        </button>
      </div>

      {/* Mediums Table */}
      {loading ? (
        <LoadingState message="Loading art mediums..." />
      ) : mediums.length === 0 ? (
        <EmptyState
          title="No mediums configured"
          action={
            <button onClick={openCreate} className="btn-primary btn-sm">
              <Plus className="w-4 h-4" /> Add First Medium
            </button>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-art w-full">
              <thead>
                <tr>
                  <th>Medium</th>
                  <th>Difficulty</th>
                  <th>Starting Budget</th>
                  <th>Supplies</th>
                  <th>Resources</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mediums.map((m) => (
                  <tr key={m._id}>
                    <td>
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-charcoal-100 overflow-hidden shrink-0 border border-charcoal-200">
                          {m.coverImage ? (
                            <img
                              src={m.coverImage}
                              alt={m.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-charcoal-400">
                              <Palette className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-charcoal-900 text-sm">{m.name}</p>
                          <p className="text-xs text-charcoal-500 line-clamp-1 max-w-xs">
                            {m.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          m.difficulty === 'Beginner'
                            ? 'badge-success'
                            : m.difficulty === 'Intermediate'
                            ? 'badge-warning'
                            : 'badge-danger'
                        }`}
                      >
                        {m.difficulty}
                      </span>
                    </td>
                    <td className="text-sm font-semibold text-charcoal-700">
                      {m.estimatedBudget || 'Varies'}
                    </td>
                    <td>
                      <span className="text-xs text-charcoal-600">
                        {m.supplies?.length || 0} items
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => openResourcesModal(m)}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-canvas-50 text-canvas-700 hover:bg-canvas-100 transition-colors cursor-pointer border border-canvas-200"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        Manage Resources
                      </button>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(m)}
                          className="btn-ghost btn-sm"
                          title="Edit Medium"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingMediumId(m._id)}
                          className="btn-ghost btn-sm text-red-500 hover:bg-red-50"
                          title="Delete Medium"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Medium Modal */}
      {modalMode && (
        <div className="fixed inset-0 bg-charcoal-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-charcoal-100 animate-fade-up max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-charcoal-100">
              <h3 className="font-display font-bold text-lg text-charcoal-900">
                {modalMode === 'create' ? 'Create Art Medium' : 'Edit Art Medium'}
              </h3>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="p-1 rounded-lg text-charcoal-400 hover:text-charcoal-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMedium} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="label">Medium Name *</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Watercolour Paintings"
                  required
                />
              </div>

              <div>
                <label className="label">Description *</label>
                <textarea
                  className="input"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Overview of this medium..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Difficulty Level</label>
                  <select
                    className="input"
                    value={form.difficulty}
                    onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}
                  >
                    {DIFF_OPTIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Estimated Budget</label>
                  <input
                    className="input"
                    value={form.estimatedBudget}
                    onChange={(e) => setForm((f) => ({ ...f, estimatedBudget: e.target.value }))}
                    placeholder="e.g. ₹1,500 - ₹3,500"
                  />
                </div>
              </div>

              <div>
                <label className="label">Cover Image URL</label>
                <input
                  className="input"
                  value={form.coverImage}
                  onChange={(e) => setForm((f) => ({ ...f, coverImage: e.target.value }))}
                  placeholder="https://images.unsplash.com/..."
                />
                {form.coverImage && (
                  <div className="mt-2 h-28 rounded-xl overflow-hidden border border-charcoal-200 bg-charcoal-100">
                    <img
                      src={form.coverImage}
                      alt="Cover Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="label">Required Supplies (comma-separated)</label>
                <textarea
                  className="input"
                  rows={2}
                  value={form.supplies}
                  onChange={(e) => setForm((f) => ({ ...f, supplies: e.target.value }))}
                  placeholder="Round Brushes, 300gsm Paper, Watercolour palette, Water container"
                />
              </div>

              <div>
                <label className="label">Beginner Guide / Tips</label>
                <textarea
                  className="input"
                  rows={3}
                  value={form.beginnerGuide}
                  onChange={(e) => setForm((f) => ({ ...f, beginnerGuide: e.target.value }))}
                  placeholder="Quick tips for first-time artists..."
                />
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
                  Save Medium
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Nested Learning Resources Modal */}
      {activeResourceMedium && (
        <div className="fixed inset-0 bg-charcoal-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-charcoal-100 animate-fade-up max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-charcoal-100 bg-charcoal-50/50">
              <div>
                <span className="text-xs uppercase font-bold text-canvas-600 tracking-wider">
                  Learning Resources
                </span>
                <h3 className="font-display font-bold text-lg text-charcoal-900">
                  {activeResourceMedium.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveResourceMedium(null)}
                className="p-1 rounded-lg text-charcoal-400 hover:text-charcoal-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Add New Resource Form */}
              <form onSubmit={handleAddResource} className="p-4 rounded-2xl bg-canvas-50/50 border border-canvas-200 space-y-3">
                <p className="font-bold text-xs uppercase tracking-wider text-canvas-700">
                  Add Learning Resource
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label text-[11px]">Resource Title *</label>
                    <input
                      className="input text-xs py-1.5"
                      value={resourceForm.title}
                      onChange={(e) => setResourceForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="e.g. Masterclass on Colour Mixing"
                      required
                    />
                  </div>
                  <div>
                    <label className="label text-[11px]">URL Link *</label>
                    <input
                      className="input text-xs py-1.5"
                      value={resourceForm.url}
                      onChange={(e) => setResourceForm((f) => ({ ...f, url: e.target.value }))}
                      placeholder="https://..."
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="label text-[11px]">Type</label>
                    <select
                      className="input text-xs py-1.5"
                      value={resourceForm.resourceType}
                      onChange={(e) => setResourceForm((f) => ({ ...f, resourceType: e.target.value }))}
                    >
                      {RESOURCE_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label text-[11px]">Provider</label>
                    <input
                      className="input text-xs py-1.5"
                      value={resourceForm.provider}
                      onChange={(e) => setResourceForm((f) => ({ ...f, provider: e.target.value }))}
                      placeholder="YouTube / Skillshare"
                    />
                  </div>
                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-charcoal-700">
                      <input
                        type="checkbox"
                        checked={resourceForm.isFree}
                        onChange={(e) => setResourceForm((f) => ({ ...f, isFree: e.target.checked }))}
                      />
                      <span>Free Resource</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={savingResource}
                    className="btn-primary btn-sm"
                  >
                    {savingResource ? 'Adding...' : '+ Add Resource'}
                  </button>
                </div>
              </form>

              {/* Resource List */}
              <div className="space-y-2">
                <p className="font-bold text-xs uppercase tracking-wider text-charcoal-500 font-mono">
                  Existing Resources ({resources.length})
                </p>

                {loadingResources ? (
                  <p className="text-xs text-charcoal-400 py-4 text-center">Loading resources...</p>
                ) : resources.length === 0 ? (
                  <p className="text-xs text-charcoal-400 py-4 text-center bg-charcoal-50 rounded-xl">
                    No learning resources added for this medium yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {resources.map((res) => (
                      <div
                        key={res._id}
                        className="p-3 rounded-xl border border-charcoal-100 bg-white flex items-center justify-between gap-3 hover:border-canvas-200 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-charcoal-900 text-xs truncate">
                              {res.title}
                            </span>
                            <span className="badge badge-muted text-[10px] uppercase">
                              {res.resourceType}
                            </span>
                            {res.isFree ? (
                              <span className="badge badge-success text-[10px]">Free</span>
                            ) : (
                              <span className="badge badge-warning text-[10px]">Paid</span>
                            )}
                          </div>
                          <a
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-canvas-600 hover:underline truncate block mt-0.5"
                          >
                            {res.url}
                          </a>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteResource(res._id)}
                          className="p-1.5 rounded-lg text-charcoal-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Remove resource"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-charcoal-100 bg-charcoal-50 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveResourceMedium(null)}
                className="btn-primary btn-sm px-6"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMediums;
