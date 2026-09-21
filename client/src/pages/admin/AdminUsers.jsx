import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Shield,
  Ban,
  User,
  Trash2,
  Eye,
  X,
  Smartphone,
  Calendar,
  CreditCard,
  LogOut,
  RefreshCw,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
} from 'lucide-react';
import { format } from 'date-fns';
import api from '../../api/axios';
import { toast } from '../../components/Toast';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/admin/ConfirmDialog';

const TIER_BADGE = {
  basic: 'badge-primary',
  pro: 'badge-warning',
  studio: 'badge-success',
};

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-charcoal-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-dark w-full max-w-2xl animate-fade-up max-h-[90vh] overflow-y-auto">
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

const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');

  // Modals & Confirmation states
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    confirmVariant: 'danger',
    action: null,
  });
  const [confirmLoading, setConfirmLoading] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .get('/admin/users', {
        params: {
          search: search || undefined,
          role: roleFilter !== 'all' ? roleFilter : undefined,
          subscriptionStatus: statusFilter !== 'all' ? statusFilter : undefined,
          tier: tierFilter !== 'all' ? tierFilter : undefined,
        },
      })
      .then((r) => setUsers(r.data.data || []))
      .catch((err) => {
        console.error(err);
        toast.error('Failed to load users');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, roleFilter, statusFilter, tierFilter]);

  const viewUserDetails = async (user) => {
    setSelectedUser(user);
    setLoadingDetails(true);
    try {
      const res = await api.get(`/admin/users/${user._id}`);
      setSelectedUser(res.data.data);
    } catch (err) {
      toast.error('Failed to load full user details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const executeConfirmAction = async () => {
    if (!confirmState.action) return;
    setConfirmLoading(true);
    try {
      await confirmState.action();
      setConfirmState((prev) => ({ ...prev, isOpen: false }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setConfirmLoading(false);
    }
  };

  // Action helpers
  const handleToggleRole = (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    setConfirmState({
      isOpen: true,
      title: `${newRole === 'admin' ? 'Promote' : 'Demote'} User Role`,
      message: `Are you sure you want to change ${user.name}'s role to "${newRole}"? Admin users have full system control.`,
      confirmText: `Change Role to ${newRole}`,
      confirmVariant: newRole === 'admin' ? 'primary' : 'danger',
      action: async () => {
        await api.put(`/admin/users/${user._id}`, { role: newRole });
        toast.success(`User role updated to ${newRole}`);
        setUsers((prev) =>
          prev.map((u) => (u._id === user._id ? { ...u, role: newRole } : u))
        );
        if (selectedUser?._id === user._id) {
          setSelectedUser((prev) => ({ ...prev, role: newRole }));
        }
      },
    });
  };

  const handleToggleSuspend = (user) => {
    const suspended = !user.isSuspended;
    setConfirmState({
      isOpen: true,
      title: suspended ? 'Suspend User Account' : 'Reactivate User Account',
      message: suspended
        ? `Are you sure you want to suspend ${user.name}'s account? They will lose access to ArtCrew immediately.`
        : `Are you sure you want to reactivate ${user.name}'s account?`,
      confirmText: suspended ? 'Suspend Account' : 'Reactivate Account',
      confirmVariant: suspended ? 'danger' : 'primary',
      action: async () => {
        await api.put(`/admin/users/${user._id}`, { isSuspended: suspended });
        toast.success(suspended ? 'User account suspended' : 'User account reactivated');
        setUsers((prev) =>
          prev.map((u) => (u._id === user._id ? { ...u, isSuspended: suspended } : u))
        );
        if (selectedUser?._id === user._id) {
          setSelectedUser((prev) => ({ ...prev, isSuspended: suspended }));
        }
      },
    });
  };

  const handleDeleteUser = (user) => {
    setConfirmState({
      isOpen: true,
      title: 'Delete User Account',
      message: `Are you sure you want to permanently delete user "${user.name}" (${user.email})? All user history, watch progress, and credentials will be deleted permanently.`,
      confirmText: 'Delete User Forever',
      confirmVariant: 'danger',
      action: async () => {
        await api.delete(`/admin/users/${user._id}`);
        toast.success('User deleted successfully');
        setUsers((prev) => prev.filter((u) => u._id !== user._id));
        if (selectedUser?._id === user._id) setSelectedUser(null);
      },
    });
  };

  const handleForceLogoutDevice = (deviceId, deviceName) => {
    if (!selectedUser) return;
    setConfirmState({
      isOpen: true,
      title: 'Force Logout Device',
      message: `Terminate active session for "${deviceName || 'Unknown Device'}"? The user will be logged out of this device.`,
      confirmText: 'Revoke Device Session',
      confirmVariant: 'danger',
      action: async () => {
        await api.delete(`/admin/users/${selectedUser._id}/devices/${deviceId}`);
        toast.success('Device session revoked');
        setSelectedUser((prev) => ({
          ...prev,
          devices: prev.devices?.filter((d) => d.deviceId !== deviceId),
        }));
      },
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-charcoal-900">User Management</h1>
          <p className="text-charcoal-500 text-sm">
            Inspect customer accounts, subscriptions, active devices, and role privileges
          </p>
        </div>
        <button onClick={load} className="btn-secondary btn-sm self-start sm:self-auto">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh List
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="card p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email address..."
            className="input pl-9 w-full"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="input py-2 text-sm w-auto"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="user">Students / Users</option>
            <option value="admin">Administrators</option>
          </select>
          <select
            className="input py-2 text-sm w-auto"
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
          >
            <option value="all">All Tiers</option>
            <option value="basic">Basic Tier</option>
            <option value="pro">Pro Tier</option>
            <option value="studio">Studio Tier</option>
          </select>
          <select
            className="input py-2 text-sm w-auto"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Sub Status</option>
            <option value="active">Active Subscription</option>
            <option value="none">Free / None</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <LoadingState />
      ) : users.length === 0 ? (
        <EmptyState
          title="No users found"
          description="No student or admin accounts match your search criteria."
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-art">
            <thead>
              <tr>
                <th>User Account</th>
                <th>Role</th>
                <th>Membership Tier</th>
                <th>Subscription</th>
                <th>Joined Date</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-terracotta-400 to-canvas-500 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm">
                        {u.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-charcoal-900 truncate leading-tight">
                          {u.name}
                        </p>
                        <p className="text-xs text-charcoal-400 truncate">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`badge text-xs font-semibold ${
                        u.role === 'admin'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'badge-muted'
                      }`}
                    >
                      {u.role === 'admin' && <Shield className="w-3 h-3 mr-1 inline" />}
                      {u.role}
                    </span>
                  </td>
                  <td>
                    {u.subscriptionTier ? (
                      <span className={`badge ${TIER_BADGE[u.subscriptionTier] || 'badge-primary'}`}>
                        {u.subscriptionTier}
                      </span>
                    ) : (
                      <span className="text-charcoal-400 text-xs">Free Tier</span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`badge text-xs ${
                        u.subscriptionStatus === 'active'
                          ? 'badge-success'
                          : u.subscriptionStatus === 'expired'
                          ? 'badge-danger'
                          : 'badge-muted opacity-75'
                      }`}
                    >
                      {u.subscriptionStatus || 'none'}
                    </span>
                  </td>
                  <td className="text-sm text-charcoal-600">
                    {u.createdAt ? format(new Date(u.createdAt), 'dd MMM yyyy') : '—'}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        u.isSuspended ? 'badge-danger' : 'badge-success'
                      }`}
                    >
                      {u.isSuspended ? 'Suspended' : 'Active'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => navigate(`/admin/progress?user=${u._id}`)}
                        title="Track & Edit User Progress"
                        className="btn-ghost btn-sm text-canvas-600 hover:bg-canvas-50"
                      >
                        <GraduationCap className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => viewUserDetails(u)}
                        title="View Full Profile & Devices"
                        className="btn-ghost btn-sm text-charcoal-600 hover:text-charcoal-900"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleRole(u)}
                        title={u.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                        className={`btn-ghost btn-sm ${
                          u.role === 'admin' ? 'text-amber-600 hover:bg-amber-50' : 'text-charcoal-400 hover:text-charcoal-800'
                        }`}
                      >
                        <Shield className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleSuspend(u)}
                        title={u.isSuspended ? 'Reactivate Account' : 'Suspend Account'}
                        className={`btn-ghost btn-sm ${
                          u.isSuspended ? 'text-emerald-600 hover:bg-emerald-50' : 'text-amber-500 hover:bg-amber-50'
                        }`}
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u)}
                        title="Delete User"
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

      {/* User Details & Active Devices Modal */}
      {selectedUser && (
        <Modal
          title={`User Profile: ${selectedUser.name}`}
          onClose={() => setSelectedUser(null)}
        >
          {loadingDetails ? (
            <LoadingState />
          ) : (
            <div className="space-y-6">
              {/* Top Profile Summary */}
              <div className="flex items-center gap-4 p-4 bg-charcoal-50 rounded-2xl border border-charcoal-100">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-terracotta-400 to-canvas-500 flex items-center justify-center text-white text-xl font-bold shrink-0">
                  {selectedUser.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-display font-bold text-lg text-charcoal-900 leading-tight">
                    {selectedUser.name}
                  </h4>
                  <p className="text-sm text-charcoal-500">{selectedUser.email}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="badge badge-muted text-xs">Role: {selectedUser.role}</span>
                    <span className="badge badge-primary text-xs">
                      Tier: {selectedUser.subscriptionTier || 'Free'}
                    </span>
                    <span
                      className={`badge text-xs ${
                        selectedUser.isSuspended ? 'badge-danger' : 'badge-success'
                      }`}
                    >
                      {selectedUser.isSuspended ? 'Suspended' : 'Active'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Subscription Information */}
              <div>
                <h5 className="font-display font-semibold text-charcoal-900 text-sm mb-2 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-terracotta-600" />
                  Subscription & Billing
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-white border border-charcoal-200 rounded-xl text-xs">
                  <div>
                    <span className="text-charcoal-400 block">Status</span>
                    <span className="font-semibold text-charcoal-800 capitalize">
                      {selectedUser.subscriptionStatus || 'None'}
                    </span>
                  </div>
                  <div>
                    <span className="text-charcoal-400 block">Plan</span>
                    <span className="font-semibold text-charcoal-800">
                      {selectedUser.subscriptionId?.name || selectedUser.subscriptionTier || 'Free'}
                    </span>
                  </div>
                  <div>
                    <span className="text-charcoal-400 block">Expires / Renews</span>
                    <span className="font-semibold text-charcoal-800">
                      {selectedUser.subscriptionExpiresAt
                        ? format(new Date(selectedUser.subscriptionExpiresAt), 'dd MMM yyyy')
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Active Devices Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-display font-semibold text-charcoal-900 text-sm flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-terracotta-600" />
                    Active Logged-In Devices ({selectedUser.devices?.length || 0} /{' '}
                    {selectedUser.maxDevices || 2})
                  </h5>
                </div>

                {!selectedUser.devices || selectedUser.devices.length === 0 ? (
                  <div className="p-4 rounded-xl border border-charcoal-100 bg-charcoal-50 text-center text-xs text-charcoal-500">
                    No active device sessions registered.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedUser.devices.map((dev) => (
                      <div
                        key={dev.deviceId}
                        className="flex items-center justify-between p-3 rounded-xl border border-charcoal-200 bg-white hover:border-charcoal-300 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-charcoal-100 flex items-center justify-center text-charcoal-600 shrink-0">
                            <Smartphone className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-charcoal-800">
                              {dev.deviceName || 'Web / Mobile Client'}
                            </p>
                            <p className="text-xs text-charcoal-400">
                              IP: {dev.ipAddress || '127.0.0.1'} · Last active:{' '}
                              {dev.lastActiveAt
                                ? format(new Date(dev.lastActiveAt), 'dd MMM, p')
                                : 'Recent'}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleForceLogoutDevice(dev.deviceId, dev.deviceName)}
                          className="btn-ghost btn-sm text-red-500 hover:bg-red-50 text-xs font-medium"
                          title="Force Logout this device"
                        >
                          <LogOut className="w-3.5 h-3.5 mr-1" /> Force Logout
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Action Footer */}
              <div className="pt-3 border-t border-charcoal-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleToggleSuspend(selectedUser)}
                  className={`btn-sm ${
                    selectedUser.isSuspended ? 'btn-secondary' : 'btn-danger'
                  }`}
                >
                  <Ban className="w-3.5 h-3.5 mr-1" />
                  {selectedUser.isSuspended ? 'Reactivate Account' : 'Suspend Account'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="btn-primary btn-sm"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        confirmVariant={confirmState.confirmVariant}
        loading={confirmLoading}
        onConfirm={executeConfirmAction}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default AdminUsers;
