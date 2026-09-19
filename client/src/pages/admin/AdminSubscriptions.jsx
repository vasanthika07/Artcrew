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

const EMPTY = { name: '', slug: '', description: '', price: 299, currency: 'INR', billingPeriod: 'monthly', includesAllMediums: false, includesLiveSessions: false, includesRecordedSessions: true, maxDevices: 2, features: '', isActive: true, isPopular: false };

const AdminSubscriptions = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/subscriptions/admin').then(r => setPlans(r.data.data || [])).catch(console.error).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY); setModal('create'); };
  const openEdit = (p) => {
    setForm({ name: p.name, slug: p.slug, description: p.description, price: p.price, currency: p.currency, billingPeriod: p.billingPeriod, includesAllMediums: p.includesAllMediums, includesLiveSessions: p.includesLiveSessions, includesRecordedSessions: p.includesRecordedSessions, maxDevices: p.maxDevices, features: p.features?.join('\n') || '', isActive: p.isActive, isPopular: p.isPopular });
    setModal(p);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) { toast.error('Name and price required'); return; }
    setSaving(true);
    const payload = { ...form, features: form.features.split('\n').map(s => s.trim()).filter(Boolean), slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-') };
    try {
      if (modal === 'create') { await api.post('/subscriptions/plans', payload); toast.success('Plan created'); }
      else { await api.put(`/subscriptions/plans/${modal._id}`, payload); toast.success('Plan updated'); }
      setModal(null); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this plan?')) return;
    try { await api.delete(`/subscriptions/plans/${id}`); toast.success('Deleted'); setPlans(p => p.filter(x => x._id !== id)); }
    catch { toast.error('Delete failed'); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-charcoal-900">Subscription Plans</h1>
          <p className="text-charcoal-500 text-sm">{plans.length} plans</p>
        </div>
        <button onClick={openCreate} className="btn-primary btn-sm"><Plus className="w-4 h-4" /> Add Plan</button>
      </div>

      {loading ? <LoadingState /> : plans.length === 0 ? (
        <EmptyState title="No plans yet" action={<button onClick={openCreate} className="btn-primary btn-sm">Create First Plan</button>} />
      ) : (
        <div className="card overflow-hidden">
          <table className="table-art">
            <thead><tr><th>Plan</th><th>Price</th><th>Period</th><th>Access</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
            <tbody>
              {plans.map(p => (
                <tr key={p._id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-charcoal-800">{p.name}</p>
                      {p.isPopular && <span className="badge badge-warning">Popular</span>}
                    </div>
                    <p className="text-xs text-charcoal-400">{p.description}</p>
                  </td>
                  <td className="font-semibold text-charcoal-800">₹{p.price}</td>
                  <td className="text-sm text-charcoal-600">{p.billingPeriod}</td>
                  <td>
                    <div className="flex flex-col gap-1 text-xs">
                      {p.includesRecordedSessions && <span className="text-sage-600">✓ Recordings</span>}
                      {p.includesLiveSessions && <span className="text-sage-600">✓ Live</span>}
                      {p.includesAllMediums && <span className="text-sage-600">✓ All Mediums</span>}
                    </div>
                  </td>
                  <td><span className={`badge ${p.isActive ? 'badge-success' : 'badge-muted'}`}>{p.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(p)} className="btn-ghost btn-sm"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(p._id)} className="btn-ghost btn-sm text-red-400 hover:text-red-500 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title={modal === 'create' ? 'Create Plan' : 'Edit Plan'} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Name *</label><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><label className="label">Slug</label><input className="input" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="auto-generated" /></div>
            </div>
            <div><label className="label">Description</label><input className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="label">Price (₹) *</label><input type="number" className="input" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} /></div>
              <div><label className="label">Period</label>
                <select className="input" value={form.billingPeriod} onChange={e => setForm(f => ({ ...f, billingPeriod: e.target.value }))}>
                  <option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="yearly">Yearly</option>
                </select>
              </div>
              <div><label className="label">Max Devices</label><input type="number" className="input" value={form.maxDevices} min={1} max={5} onChange={e => setForm(f => ({ ...f, maxDevices: Number(e.target.value) }))} /></div>
            </div>
            <div>
              <label className="label">Features (one per line)</label>
              <textarea className="input" rows={4} value={form.features} onChange={e => setForm(f => ({ ...f, features: e.target.value }))} placeholder="Access to all mediums&#10;Live sessions included&#10;2 devices" />
            </div>
            <div className="space-y-2">
              {[['includesAllMediums', 'All Mediums'], ['includesLiveSessions', 'Live Sessions'], ['includesRecordedSessions', 'Recorded Sessions'], ['isActive', 'Active'], ['isPopular', 'Mark as Popular']].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} />
                  <span className="text-sm text-charcoal-700">{label}</span>
                </label>
              ))}
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

export default AdminSubscriptions;
