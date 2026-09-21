import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  CreditCard,
  Radio,
  Video,
  Image,
  Palette,
  DollarSign,
  ArrowRight,
  Shield,
  RefreshCw,
  GraduationCap,
  AlertTriangle,
  Smartphone,
  Activity,
  UserCheck,
  Ban,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import api from '../../api/axios';
import { toast } from '../../components/Toast';

const TIER_COLORS = ['#9ca3af', '#3b82f6', '#d4892a', '#10b981'];

const formatSeconds = (sec = 0) => {
  if (!sec) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [extendingUserId, setExtendingUserId] = useState(null);

  const loadStats = () => {
    setLoading(true);
    api
      .get('/admin/dashboard-stats')
      .then((r) => setStats(r.data.data))
      .catch((err) => {
        console.error(err);
        toast.error('Failed to load dashboard metrics');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleQuickExtendValidity = async (userId, userEmail) => {
    setExtendingUserId(userId);
    try {
      const exp = new Date();
      exp.setMonth(exp.getMonth() + 1);

      await api.put(`/admin/users/${userId}`, {
        subscriptionStatus: 'active',
        subscriptionExpiresAt: exp,
      });

      toast.success(`Subscription validity extended for ${userEmail}`);
      loadStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to extend validity');
    } finally {
      setExtendingUserId(null);
    }
  };

  const progress = stats?.progressStats || {
    totalHoursWatched: 0,
    completedCount: 0,
    inProgressCount: 0,
    avgCompletionRate: 0,
  };

  const validity = stats?.subscriptionValidity || {
    activeCount: 0,
    expiringSoonCount: 0,
    expiredCount: 0,
    freeCount: 0,
    expiringSoonUsers: [],
  };

  const accessibility = stats?.accessibilityStats || {
    totalActiveDevices: 0,
    suspendedCount: 0,
    activeUsersCount: 0,
    adminCount: 1,
    studentCount: 0,
  };

  const growthData = stats?.monthlyGrowth || [];
  const tierData = stats?.tierBreakdown || [];
  const contentData = stats?.contentByMedium || [];
  const recentActivities = stats?.recentLearnerActivity || [];
  const adminEmail = stats?.adminProfile?.email || 'jvasanthika@gmail.com';

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* ── 1. Hero Admin Control Center Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-charcoal-950 via-charcoal-900 to-charcoal-950 border border-charcoal-800 text-white p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-canvas-500/15 via-terracotta-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-canvas-500/20 text-canvas-400 border border-canvas-500/30 backdrop-blur-md">
                <Shield className="w-3.5 h-3.5 text-canvas-400" />
                Super Admin Console
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/70 text-emerald-400 border border-emerald-800/80">
                <Activity className="w-3 h-3 animate-pulse" />
                Live Engine Active
              </span>
            </div>

            <h1 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight">
              Welcome, Administrator
            </h1>
            <div className="flex items-center gap-2 text-sm text-charcoal-300 flex-wrap">
              <span className="font-mono text-canvas-300 bg-charcoal-800/80 px-2.5 py-0.5 rounded-lg border border-charcoal-700/60 font-semibold">
                {adminEmail}
              </span>
              <span>•</span>
              <p className="text-charcoal-400 text-xs sm:text-sm">
                Centralized monitoring for student learning progress, subscription validity lifecycle, and user accessibility.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={loadStats}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-charcoal-800/90 hover:bg-charcoal-700 text-charcoal-200 text-xs font-semibold border border-charcoal-700 transition-all cursor-pointer shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-canvas-400' : ''}`} />
              Sync Real-Time Data
            </button>
            <Link
              to="/admin/progress"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-canvas-500 to-terracotta-500 hover:from-canvas-400 hover:to-terracotta-400 text-charcoal-950 font-bold text-xs shadow-lg shadow-canvas-500/20 transition-all"
            >
              <GraduationCap className="w-4 h-4" />
              Manage Progress
            </Link>
          </div>
        </div>

        {/* Quick Quicklinks Bar inside Hero */}
        <div className="mt-6 pt-6 border-t border-charcoal-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <Link
            to="/admin/progress"
            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-charcoal-900/60 hover:bg-charcoal-800/80 border border-charcoal-800 transition-colors text-charcoal-300 hover:text-white"
          >
            <div className="w-7 h-7 rounded-lg bg-canvas-500/20 text-canvas-400 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-white leading-tight">User Progress</p>
              <p className="text-[10px] text-charcoal-400">{progress.totalHoursWatched} hrs watched</p>
            </div>
          </Link>

          <Link
            to="/admin/subscriptions"
            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-charcoal-900/60 hover:bg-charcoal-800/80 border border-charcoal-800 transition-colors text-charcoal-300 hover:text-white"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-white leading-tight">Validity & Plans</p>
              <p className="text-[10px] text-emerald-400">{validity.activeCount} active subs</p>
            </div>
          </Link>

          <Link
            to="/admin/users"
            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-charcoal-900/60 hover:bg-charcoal-800/80 border border-charcoal-800 transition-colors text-charcoal-300 hover:text-white"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-white leading-tight">Accessibility</p>
              <p className="text-[10px] text-blue-400">{accessibility.totalActiveDevices} devices connected</p>
            </div>
          </Link>

          <Link
            to="/admin/recordings"
            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-charcoal-900/60 hover:bg-charcoal-800/80 border border-charcoal-800 transition-colors text-charcoal-300 hover:text-white"
          >
            <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-white leading-tight">Art Workshops</p>
              <p className="text-[10px] text-purple-400">{stats?.totalRecordings || 0} sessions</p>
            </div>
          </Link>
        </div>
      </div>

      {/* ── 2. Primary 4 Pillar KPI Stat Cards ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-6 h-36 skeleton" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: User Progress Tracker */}
          <div className="card p-5 border border-canvas-500/25 bg-gradient-to-br from-white via-canvas-50/30 to-amber-50/20 relative overflow-hidden shadow-sm hover:shadow-card-hover transition-all">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-canvas-800">
                  Learning Progress
                </span>
                <p className="text-2xl sm:text-3xl font-display font-bold text-charcoal-900 mt-1">
                  {progress.totalHoursWatched} <span className="text-base font-normal text-charcoal-500">hrs</span>
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-canvas-500/15 text-canvas-700 flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-canvas-200/60 flex items-center justify-between text-xs">
              <span className="text-charcoal-600 font-medium">
                {progress.completedCount} Completed ({progress.avgCompletionRate}%)
              </span>
              <Link to="/admin/progress" className="text-canvas-600 font-bold hover:underline">
                View & Edit →
              </Link>
            </div>
          </div>

          {/* Card 2: Subscription Validity & Health */}
          <div className="card p-5 border border-emerald-200 bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/20 relative overflow-hidden shadow-sm hover:shadow-card-hover transition-all">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Subscription Validity
                </span>
                <p className="text-2xl sm:text-3xl font-display font-bold text-emerald-950 mt-1">
                  {validity.activeCount} <span className="text-base font-normal text-emerald-700">active</span>
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-emerald-200/60 flex items-center justify-between text-xs">
              <span className="text-amber-700 font-medium">
                {validity.expiringSoonCount > 0
                  ? `⚠️ ${validity.expiringSoonCount} expiring soon`
                  : `${validity.expiredCount} expired accounts`}
              </span>
              <Link to="/admin/subscriptions" className="text-emerald-700 font-bold hover:underline">
                Manage Plans →
              </Link>
            </div>
          </div>

          {/* Card 3: User Accessibility & Devices */}
          <div className="card p-5 border border-blue-200 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 relative overflow-hidden shadow-sm hover:shadow-card-hover transition-all">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
                  User Accessibility
                </span>
                <p className="text-2xl sm:text-3xl font-display font-bold text-blue-950 mt-1">
                  {accessibility.activeUsersCount} <span className="text-base font-normal text-blue-700">users</span>
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-blue-200/60 flex items-center justify-between text-xs">
              <span className="text-charcoal-600 font-medium">
                {accessibility.totalActiveDevices} active device sessions
              </span>
              <Link to="/admin/users" className="text-blue-700 font-bold hover:underline">
                User Access →
              </Link>
            </div>
          </div>

          {/* Card 4: Monthly Revenue */}
          <div className="card p-5 border border-purple-200 bg-gradient-to-br from-white via-purple-50/30 to-pink-50/20 relative overflow-hidden shadow-sm hover:shadow-card-hover transition-all">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-800">
                  Monthly Revenue
                </span>
                <p className="text-2xl sm:text-3xl font-display font-bold text-purple-950 mt-1">
                  ₹{(stats?.monthlyRevenue || 0).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-purple-200/60 flex items-center justify-between text-xs">
              <span className="text-charcoal-600 font-medium">
                Total: ₹{(stats?.totalRevenue || 0).toLocaleString('en-IN')}
              </span>
              <span className="badge badge-success text-[10px] py-0 font-bold">Paid Gateway</span>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. Subscription Validity Alert Center & Quick Actions ── */}
      {validity.expiringSoonUsers && validity.expiringSoonUsers.length > 0 && (
        <div className="card p-6 border-2 border-amber-300/80 bg-amber-50/40 space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-charcoal-900">
                  Subscription Validity Alert ({validity.expiringSoonUsers.length} accounts expiring in 7 days)
                </h3>
                <p className="text-xs text-charcoal-600">
                  These student memberships will expire soon. You can extend their access validity by 30 days directly.
                </p>
              </div>
            </div>

            <Link
              to="/admin/users"
              className="btn-secondary btn-sm text-xs font-semibold"
            >
              View All Subscriptions
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {validity.expiringSoonUsers.map((u) => (
              <div
                key={u._id}
                className="p-3.5 rounded-2xl bg-white border border-amber-200 flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-charcoal-900 text-sm truncate">{u.name}</p>
                  <p className="text-xs text-charcoal-400 truncate">{u.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="badge badge-warning text-[10px] py-0">{u.subscriptionTier || 'Basic'}</span>
                    <span className="text-[11px] text-amber-700 font-medium">
                      Expires: {u.subscriptionExpiresAt ? format(new Date(u.subscriptionExpiresAt), 'dd MMM yyyy') : 'Soon'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleQuickExtendValidity(u._id, u.email)}
                  disabled={extendingUserId === u._id}
                  className="btn-primary btn-sm text-xs whitespace-nowrap shadow-xs"
                  title="Extend validity +30 days"
                >
                  {extendingUserId === u._id ? 'Extending...' : '+30 Days'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 4. Charts Row (Growth & Tier Distribution) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Growth & Learning Trend */}
        <div className="card p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-bold text-lg text-charcoal-900">
                User Signups & Learning Watch Trends
              </h2>
              <p className="text-xs text-charcoal-500">Monthly new student registrations and platform engagement</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-canvas-50 text-canvas-700 border border-canvas-200">
              Active Growth
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            {growthData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="userGrowthGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d4892a" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#d4892a" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6d6d62' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#6d6d62' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a18',
                      borderColor: '#2a2a26',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="#d4892a"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#userGrowthGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-charcoal-400 text-xs">
                No monthly historical data recorded yet
              </div>
            )}
          </div>
        </div>

        {/* Subscription Tier Distribution */}
        <div className="card p-6 space-y-4">
          <div>
            <h2 className="font-display font-bold text-lg text-charcoal-900">
              Membership Tier Distribution
            </h2>
            <p className="text-xs text-charcoal-500">Free, Basic, Pro, and Studio access tiers</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tierData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {tierData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={TIER_COLORS[index % TIER_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a18',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── 5. Live User Progress & Accessibility Activity Feed ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Student Learning Stream */}
        <div className="card p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-canvas-500/15 text-canvas-700 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-display font-bold text-lg text-charcoal-900">
                  Live Student Progress Stream
                </h2>
                <p className="text-xs text-charcoal-500">
                  Real-time watch progress and module milestones across courses
                </p>
              </div>
            </div>

            <Link
              to="/admin/progress"
              className="btn-ghost btn-sm text-canvas-600 hover:bg-canvas-50 text-xs font-semibold"
            >
              Full Tracker <ArrowRight className="w-3.5 h-3.5 ml-1 inline" />
            </Link>
          </div>

          {recentActivities.length === 0 ? (
            <div className="p-8 text-center text-xs text-charcoal-400 bg-charcoal-50 rounded-2xl border border-charcoal-100">
              No recent student watch sessions recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((act) => {
                const u = act.userId || {};
                const r = act.recordingId || {};
                const pct = act.progressPercentage || 0;

                return (
                  <div
                    key={act._id}
                    className="p-3.5 rounded-2xl border border-charcoal-200/90 bg-white hover:border-charcoal-300 transition-all flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-terracotta-400 to-canvas-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {u.name?.charAt(0)?.toUpperCase() || 'S'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-charcoal-900 text-sm truncate">{u.name}</p>
                        <p className="text-xs text-charcoal-500 truncate flex items-center gap-1.5">
                          <Video className="w-3 h-3 text-canvas-600 shrink-0" />
                          <span>{r.title || 'Art Session'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="hidden sm:block text-right">
                        <div className="flex items-center gap-2 justify-end text-xs">
                          <span className="font-mono font-bold text-charcoal-800">{pct}%</span>
                          <span className="text-[10px] text-charcoal-400">
                            {formatSeconds(act.progressSeconds)} / {formatSeconds(r.durationSeconds)}
                          </span>
                        </div>
                        <div className="w-28 h-1.5 rounded-full bg-charcoal-200 mt-1 overflow-hidden">
                          <div
                            className={`h-full ${pct >= 90 ? 'bg-emerald-500' : 'bg-canvas-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => navigate(`/admin/progress?user=${u._id}`)}
                        className="btn-ghost btn-sm text-canvas-600 hover:bg-canvas-50 text-xs py-1"
                        title="Inspect student"
                      >
                        <GraduationCap className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* User Accessibility & Session Summary */}
        <div className="card p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-display font-bold text-lg text-charcoal-900">
                  Accessibility & Devices
                </h2>
                <p className="text-xs text-charcoal-500">Device logins & user account security</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-charcoal-50 border border-charcoal-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-semibold text-charcoal-800">Active User Accounts</span>
                </div>
                <span className="font-mono font-bold text-sm text-charcoal-900">
                  {accessibility.activeUsersCount}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-charcoal-50 border border-charcoal-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-semibold text-charcoal-800">Active Device Logins</span>
                </div>
                <span className="font-mono font-bold text-sm text-charcoal-900">
                  {accessibility.totalActiveDevices}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-charcoal-50 border border-charcoal-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Ban className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-semibold text-charcoal-800">Suspended Accounts</span>
                </div>
                <span className={`font-mono font-bold text-sm ${accessibility.suspendedCount > 0 ? 'text-red-600' : 'text-charcoal-500'}`}>
                  {accessibility.suspendedCount}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-charcoal-50 border border-charcoal-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-semibold text-charcoal-800">Admin Operators</span>
                </div>
                <span className="font-mono font-bold text-sm text-charcoal-900">
                  {accessibility.adminCount}
                </span>
              </div>
            </div>
          </div>

          <Link
            to="/admin/users"
            className="btn-secondary w-full justify-center text-xs py-2.5 mt-2"
          >
            Manage User Access Controls
          </Link>
        </div>
      </div>

      {/* ── 6. Art Medium Content Distribution ── */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-lg text-charcoal-900">
              Content Catalog & Medium Engagement
            </h2>
            <p className="text-xs text-charcoal-500">
              Distribution of gallery artworks, recorded workshops, and live sessions
            </p>
          </div>
          <Link
            to="/admin/mediums"
            className="text-xs font-semibold text-canvas-600 hover:text-canvas-700 inline-flex items-center gap-1"
          >
            Manage Mediums <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="h-64 w-full pt-2">
          {contentData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0eb" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6d6d62' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6d6d62' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a18',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="gallery" name="Gallery Artworks" fill="#6d6d62" radius={[4, 4, 0, 0]} />
                <Bar dataKey="recordings" name="Recorded Sessions" fill="#d4892a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="live" name="Live Broadcasts" fill="#e0533c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-charcoal-400 text-xs">
              No medium content loaded
            </div>
          )}
        </div>
      </div>

      {/* ── 7. Quick Administrative Portal Links ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'User Progress', link: '/admin/progress', icon: GraduationCap, count: progress.totalProgressRecords || 0 },
          { label: 'Subscriptions', link: '/admin/subscriptions', icon: CreditCard, count: validity.activeCount },
          { label: 'User Accounts', link: '/admin/users', icon: Users, count: stats?.totalUsers || 0 },
          { label: 'Recordings', link: '/admin/recordings', icon: Video, count: stats?.totalRecordings || 0 },
          { label: 'Live Sessions', link: '/admin/live-sessions', icon: Radio, count: stats?.activeLiveSessions || 0 },
          { label: 'Gallery Curation', link: '/admin/gallery', icon: Image, count: stats?.totalGallery || 0 },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              to={item.link}
              className="card p-4 hover:border-canvas-400 hover:shadow-card-hover transition-all flex items-center gap-3 group"
            >
              <div className="w-8 h-8 rounded-lg bg-charcoal-100 group-hover:bg-canvas-500 group-hover:text-charcoal-950 flex items-center justify-center text-charcoal-700 transition-colors">
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-charcoal-900 group-hover:text-canvas-600 transition-colors truncate">
                  {item.label}
                </p>
                <p className="text-[11px] text-charcoal-400 font-mono">{item.count ?? 0} items</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default AdminDashboard;
