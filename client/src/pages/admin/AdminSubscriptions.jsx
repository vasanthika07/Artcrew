import { useEffect, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Check,
  CreditCard,
  Sparkles,
  Layers,
  Smartphone,
  Video,
  Radio,
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

const EMPTY = {
  name: '',
  slug: '',
  description: '',
  price: 499,
  currency: 'INR',
  billingPeriod: 'monthly',
  includedMediums: [],
  includesAllMediums: true,
  includesLiveSessions: true,
  includesRecordedSessions: true,
  maxDevices: 2,
  features: '',
  isActive: true,
  isPopular: false,
};

const AdminSubscriptions = () => {
  const [plans, setPlans] = useState([]);
  const [mediums, setMediums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    Promise.all([api.get('/subscriptions/admin'), api.get('/mediums')])
      .then(([p, m]) => {
        setPlans(p.data.data || []);
        setMediums(m.data.data || []);
      })
      .catch((err) => {
        console.error(err);
        toast.error('Failed to load subscription plans');
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

  const openEdit = (p) => {
    setForm({
      name: p.name,
      slug: p.slug,
      description: p.description || '',
      price: p.price,
      currency: p.currency || 'INR',
      billingPeriod: p.billingPeriod || 'monthly',
      includedMediums: (p.includedMediums || []).map((m) => m._id || m),
      includesAllMediums: p.includesAllMediums ?? false,
      includesLiveSessions: p.includesLiveSessions ?? false,
      includesRecordedSessions: p.includesRecordedSessions ?? true,
      maxDevices: p.maxDevices || 2,
      features: (p.features || []).join('\n'),
      isActive: p.isActive ?? true,
      isPopular: p.isPopular ?? false,
    });
    setModal(p);
  };

  const handleSave = async () => {
    if (!form.name.trim() || form.price === undefined || form.price === '') {
      toast.error('Plan Name and Price are required');
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      price: Number(form.price),
      maxDevices: Number(form.maxDevices),
      features: form.features
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      slug:
        form.slug.trim() ||
        form.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, ''),
    };

    try {
      if (modal === 'create') {
        await api.post('/subscriptions/plans', payload);
        toast.success('Subscription plan created');
      } else {
        await api.put(`/subscriptions/plans/${modal._id}`, payload);
        toast.success('Subscription plan updated');
      }
      setModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleMedium = (id) => {
    setForm((f) => {
      const exists = f.includedMediums.includes(id);
      return {
        ...f,
        includedMediums: exists
          ? f.includedMediums.filter((m) => m !== id)
          : [...f.includedMediums, id],
      };
    });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/subscriptions/plans/${deleteTarget._id}`);
      toast.success('Subscription plan deleted');
      setPlans((prev) => prev.filter((p) => p._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-charcoal-900">Subscription Plans</h1>
          <p className="text-charcoal-500 text-sm">
            Configure membership tiers, pricing in INR, medium permissions, and streaming limits
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary btn-sm self-start sm:self-auto">
          <Plus className="w-4 h-4" /> Create New Plan
        </button>
      </div>

      {/* Plan Cards / Table */}
      {loading ? (
        <LoadingState />
      ) : plans.length === 0 ? (
        <EmptyState
          title="No subscription plans found"
          description="Create membership tiers (e.g. Basic, Pro, Studio Access) for your students."
          action={
            <button onClick={openCreate} className="btn-primary btn-sm">
              <Plus className="w-4 h-4" /> Create First Plan
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((p) => (
            <div
              key={p._id}
              className={`card relative flex flex-col justify-between overflow-hidden border-2 transition-all ${
                p.isPopular ? 'border-terracotta-400 shadow-md' : 'border-charcoal-100'
              }`}
            >
              {p.isPopular && (
                <div className="absolute top-0 right-0 bg-terracotta-500 text-white text-[11px] font-bold px-3 py-0.5 rounded-bl-lg uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Most Popular
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display font-bold text-xl text-charcoal-900">{p.name}</h3>
                  <span
                    className={`badge text-xs ${
                      p.isActive ? 'badge-success' : 'badge-muted opacity-75'
                    }`}
                  >
                    {p.isActive ? 'Active' : 'Archived'}
                  </span>
                </div>
                <p className="text-xs text-charcoal-500 mb-4 min-h-[32px]">
                  {p.description || 'No description provided'}
                </p>

                {/* Price */}
                <div className="mb-4 pb-4 border-b border-charcoal-100">
                  <span className="text-3xl font-display font-extrabold text-charcoal-900">
                    ₹{p.price}
                  </span>
                  <span className="text-charcoal-500 text-sm ml-1 font-medium">
                    /{p.billingPeriod}
                  </span>
                </div>

                {/* Features List */}
                <div className="space-y-2 mb-6">
                  <div className="text-xs font-semibold text-charcoal-400 uppercase tracking-wider mb-2">
                    Included Benefits
                  </div>
                  <div className="flex items-center gap-2 text-sm text-charcoal-700">
                    <Video className="w-4 h-4 text-terracotta-500 shrink-0" />
                    <span>
                      {p.includesRecordedSessions
                        ? 'Recorded masterclasses included'
                        : 'No recordings access'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-charcoal-700">
                    <Radio className="w-4 h-4 text-terracotta-500 shrink-0" />
                    <span>
                      {p.includesLiveSessions
                        ? 'Live interactive sessions included'
                        : 'No live sessions'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-charcoal-700">
                    <Layers className="w-4 h-4 text-terracotta-500 shrink-0" />
                    <span>
                      {p.includesAllMediums
                        ? 'All art mediums unlocked'
                        : `${p.includedMediums?.length || 0} medium(s) unlocked`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-charcoal-700">
                    <Smartphone className="w-4 h-4 text-terracotta-500 shrink-0" />
                    <span>Up to {p.maxDevices || 2} concurrent active devices</span>
                  </div>

                  {p.features?.map((f, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-sm text-charcoal-600 pl-1"
                    >
                      <Check className="w-3.5 h-3.5 text-sage-600 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-charcoal-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => openEdit(p)}
                  className="btn-ghost btn-sm text-charcoal-700 hover:text-charcoal-900"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit Plan
                </button>
                <button
                  onClick={() => setDeleteTarget(p)}
                  className="btn-ghost btn-sm text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Plan Modal */}
      {modal && (
        <Modal
          title={modal === 'create' ? 'Create Subscription Plan' : `Edit ${modal.name}`}
          onClose={() => setModal(null)}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Plan Name *</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Studio Pro"
                />
              </div>
              <div>
                <label className="label">Plan Slug</label>
                <input
                  className="input"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="e.g. studio-pro"
                />
              </div>
            </div>

            <div>
              <label className="label">Description</label>
              <textarea
                className="input"
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Ideal for dedicated artists seeking full live and recorded access..."
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Price (₹) *</label>
                <input
                  type="number"
                  className="input"
                  value={form.price}
                  min={0}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Billing Period</label>
                <select
                  className="input"
                  value={form.billingPeriod}
                  onChange={(e) => setForm((f) => ({ ...f, billingPeriod: e.target.value }))}
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label className="label">Max Devices</label>
                <input
                  type="number"
                  className="input"
                  value={form.maxDevices}
                  min={1}
                  max={5}
                  onChange={(e) => setForm((f) => ({ ...f, maxDevices: e.target.value }))}
                />
              </div>
            </div>

            {/* Permissions Toggles */}
            <div className="p-3 bg-charcoal-50 rounded-xl space-y-2 border border-charcoal-100">
              <span className="text-xs font-bold text-charcoal-600 uppercase tracking-wider block mb-1">
                Access Entitlements
              </span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.includesRecordedSessions}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, includesRecordedSessions: e.target.checked }))
                  }
                  className="rounded text-canvas-500 focus:ring-canvas-400"
                />
                <span className="text-sm text-charcoal-800">Recorded Masterclasses Access</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.includesLiveSessions}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, includesLiveSessions: e.target.checked }))
                  }
                  className="rounded text-canvas-500 focus:ring-canvas-400"
                />
                <span className="text-sm text-charcoal-800">Live Interactive Workshops Access</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.includesAllMediums}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, includesAllMediums: e.target.checked }))
                  }
                  className="rounded text-canvas-500 focus:ring-canvas-400"
                />
                <span className="text-sm text-charcoal-800 font-semibold">
                  Include All Art Mediums (Unlimited)
                </span>
              </label>
            </div>

            {/* Individual Medium Checkboxes if not includesAllMediums */}
            {!form.includesAllMediums && (
              <div>
                <label className="label">Select Included Mediums</label>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 border border-charcoal-200 rounded-xl">
                  {mediums.map((m) => (
                    <label key={m._id} className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.includedMediums.includes(m._id)}
                        onChange={() => toggleMedium(m._id)}
                        className="rounded text-canvas-500"
                      />
                      <span className="text-charcoal-700">{m.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="label">Feature Bullets (one per line)</label>
              <textarea
                className="input text-sm"
                rows={3}
                value={form.features}
                onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))}
                placeholder="High-definition 4K streaming&#10;Direct Q&A with master artists&#10;Community critique submissions"
              />
            </div>

            <div className="flex gap-6 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="rounded text-canvas-500 focus:ring-canvas-400"
                />
                <span className="text-sm text-charcoal-700 font-medium">Active for Purchase</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPopular}
                  onChange={(e) => setForm((f) => ({ ...f, isPopular: e.target.checked }))}
                  className="rounded text-canvas-500 focus:ring-canvas-400"
                />
                <span className="text-sm text-charcoal-700 font-medium">Highlight as Most Popular</span>
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
                Save Plan
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Subscription Plan"
        message={`Are you sure you want to delete the "${deleteTarget?.name}" plan? Active subscribers will retain access until their term expires.`}
        confirmText="Delete Plan"
        confirmVariant="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default AdminSubscriptions;
