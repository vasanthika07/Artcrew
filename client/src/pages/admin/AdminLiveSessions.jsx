import { useEffect, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Search,
  Filter,
  Radio,
  Clock,
  Calendar,
  User,
  Video,
  ExternalLink,
} from 'lucide-react';
import { format } from 'date-fns';
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

const STATUS_BADGE = {
  scheduled: 'badge-muted',
  live: 'badge-danger animate-pulse',
  ended: 'badge-muted opacity-75',
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
  scheduledAt: '',
  durationMinutes: 60,
  streamUrl: '',
  thumbnailUrl: '',
  requiredTier: 'basic',
  status: 'scheduled',
  host: '',
  isPublished: true,
};

const AdminLiveSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [mediums, setMediums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [mediumFilter, setMediumFilter] = useState('all');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    Promise.all([api.get('/live-sessions'), api.get('/mediums')])
      .then(([s, m]) => {
        setSessions(s.data.data || []);
        setMediums(m.data.data || []);
      })
      .catch((err) => {
        console.error(err);
        toast.error('Failed to load live sessions');
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

  const openEdit = (s) => {
    setForm({
      title: s.title,
      description: s.description || '',
      mediumId: s.mediumId?._id || s.mediumId || '',
      scheduledAt: s.scheduledAt ? new Date(s.scheduledAt).toISOString().slice(0, 16) : '',
      durationMinutes: s.durationMinutes || 60,
      streamUrl: s.streamUrl || '',
      thumbnailUrl: s.thumbnailUrl || '',
      requiredTier: s.requiredTier || 'basic',
      status: s.status || 'scheduled',
      host: s.host || '',
      isPublished: s.isPublished ?? true,
    });
    setModal(s);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.mediumId) {
      toast.error('Title and Medium are required');
      return;
    }
    setSaving(true);
    try {
      if (modal === 'create') {
        await api.post('/live-sessions', form);
        toast.success('Live session scheduled');
      } else {
        await api.put(`/live-sessions/${modal._id}`, form);
        toast.success('Live session updated');
      }
      setModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickStatus = async (session, newStatus) => {
    try {
      await api.put(`/live-sessions/${session._id}`, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      setSessions((prev) =>
        prev.map((s) => (s._id === session._id ? { ...s, status: newStatus } : s))
      );
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/live-sessions/${deleteTarget._id}`);
      toast.success('Live session deleted');
      setSessions((prev) => prev.filter((s) => s._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      s.title?.toLowerCase().includes(search.toLowerCase()) ||
      s.host?.toLowerCase().includes(search.toLowerCase()) ||
      s.mediumId?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchesMedium =
      mediumFilter === 'all' || (s.mediumId?._id || s.mediumId) === mediumFilter;
    return matchesSearch && matchesStatus && matchesMedium;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-charcoal-900">Live Sessions</h1>
          <p className="text-charcoal-500 text-sm">
            Schedule, manage broadcast streams, and monitor live workshops
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary btn-sm self-start sm:self-auto">
          <Plus className="w-4 h-4" /> Schedule Session
        </button>
      </div>

      {/* Filters & Search */}
      <div className="card p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sessions by title, host, or medium..."
            className="input pl-9 w-full"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="input py-2 text-sm w-auto"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="live">🔴 Live</option>
            <option value="ended">Ended</option>
          </select>
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
        </div>
      </div>

      {/* Table Content */}
      {loading ? (
        <LoadingState />
      ) : filteredSessions.length === 0 ? (
        <EmptyState
          title="No live sessions found"
          description={
            sessions.length === 0
              ? 'Schedule your first live workshop session.'
              : 'Try adjusting your search or filters.'
          }
          action={
            sessions.length === 0 && (
              <button onClick={openCreate} className="btn-primary btn-sm">
                <Plus className="w-4 h-4" /> Schedule First Session
              </button>
            )
          }
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-art">
            <thead>
              <tr>
                <th>Session & Host</th>
                <th>Scheduled Time</th>
                <th>Status</th>
                <th>Required Tier</th>
                <th>Visibility</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((s) => (
                <tr key={s._id}>
                  <td>
                    <div className="flex items-center gap-3">
                      {s.thumbnailUrl ? (
                        <img
                          src={s.thumbnailUrl}
                          alt={s.title}
                          className="w-12 h-10 object-cover rounded-lg shrink-0 border border-charcoal-100"
                        />
                      ) : (
                        <div className="w-12 h-10 rounded-lg bg-charcoal-100 flex items-center justify-center text-charcoal-400 shrink-0">
                          <Radio className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-charcoal-800 leading-tight">{s.title}</p>
                        <p className="text-xs text-charcoal-400 mt-0.5 flex items-center gap-1.5">
                          <span className="font-semibold text-terracotta-600">
                            {s.mediumId?.name || 'Medium'}
                          </span>
                          {s.host && (
                            <>
                              <span>•</span>
                              <span>Host: {s.host}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="text-sm text-charcoal-700 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-charcoal-400" />
                      {s.scheduledAt ? format(new Date(s.scheduledAt), 'dd MMM yyyy, p') : '—'}
                    </div>
                    <div className="text-xs text-charcoal-400 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {s.durationMinutes || 60} mins
                    </div>
                  </td>
                  <td>
                    <select
                      value={s.status}
                      onChange={(e) => handleQuickStatus(s, e.target.value)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer ${
                        s.status === 'live'
                          ? 'bg-red-50 text-red-600 border-red-200'
                          : s.status === 'scheduled'
                          ? 'bg-sky-50 text-sky-700 border-sky-200'
                          : 'bg-charcoal-100 text-charcoal-600 border-charcoal-200'
                      }`}
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="live">🔴 Live Now</option>
                      <option value="ended">Ended</option>
                    </select>
                  </td>
                  <td>
                    <span className={`badge ${TIER_BADGE[s.requiredTier] || 'badge-muted'}`}>
                      {s.requiredTier}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        s.isPublished ? 'badge-success' : 'badge-muted opacity-75'
                      }`}
                    >
                      {s.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      {s.streamUrl && (
                        <a
                          href={s.streamUrl}
                          target="_blank"
                          rel="noreferrer"
                          title="Open Stream URL"
                          className="btn-ghost btn-sm text-charcoal-400 hover:text-charcoal-700"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => openEdit(s)}
                        title="Edit Session"
                        className="btn-ghost btn-sm text-charcoal-600 hover:text-charcoal-900"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(s)}
                        title="Delete Session"
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
          title={modal === 'create' ? 'Schedule New Live Session' : 'Edit Live Session'}
          onClose={() => setModal(null)}
        >
          <div className="space-y-4">
            <div>
              <label className="label">Session Title *</label>
              <input
                className="input"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Master Watercolor Lighting & Shadows"
              />
            </div>

            <div>
              <label className="label">Description</label>
              <textarea
                className="input"
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Brief summary of what will be taught in this session..."
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
                <label className="label">Host / Instructor</label>
                <input
                  className="input"
                  value={form.host}
                  onChange={(e) => setForm((f) => ({ ...f, host: e.target.value }))}
                  placeholder="e.g. Master Elena Rostova"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Scheduled Date & Time *</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={form.scheduledAt}
                  onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                />
              </div>

              <div>
                <label className="label">Duration (Minutes)</label>
                <input
                  type="number"
                  className="input"
                  value={form.durationMinutes}
                  min={10}
                  max={480}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, durationMinutes: Number(e.target.value) }))
                  }
                />
              </div>
            </div>

            <div>
              <label className="label">Stream URL (HLS / YouTube / OBS / WebRTC)</label>
              <input
                className="input"
                value={form.streamUrl}
                onChange={(e) => setForm((f) => ({ ...f, streamUrl: e.target.value }))}
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
                <label className="label">Required Subscription Tier</label>
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

              <div>
                <label className="label">Session Status</label>
                <select
                  className="input"
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="live">Live Now</option>
                  <option value="ended">Ended</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
                className="rounded text-canvas-500 focus:ring-canvas-400"
              />
              <span className="text-sm text-charcoal-700 font-medium">
                Publish to student discovery feed
              </span>
            </label>

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
                Save Session
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Live Session"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmText="Delete Session"
        confirmVariant="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default AdminLiveSessions;
