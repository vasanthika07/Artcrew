import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  CreditCard,
  Radio,
  Video,
  Image,
  Palette,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Layers,
  Clock,
  Shield,
  RefreshCw,
} from 'lucide-react';
import api from '../../api/axios';
import {
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
  AreaChart,
  Area,
} from 'recharts';

const STAT_COLORS = {
  canvas: { bg: 'bg-canvas-500/10', text: 'text-canvas-600', border: 'border-canvas-500/20' },
  sage: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
  terracotta: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
  charcoal: { bg: 'bg-charcoal-100', text: 'text-charcoal-700', border: 'border-charcoal-200' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
};

const PIE_COLORS = ['#9ca3af', '#60a5fa', '#d4892a', '#10b981'];

const StatCard = ({ icon: Icon, label, value, color = 'canvas', sub, linkTo }) => {
  const styles = STAT_COLORS[color] || STAT_COLORS.canvas;
  const content = (
    <div className={`card p-5 border ${styles.border} flex items-start gap-4 hover:shadow-card-hover transition-all`}>
      <div className={`w-12 h-12 rounded-2xl ${styles.bg} ${styles.text} flex items-center justify-center shrink-0`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-2xl font-display font-bold text-charcoal-900 leading-tight">
          {value !== undefined && value !== null ? value : '—'}
        </p>
        <p className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider mt-0.5">{label}</p>
        {sub && <p className="text-xs text-charcoal-400 mt-1">{sub}</p>}
      </div>
    </div>
  );

  return linkTo ? <Link to={linkTo} className="block">{content}</Link> : content;
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStats = () => {
    setLoading(true);
    api
      .get('/admin/dashboard-stats')
      .then((r) => setStats(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStats();
  }, []);

  const growthData = stats?.monthlyGrowth || [];
  const tierData = stats?.tierBreakdown || [];
  const contentData = stats?.contentByMedium || [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-charcoal-900">
            Platform Analytics & Overview
          </h1>
          <p className="text-charcoal-500 text-sm mt-0.5">
            Real-time performance metrics and content distribution
          </p>
        </div>

        <button
          onClick={loadStats}
          disabled={loading}
          className="btn-outline btn-sm self-start sm:self-auto inline-flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Stats
        </button>
      </div>

      {/* 6 Core Statistics Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-5 h-28 skeleton" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            icon={Users}
            label="Total Users"
            value={stats?.totalUsers?.toLocaleString()}
            color="canvas"
            linkTo="/admin/users"
          />
          <StatCard
            icon={CreditCard}
            label="Active Subscribers"
            value={stats?.activeSubscribers?.toLocaleString()}
            color="sage"
            linkTo="/admin/subscriptions"
          />
          <StatCard
            icon={DollarSign}
            label="Monthly Revenue"
            value={stats?.monthlyRevenue ? `₹${stats.monthlyRevenue.toLocaleString('en-IN')}` : '₹0'}
            color="terracotta"
            sub={`Total: ₹${(stats?.totalRevenue || 0).toLocaleString('en-IN')}`}
          />
          <StatCard
            icon={Radio}
            label="Live Sessions"
            value={stats?.activeLiveSessions}
            color="red"
            linkTo="/admin/live-sessions"
          />
          <StatCard
            icon={Video}
            label="Recordings"
            value={stats?.totalRecordings}
            color="purple"
            linkTo="/admin/recordings"
          />
          <StatCard
            icon={Image}
            label="Gallery Items"
            value={stats?.totalGallery}
            color="charcoal"
            linkTo="/admin/gallery"
          />
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Growth Chart */}
        <div className="card p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-bold text-lg text-charcoal-900">
                User Signups & Growth
              </h2>
              <p className="text-xs text-charcoal-500">Monthly new user registrations</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-canvas-50 text-canvas-700">
              Active Trends
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

        {/* Subscription Tier Donut */}
        <div className="card p-6 space-y-4">
          <div>
            <h2 className="font-display font-bold text-lg text-charcoal-900">
              Subscribers by Tier
            </h2>
            <p className="text-xs text-charcoal-500">Free vs Paid Plan Breakdown</p>
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
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
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

      {/* Content Distribution by Medium Chart */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-lg text-charcoal-900">
              Content Catalog by Art Medium
            </h2>
            <p className="text-xs text-charcoal-500">
              Gallery artworks, recorded workshops, and live sessions distribution
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
                <Bar dataKey="gallery" name="Gallery Items" fill="#6d6d62" radius={[4, 4, 0, 0]} />
                <Bar dataKey="recordings" name="Workshops" fill="#d4892a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="live" name="Live Sessions" fill="#e0533c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-charcoal-400 text-xs">
              No medium content loaded
            </div>
          )}
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Gallery', link: '/admin/gallery', icon: Image, count: stats?.totalGallery },
          { label: 'Mediums', link: '/admin/mediums', icon: Palette, count: stats?.totalMediums },
          { label: 'Live Sessions', link: '/admin/live-sessions', icon: Radio, count: stats?.activeLiveSessions },
          { label: 'Recordings', link: '/admin/recordings', icon: Video, count: stats?.totalRecordings },
          { label: 'Subscriptions', link: '/admin/subscriptions', icon: CreditCard, count: stats?.activeSubscribers },
          { label: 'Users', link: '/admin/users', icon: Users, count: stats?.totalUsers },
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
