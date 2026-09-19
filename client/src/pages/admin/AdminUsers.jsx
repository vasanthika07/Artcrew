import { useEffect, useState } from 'react';
import { Search, Shield, Ban, User } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../api/axios';
import { toast } from '../../components/Toast';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';

const TIER_BADGE = { basic: 'badge-primary', pro: 'badge-warning', studio: 'badge-success' };

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const load = () => api.get('/admin/users').then(r => setUsers(r.data.data || [])).catch(console.error).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleRole = async (id, role) => {
    setUpdating(id);
    try {
      await api.put(`/admin/users/${id}`, { role });
      toast.success(`Role updated to ${role}`);
      setUsers(u => u.map(x => x._id === id ? { ...x, role } : x));
    } catch { toast.error('Update failed'); }
    finally { setUpdating(null); }
  };

  const handleSuspend = async (id, suspended) => {
    setUpdating(id);
    try {
      await api.put(`/admin/users/${id}`, { isSuspended: suspended });
      toast.success(suspended ? 'User suspended' : 'User reactivated');
      setUsers(u => u.map(x => x._id === id ? { ...x, isSuspended: suspended } : x));
    } catch { toast.error('Update failed'); }
    finally { setUpdating(null); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-2xl text-charcoal-900">Users</h1>
          <p className="text-charcoal-500 text-sm">{users.length} total users</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search users..."
            className="input pl-9 w-64"
          />
        </div>
      </div>

      {loading ? <LoadingState /> : filtered.length === 0 ? (
        <EmptyState title="No users found" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-art">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Subscription</th>
                <th>Joined</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u._id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-canvas-400 to-terracotta-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {u.name?.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-charcoal-800 truncate">{u.name}</p>
                        <p className="text-xs text-charcoal-400 truncate">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'badge-warning' : 'badge-muted'}`}>
                      {u.role === 'admin' ? <Shield className="w-3 h-3 mr-0.5" /> : null}
                      {u.role}
                    </span>
                  </td>
                  <td>
                    {u.subscriptionTier ? (
                      <span className={`badge ${TIER_BADGE[u.subscriptionTier]}`}>{u.subscriptionTier}</span>
                    ) : (
                      <span className="text-charcoal-400 text-sm">Free</span>
                    )}
                  </td>
                  <td className="text-sm text-charcoal-600">
                    {u.createdAt ? format(new Date(u.createdAt), 'dd MMM yyyy') : '—'}
                  </td>
                  <td>
                    <span className={`badge ${u.isSuspended ? 'badge-danger' : 'badge-success'}`}>
                      {u.isSuspended ? 'Suspended' : 'Active'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-2">
                      {updating === u._id ? (
                        <span className="w-4 h-4 rounded-full border-2 border-canvas-300 border-t-canvas-500 animate-spin" />
                      ) : (
                        <>
                          <button
                            onClick={() => handleRole(u._id, u.role === 'admin' ? 'user' : 'admin')}
                            title={u.role === 'admin' ? 'Remove admin' : 'Make admin'}
                            className="btn-ghost btn-sm"
                          >
                            <Shield className={`w-3.5 h-3.5 ${u.role === 'admin' ? 'text-canvas-500' : 'text-charcoal-400'}`} />
                          </button>
                          <button
                            onClick={() => handleSuspend(u._id, !u.isSuspended)}
                            title={u.isSuspended ? 'Reactivate' : 'Suspend'}
                            className={`btn-ghost btn-sm ${u.isSuspended ? 'text-sage-500 hover:bg-sage-50' : 'text-red-400 hover:text-red-500 hover:bg-red-50'}`}
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
