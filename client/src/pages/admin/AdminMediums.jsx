import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Save } from 'lucide-react';
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

const DIFF = ['Beginner', 'Intermediate', 'Advanced'];
const EMPTY = { name: '', description: '', coverImage: '', difficulty: 'Beginner', estimatedBudget: '', supplies: '', beginnerGuide: '' };

const AdminMediums = () => {
  const [mediums, setMediums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/mediums').then(r => setMediums(r.data.data || [])).catch(console.error).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY); setModal('create'); };
  const openEdit = (m) => {
    setForm({ name: m.name, description: m.description, coverImage: m.coverImage || '', difficulty: m.difficulty, estimatedBudget: m.estimatedBudget || '', supplies: m.supplies?.join(', ') || '', beginnerGuide: m.beginnerGuide || '' });
    setModal(m);
  };

  const handleSave = async () => {
    if (!form.name || !form.description) { toast.error('Name and description required'); return; }
    setSaving(true);
    const payload = { ...form, supplies: form.supplies.split(',').map(s => s.trim()).filter(Boolean) };
    try {
      if (modal === 'create') { await api.post('/mediums', payload); toast.success('Medium created'); }
      else { await api.put(`/mediums/${modal._id}`, payload); toast.success('Medium updated'); }
      setModal(null); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this medium?')) return;
    try { await api.delete(`/mediums/${id}`); toast.success('Deleted'); setMediums(m => m.filter(x => x._id !== id)); }
    catch { toast.error('Delete failed'); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-charcoal-900">Art Mediums</h1>
          <p className="text-charcoal-500 text-sm">{mediums.length} mediums</p>
        </div>
        <button onClick={openCreate} className="btn-primary btn-sm"><Plus className="w-4 h-4" /> Add Medium</button>
      </div>

      {loading ? <LoadingState /> : mediums.length === 0 ? (
        <EmptyState title="No mediums yet" action={<button onClick={openCreate} className="btn-primary btn-sm">Add First Medium</button>} />
      ) : (
        <div className="card overflow-hidden">
          <table className="table-art">
            <thead><tr><th>Medium</th><th>Difficulty</th><th>Budget</th><th className="text-right">Actions</th></tr></thead>
            <tbody>
              {mediums.map(m => (
                <tr key={m._id}>
                  <td>
                    <div className="flex items-center gap-3">
                      {m.coverImage && <img src={m.coverImage} alt={m.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />}
                      <div>
                        <p className="font-medium text-charcoal-800">{m.name}</p>
                        <p className="text-xs text-charcoal-400 line-clamp-1">{m.description}</p>
                      </div>
                    </div>
                  </td>
                  <td><span className={`badge ${m.difficulty === 'Beginner' ? 'badge-success' : m.difficulty === 'Intermediate' ? 'badge-warning' : 'badge-danger'}`}>{m.difficulty}</span></td>
                  <td className="text-charcoal-600 text-sm">{m.estimatedBudget || '—'}</td>
                  <td>
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(m)} className="btn-ghost btn-sm"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(m._id)} className="btn-ghost btn-sm text-red-400 hover:text-red-500 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title={modal === 'create' ? 'Add Medium' : 'Edit Medium'} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div><label className="label">Name *</label><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Watercolour" /></div>
            <div><label className="label">Description *</label><textarea className="input" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div><label className="label">Cover Image URL</label><input className="input" value={form.coverImage} onChange={e => setForm(f => ({ ...f, coverImage: e.target.value }))} placeholder="https://..." /></div>
            <div>
              <label className="label">Difficulty</label>
              <select className="input" value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}>
                {DIFF.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div><label className="label">Estimated Budget</label><input className="input" value={form.estimatedBudget} onChange={e => setForm(f => ({ ...f, estimatedBudget: e.target.value }))} placeholder="₹1,500 - ₹3,000" /></div>
            <div><label className="label">Supplies (comma-separated)</label><textarea className="input" rows={2} value={form.supplies} onChange={e => setForm(f => ({ ...f, supplies: e.target.value }))} placeholder="Canvas, Brushes, Acrylic paints" /></div>
            <div><label className="label">Beginner Guide</label><textarea className="input" rows={3} value={form.beginnerGuide} onChange={e => setForm(f => ({ ...f, beginnerGuide: e.target.value }))} /></div>
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

export default AdminMediums;
