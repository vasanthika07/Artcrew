import { useEffect, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Clock,
  Search,
  Filter,
  Video,
  Sparkles,
  CheckCircle2,
  XCircle,
  Play,
} from 'lucide-react';
import api from '../../api/axios';
import { toast } from '../../components/Toast';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/admin/ConfirmDialog';

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-charcoal-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-dark w-full max-w-xl animate-fade-up max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between p-5 border-b border-charcoal-100">
        <h3 className="font-display font-semibold text-lg text-charcoal-900">{title}</h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-charcoal-100 text-charcoal-400 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
);

const formatDuration = (s) => {
  if (!s) return '0m';
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
};

const TIER_BADGE = {
  basic: 'badge-primary',
  pro: 'badge-warning',
  studio: 'badge-success',
};

const EMPTY = {
  title: '',
  description: '',
  mediumId: '',
  muxPlaybackId: '',
  videoUrl: '',
  thumbnailUrl: '',
  durationSeconds: 1800,
  requiredTier: 'basic',
  instructor: '',
  isPublished: true,
  isFeatured: false,
};

const AdminRecordings = () => {
  const [recordings, setRecordings] = useState([]);
  const [mediums, setMediums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mediumFilter, setMediumFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    Promise.all([api.get('/recordings'), api.get('/mediums')])
      .then(([r, m]) => {
        setRecordings(r.data.data || []);
        setMediums(m.data.data || []);
      })
      .catch((err) => {
        console.error(err);
        toast.error('Failed to load recordings');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setForm(EMPTY);
    setModal('create');
  };

  const openEdit = (r) => {
    setForm({
      title: r.title,
      description: r.description || '',
      mediumId: r.mediumId?._id || r.mediumId || '',
      muxPlaybackId: r.muxPlaybackId || '',
      videoUrl: r.videoUrl || '',
      thumbnailUrl: r.thumbnailUrl || '',
      durationSeconds: r.durationSeconds || 0,
      requiredTier: r.requiredTier || 'basic',
      instructor: r.instructor || '',
      isPublished: r.isPublished ?? false,
      isFeatured: r.isFeatured ?? false,
    });
    setModal(r);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.mediumId) {
      toast.error('Title and Medium are required');
      return;
    }
    setSaving(true);
    try {
      if (modal === 'create') {
        await api.post('/recordings', form);
        toast.success('Recording published');
      } else {
        await api.put(`/recordings/${modal._id}`, form);
        toast.success('Recording updated');
      }
      setModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublished = async (recording) => {
    const updated = !recording.isPublished;
    try {
      await api.put(`/recordings/${recording._id}`, { isPublished: updated });
      toast.success(updated ? 'Recording published' : 'Recording moved to draft');
      setRecordings((prev) =>
        prev.map((r) => (r._id === recording._id ? { ...r, isPublished: updated } : r))
      );
    } catch (err) {
      toast.error('Failed to update published status');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/recordings/${deleteTarget._id}`);
      toast.success('Recording deleted');
      setRecordings((prev) => prev.filter((x) => x._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = recordings.filter((r) => {
    const matchesSearch =
      r.title?.toLowerCase().includes(search.toLowerCase()) ||
      r.instructor?.toLowerCase().includes(search.toLowerCase()) ||
      r.mediumId?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesMedium =
      mediumFilter === 'all' || (r.mediumId?._id || r.mediumId) === mediumFilter;
    const matchesTier = tierFilter === 'all' || r.requiredTier === tierFilter;
    return matchesSearch && matchesMedium && matchesTier;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-charcoal-900">Recorded Sessions</h1>
          <p className="text-charcoal-500 text-sm">
            Manage on-demand video masterclasses, Mux streams, and required access tiers
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary btn-sm self-start sm:self-auto">
          <Plus className="w-4 h-4" /> Add Recording
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="card p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search recordings by title, instructor, or medium..."
            className="input pl-9 w-full"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="input py-2 text-sm w-auto"
            value={mediumFilter}
            onChange={(e) => setMediumFilter(e.target.value)}
          >
            <option value="all">All Mediums</option>
            {mediums.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name}
              </option>
            ))}
          </select>
          <select
            className="input py-2 text-sm w-auto"
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
          >
            <option value="all">All Tiers</option>
            <option value="basic">Basic</option>
            <option value="pro">Pro</option>
            <option value="studio">Studio</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      {loading ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No recordings found"
          description={
            recordings.length === 0
              ? 'Upload your first on-demand recorded workshop session.'
              : 'Try adjusting your search query or filters.'
          }
          action={
            recordings.length === 0 && (
              <button onClick={openCreate} className="btn-primary btn-sm">
                <Plus className="w-4 h-4" /> Add First Recording
              </button>
            )
          }
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-art">
            <thead>
              <tr>
                <th>Video & Instructor</th>
                <th>Medium</th>
                <th>Duration</th>
                <th>Required Tier</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r._id}>
                  <td>
                    <div className="flex items-center gap-3">
                      {r.thumbnailUrl ? (
                        <div className="relative group shrink-0">
                          <img
                            src={r.thumbnailUrl}
                            alt={r.title}
                            className="w-16 h-10 object-cover rounded-lg border border-charcoal-100"
                          />
                          <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-4 h-4 text-white fill-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-16 h-10 rounded-lg bg-charcoal-100 flex items-center justify-center text-charcoal-400 shrink-0">
                          <Video className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium text-charcoal-800 leading-tight">{r.title}</p>
                          {r.isFeatured && (
                            <span className="badge badge-warning text-[10px] py-0 px-1.5">
                              <Sparkles className="w-2.5 h-2.5 mr-0.5 inline" /> Featured
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-charcoal-400 mt-0.5">
                          Instructor: {r.instructor || 'Staff Instructor'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="text-sm font-semibold text-terracotta-600">
                      {r.mediumId?.name || '—'}
                    </span>
                  </td>
                  <td className="text-sm text-charcoal-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-charcoal-400" />
                      {formatDuration(r.durationSeconds)}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${TIER_BADGE[r.requiredTier] || 'badge-muted'}`}>
                      {r.requiredTier}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleTogglePublished(r)}
                      className={`badge cursor-pointer transition-transform hover:scale-105 ${
                        r.isPublished ? 'badge-success' : 'badge-muted opacity-75'
                      }`}
                      title="Click to toggle publish status"
                    >
                      {r.isPublished ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(r)}
                        title="Edit Recording"
                        className="btn-ghost btn-sm text-charcoal-600 hover:text-charcoal-900"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(r)}
                        title="Delete Recording"
                        className="btn-ghost btn-sm text-red-500 hover:bg-red-50"
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
      )}

      {/* Create / Edit Modal */}
      {modal && (
        <Modal
          title={modal === 'create' ? 'Add New Recorded Workshop' : 'Edit Recorded Workshop'}
          onClose={() => setModal(null)}
        >
          <div className="space-y-4">
            <div>
              <label className="label">Workshop Title *</label>
              <input
                className="input"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Acrylic Pouring Mastery: Cells and Waves"
              />
            </div>

            <div>
              <label className="label">Description</label>
              <textarea
                className="input"
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="In-depth step by step breakdown of technique and tools..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Art Medium *</label>
                <select
                  className="input"
                  value={form.mediumId}
                  onChange={(e) => setForm((f) => ({ ...f, mediumId: e.target.value }))}
                >
                  <option value="">Select Medium</option>
                  {mediums.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Instructor</label>
                <input
                  className="input"
                  value={form.instructor}
                  onChange={(e) => setForm((f) => ({ ...f, instructor: e.target.value }))}
                  placeholder="e.g. Master David Kim"
                />
              </div>
            </div>

            <div>
              <label className="label">Mux Playback ID</label>
              <input
                className="input"
                value={form.muxPlaybackId}
                onChange={(e) => setForm((f) => ({ ...f, muxPlaybackId: e.target.value }))}
                placeholder="e.g. aBc123XyZ..."
              />
              <p className="text-xs text-charcoal-400 mt-1">
                Used for adaptive HLS / DASH streaming via Mux video player.
              </p>
            </div>

            <div>
              <label className="label">Fallback Video URL (MP4/HLS)</label>
              <input
                className="input"
                value={form.videoUrl}
                onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="label">Thumbnail Image URL</label>
              <input
                className="input"
                value={form.thumbnailUrl}
                onChange={(e) => setForm((f) => ({ ...f, thumbnailUrl: e.target.value }))}
                placeholder="https://images.unsplash.com/..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Duration (Seconds)</label>
                <input
                  type="number"
                  className="input"
                  value={form.durationSeconds}
                  min={60}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, durationSeconds: Number(e.target.value) }))
                  }
                />
                <span className="text-xs text-charcoal-400 mt-0.5 block">
                  ≈ {formatDuration(form.durationSeconds)}
                </span>
              </div>

              <div>
                <label className="label">Required Tier</label>
                <select
                  className="input"
                  value={form.requiredTier}
                  onChange={(e) => setForm((f) => ({ ...f, requiredTier: e.target.value }))}
                >
                  <option value="basic">Basic</option>
                  <option value="pro">Pro</option>
                  <option value="studio">Studio</option>
                </select>
              </div>
            </div>

            <div className="flex gap-6 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
                  className="rounded text-canvas-500 focus:ring-canvas-400"
                />
                <span className="text-sm text-charcoal-700 font-medium">Published</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
                  className="rounded text-canvas-500 focus:ring-canvas-400"
                />
                <span className="text-sm text-charcoal-700 font-medium">Feature on Homepage</span>
              </label>
            </div>

            <div className="flex gap-2 pt-3 border-t border-charcoal-100">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="btn-ghost flex-1 justify-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex-1 justify-center"
              >
                {saving ? (
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Recording
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Recorded Session"
        message={`Are you sure you want to permanently delete "${deleteTarget?.title}"?`}
        confirmText="Delete Recording"
        confirmVariant="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default AdminRecordings;
