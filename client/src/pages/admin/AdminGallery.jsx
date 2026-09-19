import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Save, Upload } from 'lucide-react';
import api from '../../api/axios';
import { toast } from '../../components/Toast';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';

// Reusable modal
const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-charcoal-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-dark w-full max-w-lg animate-fade-up max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between p-5 border-b border-charcoal-100">
        <h3 className="font-display font-semibold text-charcoal-900">{title}</h3>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-charcoal-100 text-charcoal-400 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
);

const EMPTY_FORM = { title: '', mediumId: '', imageUrl: '', description: '', artist: '', isFeatured: false };

const AdminGallery = () => {
  const [items, setItems] = useState([]);
  const [mediums, setMediums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'create' | item (edit)
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = () => {
    Promise.all([api.get('/gallery?limit=50'), api.get('/mediums')])
      .then(([g, m]) => {
        setItems(g.data.data || []);
        setMediums(m.data.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY_FORM); setModal('create'); };
  const openEdit = (item) => {
    setForm({ title: item.title, mediumId: item.mediumId?._id || item.mediumId, imageUrl: item.imageUrl, description: item.description, artist: item.artist || '', isFeatured: item.isFeatured });
    setModal(item);
  };

  const handleSave = async () => {
    if (!form.title || !form.mediumId || !form.imageUrl) {
      toast.error('Title, medium and image URL are required');
      return;
    }
    setSaving(true);
    try {
      if (modal === 'create') {
        await api.post('/gallery', form);
        toast.success('Gallery item created');
      } else {
        await api.put(`/gallery/${modal._id}`, form);
        toast.success('Gallery item updated');
      }
      setModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this gallery item?')) return;
    try {
      await api.delete(`/gallery/${id}`);
      toast.success('Deleted');
      setItems(i => i.filter(x => x._id !== id));
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-charcoal-900">Gallery</h1>
          <p className="text-charcoal-500 text-sm mt-0.5">{items.length} items</p>
        </div>
        <button onClick={openCreate} className="btn-primary btn-sm">
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {loading ? <LoadingState /> : items.length === 0 ? (
        <EmptyState title="No gallery items" action={<button onClick={openCreate} className="btn-primary btn-sm">Add First Item</button>} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {items.map(item => (
            <div key={item._id} className="group relative card overflow-hidden">
              <div className="aspect-square">
                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="p-3">
                <p className="font-medium text-charcoal-800 text-sm truncate">{item.title}</p>
                <p className="text-xs text-charcoal-400">{item.mediumId?.name}</p>
              </div>
              <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(item)} className="w-7 h-7 rounded-lg bg-white/90 shadow flex items-center justify-center text-charcoal-600 hover:text-canvas-600">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(item._id)} className="w-7 h-7 rounded-lg bg-white/90 shadow flex items-center justify-center text-charcoal-600 hover:text-red-500">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {item.isFeatured && <div className="absolute top-2 left-2 badge badge-primary text-xs">Featured</div>}
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal === 'create' ? 'Add Gallery Item' : 'Edit Gallery Item'} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div>
              <label className="label">Title *</label>
              <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Artwork title" />
            </div>
            <div>
              <label className="label">Medium *</label>
              <select className="input" value={form.mediumId} onChange={e => setForm(f => ({ ...f, mediumId: e.target.value }))}>
                <option value="">Select medium</option>
                {mediums.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Image URL *</label>
              <input className="input" value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." />
              {form.imageUrl && <img src={form.imageUrl} alt="Preview" className="mt-2 w-full h-32 object-cover rounded-xl" />}
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the artwork..." />
            </div>
            <div>
              <label className="label">Artist</label>
              <input className="input" value={form.artist} onChange={e => setForm(f => ({ ...f, artist: e.target.value }))} placeholder="Artist name" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isFeatured} onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))} className="rounded" />
              <span className="text-sm text-charcoal-700">Feature on home page</span>
            </label>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setModal(null)} className="btn-ghost flex-1 justify-center">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
                {saving ? <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminGallery;
