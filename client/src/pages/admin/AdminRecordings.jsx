import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Save, Clock } from 'lucide-react';
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

const formatDuration = (s) => s ? `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m` : '—';
const EMPTY = { title: '', description: '', mediumId: '', muxPlaybackId: '', videoUrl: '', thumbnailUrl: '', durationSeconds: 0, requiredTier: 'basic', instructor: '', isPublished: false, isFeatured: false };

const AdminRecordings = () => {
  const [recordings, setRecordings] = useState([]);
  const [mediums, setMediums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => {
    Promise.all([api.get('/recordings'), api.get('/mediums')])
      .then(([r, m]) => { setRecordings(r.data.data || []); setMediums(m.data.data || []); })
      .catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY); setModal('create'); };
  const openEdit = (r) => {
    setForm({ title: r.title, description: r.description, mediumId: r.mediumId?._id || r.mediumId, muxPlaybackId: r.muxPlaybackId || '', videoUrl: r.videoUrl || '', thumbnailUrl: r.thumbnailUrl || '', durationSeconds: r.durationSeconds || 0, requiredTier: r.requiredTier, instructor: r.instructor || '', isPublished: r.isPublished, isFeatured: r.isFeatured });
    setModal(r);
  };

  const handleSave = async () => {
    if (!form.title || !form.mediumId) { toast.error('Title and medium required'); return; }
    setSaving(true);
    try {
      if (modal === 'create') { await api.post('/recordings', form); toast.success('Recording created'); }
      else { await api.put(`/recordings/${modal._id}`, form); toast.success('Recording updated'); }
      setModal(null); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this recording?')) return;
    try { await api.delete(`/recordings/${id}`); toast.success('Deleted'); setRecordings(r => r.filter(x => x._id !== id)); }
    catch { toast.error('Delete failed'); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-charcoal-900">Recorded Sessions</h1>
          <p className="text-charcoal-500 text-sm">{recordings.length} recordings</p>
        </div>
        <button onClick={openCreate} className="btn-primary btn-sm"><Plus className="w-4 h-4" /> Add Recording</button>
      </div>

      {loading ? <LoadingState /> : recordings.length === 0 ? (
        <EmptyState title="No recordings yet" action={<button onClick={openCreate} className="btn-primary btn-sm">Add First Recording</button>} />
      ) : (
        <div className="card overflow-hidden">
          <table className="table-art">
            <thead><tr><th>Recording</th><th>Duration</th><th>Tier</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
            <tbody>
              {recordings.map(r => (
                <tr key={r._id}>
                  <td>
                    <div className="flex items-center gap-3">
                      {r.thumbnailUrl && <img src={r.thumbnailUrl} alt={r.title} className="w-14 h-10 object-cover rounded-lg shrink-0" />}
                      <div>
                        <p className="font-medium text-charcoal-800">{r.title}</p>
                        <p className="text-xs text-charcoal-400">{r.mediumId?.name} · {r.instructor}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-sm text-charcoal-600 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {formatDuration(r.durationSeconds)}</td>
                  <td><span className="badge badge-primary">{r.requiredTier}</span></td>
                  <td>
                    <div className="flex flex-col gap-1">
                      <span className={`badge ${r.isPublished ? 'badge-success' : 'badge-muted'}`}>{r.isPublished ? 'Published' : 'Draft'}</span>
                      {r.isFeatured && <span className="badge badge-warning">Featured</span>}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(r)} className="btn-ghost btn-sm"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(r._id)} className="btn-ghost btn-sm text-red-400 hover:text-red-500 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title={modal === 'create' ? 'Add Recording' : 'Edit Recording'} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div><label className="label">Title *</label><input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><label className="label">Description</label><textarea className="input" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div><label className="label">Medium *</label>
              <select className="input" value={form.mediumId} onChange={e => setForm(f => ({ ...f, mediumId: e.target.value }))}>
                <option value="">Select</option>{mediums.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
              </select>
            </div>
            <div><label className="label">Mux Playback ID</label><input className="input" value={form.muxPlaybackId} onChange={e => setForm(f => ({ ...f, muxPlaybackId: e.target.value }))} placeholder="Paste Mux playback ID" /></div>
            <div><label className="label">Fallback Video URL</label><input className="input" value={form.videoUrl} onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))} placeholder="https://..." /></div>
            <div><label className="label">Thumbnail URL</label><input className="input" value={form.thumbnailUrl} onChange={e => setForm(f => ({ ...f, thumbnailUrl: e.target.value }))} placeholder="https://..." /></div>
            <div><label className="label">Duration (seconds)</label><input type="number" className="input" value={form.durationSeconds} onChange={e => setForm(f => ({ ...f, durationSeconds: Number(e.target.value) }))} /></div>
            <div><label className="label">Instructor</label><input className="input" value={form.instructor} onChange={e => setForm(f => ({ ...f, instructor: e.target.value }))} /></div>
            <div><label className="label">Required Tier</label>
              <select className="input" value={form.requiredTier} onChange={e => setForm(f => ({ ...f, requiredTier: e.target.value }))}>
                <option value="basic">Basic</option><option value="pro">Pro</option><option value="studio">Studio</option>
              </select>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isPublished} onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))} /><span className="text-sm">Published</span></label>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isFeatured} onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))} /><span className="text-sm">Featured</span></label>
            </div>
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

export default AdminRecordings;
