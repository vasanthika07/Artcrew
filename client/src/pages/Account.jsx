import { useEffect, useState } from 'react';
import { User, CreditCard, Monitor, LogOut, Clock, Shield, Crown } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast';
import LoadingState from '../components/LoadingState';
import { format } from 'date-fns';

const Account = () => {
  const { user, logout, refreshUser } = useAuth();
  const [devices, setDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [revokingDevice, setRevokingDevice] = useState(null);

  useEffect(() => {
    refreshUser();
    api.get('/auth/devices')
      .then(r => setDevices(r.data.devices || []))
      .catch(console.error)
      .finally(() => setLoadingDevices(false));
  }, []);

  const handleRevokeDevice = async (deviceId, isCurrent) => {
    setRevokingDevice(deviceId);
    try {
      await api.delete(`/auth/devices/${deviceId}`);
      toast.success(isCurrent ? 'Logged out from this device' : 'Device removed');
      if (isCurrent) {
        await logout();
      } else {
        setDevices(d => d.filter(x => x.deviceId !== deviceId));
      }
    } catch (err) {
      toast.error('Failed to revoke device');
    } finally {
      setRevokingDevice(null);
    }
  };

  if (!user) return <LoadingState fullScreen />;

  const TIER_LABELS = { basic: 'Basic', pro: 'Pro', studio: 'Studio Access' };
  const TIER_COLORS = { basic: 'badge-muted', pro: 'badge-primary', studio: 'badge-warning' };

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-gradient-to-br from-charcoal-950 to-charcoal-900 py-14">
        <div className="container-art">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-canvas-400 to-terracotta-400 flex items-center justify-center text-white text-2xl font-display font-bold shadow-art-lg">
              {user.name?.charAt(0)}
            </div>
            <div>
              <h1 className="font-display font-bold text-3xl text-white">{user.name}</h1>
              <p className="text-charcoal-400">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                {user.role === 'admin' && (
                  <span className="badge badge-warning"><Shield className="w-3 h-3" /> Admin</span>
                )}
                {user.subscriptionTier && (
                  <span className={`badge ${TIER_COLORS[user.subscriptionTier]}`}>
                    <Crown className="w-3 h-3" /> {TIER_LABELS[user.subscriptionTier]}
                  </span>
                )}
                <span className={`badge ${user.subscriptionStatus === 'active' ? 'badge-success' : 'badge-muted'}`}>
                  {user.subscriptionStatus === 'active' ? 'Active' : 'Free Plan'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-art py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile info */}
          <div className="lg:col-span-1 space-y-5">
            <div className="card p-5">
              <h2 className="font-display font-semibold text-charcoal-900 mb-4 flex items-center gap-2">
                <User className="w-4.5 h-4.5 text-canvas-500" /> Account Info
              </h2>
              <div className="space-y-3">
                {[
                  { label: 'Name', value: user.name },
                  { label: 'Email', value: user.email },
                  { label: 'Role', value: user.role === 'admin' ? 'Administrator' : 'Member' },
                  { label: 'Member since', value: user.createdAt ? format(new Date(user.createdAt), 'MMMM yyyy') : 'N/A' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-center py-2 border-b border-charcoal-50 last:border-0">
                    <span className="text-sm text-charcoal-500">{item.label}</span>
                    <span className="text-sm font-medium text-charcoal-800">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Subscription card */}
            <div className="card p-5">
              <h2 className="font-display font-semibold text-charcoal-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-4.5 h-4.5 text-canvas-500" /> Subscription
              </h2>
              {user.subscriptionStatus === 'active' ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-charcoal-500">Plan</span>
                    <span className={`badge ${TIER_COLORS[user.subscriptionTier]}`}>
                      {TIER_LABELS[user.subscriptionTier] || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-charcoal-500">Status</span>
                    <span className="badge badge-success">Active</span>
                  </div>
                  {user.subscriptionExpiresAt && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-charcoal-500">Renews</span>
                      <span className="text-sm font-medium text-charcoal-700">
                        {format(new Date(user.subscriptionExpiresAt), 'dd MMM yyyy')}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-charcoal-500 text-sm mb-3">You're on the free plan</p>
                  <a href="/subscriptions" className="btn-primary btn-sm">Upgrade Now</a>
                </div>
              )}
            </div>
          </div>

          {/* Devices & billing */}
          <div className="lg:col-span-2 space-y-5">
            {/* Active devices */}
            <div className="card p-5">
              <h2 className="font-display font-semibold text-charcoal-900 mb-4 flex items-center gap-2">
                <Monitor className="w-4.5 h-4.5 text-canvas-500" /> Active Devices
              </h2>
              {loadingDevices ? (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="skeleton h-16 rounded-xl" />
                  ))}
                </div>
              ) : devices.length === 0 ? (
                <p className="text-charcoal-400 text-sm text-center py-4">No devices found</p>
              ) : (
                <div className="space-y-3">
                  {devices.map(device => (
                    <div
                      key={device.deviceId}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                        device.isCurrent ? 'border-canvas-200 bg-canvas-50' : 'border-charcoal-100 bg-charcoal-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${device.isCurrent ? 'bg-canvas-100' : 'bg-charcoal-100'}`}>
                          <Monitor className={`w-5 h-5 ${device.isCurrent ? 'text-canvas-500' : 'text-charcoal-400'}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-charcoal-800 flex items-center gap-2">
                            {device.userAgent?.slice(0, 50) || 'Unknown device'}
                            {device.isCurrent && <span className="badge badge-success text-xs">This device</span>}
                          </p>
                          {device.lastActive && (
                            <p className="text-xs text-charcoal-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />
                              Last active {format(new Date(device.lastActive), 'dd MMM yyyy, p')}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRevokeDevice(device.deviceId, device.isCurrent)}
                        disabled={revokingDevice === device.deviceId}
                        className="btn-danger btn-sm shrink-0 ml-3"
                      >
                        {revokingDevice === device.deviceId ? (
                          <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        ) : (
                          <LogOut className="w-3.5 h-3.5" />
                        )}
                        {device.isCurrent ? 'Sign Out' : 'Remove'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Billing history */}
            {user.billingHistory?.length > 0 && (
              <div className="card p-5">
                <h2 className="font-display font-semibold text-charcoal-900 mb-4 flex items-center gap-2">
                  <CreditCard className="w-4.5 h-4.5 text-canvas-500" /> Billing History
                </h2>
                <div className="overflow-x-auto">
                  <table className="table-art">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Plan</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {user.billingHistory.map((bill, i) => (
                        <tr key={i}>
                          <td className="text-charcoal-600">{format(new Date(bill.date), 'dd MMM yyyy')}</td>
                          <td className="text-charcoal-700 font-medium">{bill.plan}</td>
                          <td className="text-charcoal-700">₹{bill.amount?.toLocaleString('en-IN')}</td>
                          <td><span className="badge badge-success">{bill.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;
