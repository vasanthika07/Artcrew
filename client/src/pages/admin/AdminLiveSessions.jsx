import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Save } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../api/axios';
import { toast } from '../../components/Toast';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-charcoal-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-dark w-full max-w-lg animate-fade-up max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between p-5 border-b border-charcoal-100">
        <h3 className="font-display font-semibold text-charcoal-900">{title}</h3>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-charcoal-100 text-charcoal-400"><X className="w-4 h-4" /></button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
);

const STATUS_STYLES = { scheduled: 'badge-muted', live: 'badge-danger', ended: 'badge-muted' };
const EMPTY = { title: '', description: '', mediumId: '', scheduledAt: '', durationMinutes: 60, streamUrl: '', thumbnailUrl: '', requiredTier: 'basic', status: 'scheduled', host: '', isPublished: true };

const AdminLiveSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [mediums, setMediums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => {
    Promise.all([api.get('/live-sessions'), api.get('/mediums')])
      .then(([s, m]) => { setSessions(s.data.data || []); setMediums(m.data.data || []); })
      .catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY); setModal('create'); };
  const openEdit = (s) => {
    setForm({ title: s.title, description: s.description, mediumId: s.mediumId?._id || s.mediumId, scheduledAt: s.scheduledAt?.slice(0, 16) || '', durationMinutes: s.durationMinutes, streamUrl: s.streamUrl || '', thumbnailUrl: s.thumbnailUrl || '', requiredTier: s.requiredTier, status: s.status, host: s.host || '', isPublished: s.isPublished });
    setModal(s);
  };

  const handleSave = async () => {
    if (!form.title || !form.mediumId) { toast.error('Title and medium required'); return; }
    setSaving(true);
    try {
      if (modal === 'create') { await api.post('/live-sessions', form); toast.success('Session created'); }
      else { await api.put(`/live-sessions/${modal._id}`, form); toast.success('Session updated'); }
      setModal(null); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this session?')) return;
    try { await api.delete(`/live-sessions/${id}`); toast.success('Deleted'); setSessions(s => s.filter(x => x._id !== id)); }
    catch { toast.error('Delete failed'); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-charcoal-900">Live Sessions</h1>
          <p className="text-charcoal-500 text-sm">{sessions.length} sessions</p>
        </div>
        <button onClick={openCreate} className="btn-primary btn-sm"><Plus className="w-4 h-4" /> Schedule Session</button>
      </div>

      {loading ? <LoadingState /> : sessions.length === 0 ? (
        <EmptyState title="No live sessions" action={<button onClick={openCreate} className="btn-primary btn-sm">Schedule First Session</button>} />
      ) : (
        <div className="card overflow-hidden">
          <table className="table-art">
            <thead><tr><th>Session</th><th>Scheduled</th><th>Status</th><th>Tier</th><th className="text-right">Actions</th></tr></thead>
            <tbody>
              {sessions.map(s => (
                <tr key={s._id}>
                  <td>
                    <p className="font-medium text-charcoal-800">{s.title}</p>
                    <p className="text-xs text-charcoal-400">{s.mediumId?.name} · {s.host}</p>
                  </td>
                  <td className="text-sm text-charcoal-600">{s.scheduledAt ? format(new Date(s.scheduledAt), 'dd MMM yyyy, p') : '—'}</td>
                  <td><span className={`badge ${STATUS_STYLES[s.status]}`}>{s.status}</span></td>
                  <td><span className="badge badge-primary">{s.requiredTier}</span></td>
                  <td>
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(s)} className="btn-ghost btn-sm"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(s._id)} className="btn-ghost btn-sm text-red-400 hover:text-red-500 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title={modal === 'create' ? 'Schedule Session' : 'Edit Session'} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div><label className="label">Title *</label><input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><label className="label">Description</label><textarea className="input" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div><label className="label">Medium *</label>
              <select className="input" value={form.mediumId} onChange={e => setForm(f => ({ ...f, mediumId: e.target.value }))}>
                <option value="">Select</option>{mediums.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
              </select>
            </div>
            <div><label className="label">Scheduled Date/Time *</label><input type="datetime-local" className="input" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} /></div>
            <div><label className="label">Duration (minutes)</label><input type="number" className="input" value={form.durationMinutes} onChange={e => setForm(f => ({ ...f, durationMinutes: Number(e.target.value) }))} /></div>
            <div><label className="label">Host</label><input className="input" value={form.host} onChange={e => setForm(f => ({ ...f, host: e.target.value }))} /></div>
            <div><label className="label">Stream URL</label><input className="input" value={form.streamUrl} onChange={e => setForm(f => ({ ...f, streamUrl: e.target.value }))} placeholder="https://..." /></div>
            <div><label className="label">Thumbnail URL</label><input className="input" value={form.thumbnailUrl} onChange={e => setForm(f => ({ ...f, thumbnailUrl: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Required Tier</label>
                <select className="input" value={form.requiredTier} onChange={e => setForm(f => ({ ...f, requiredTier: e.target.value }))}>
                  <option value="basic">Basic</option><option value="pro">Pro</option><option value="studio">Studio</option>
                </select>
              </div>
              <div><label className="label">Status</label>
                <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="scheduled">Scheduled</option><option value="live">Live</option><option value="ended">Ended</option>
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isPublished} onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))} />
              <span className="text-sm text-charcoal-700">Published</span>
            </label>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setModal(null)} className="btn-ghost flex-1 justify-center">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
                {saving ? <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Save className="w-4 h-4" />} Save
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminLiveSessions;
