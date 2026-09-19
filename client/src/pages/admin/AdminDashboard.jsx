import { useEffect, useState } from 'react';
import { Users, CreditCard, Radio, Video, Image, Palette, TrendingUp } from 'lucide-react';
import api from '../../api/axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StatCard = ({ icon: Icon, label, value, color = 'canvas', sub }) => (
  <div className="card p-5 flex items-start gap-4">
    <div className={`w-11 h-11 rounded-xl bg-${color}-50 flex items-center justify-center shrink-0`}>
      <Icon className={`w-5.5 h-5.5 text-${color}-500`} />
    </div>
    <div>
      <p className="text-2xl font-display font-bold text-charcoal-900">{value ?? '—'}</p>
      <p className="text-sm text-charcoal-500">{label}</p>
      {sub && <p className="text-xs text-sage-500 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard-stats')
      .then(r => setStats(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const chartData = stats?.monthlyGrowth?.map(d => ({
    name: `${d._id.month}/${d._id.year}`,
    users: d.count,
  })) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-2xl text-charcoal-900">Dashboard</h1>
        <p className="text-charcoal-500 text-sm mt-1">Overview of your ArtCrew platform</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard icon={Users} label="Total Users" value={stats?.totalUsers} color="canvas" />
          <StatCard icon={CreditCard} label="Active Subscribers" value={stats?.activeSubscribers} color="sage" />
          <StatCard icon={TrendingUp} label="Revenue" value={stats?.totalRevenue ? `₹${stats.totalRevenue.toLocaleString('en-IN')}` : '₹0'} color="terracotta" />
          <StatCard icon={Radio} label="Live Sessions" value={stats?.activeLiveSessions} color="terracotta" />
          <StatCard icon={Video} label="Recordings" value={stats?.totalRecordings} color="canvas" />
          <StatCard icon={Image} label="Gallery Items" value={stats?.totalGallery} color="charcoal" />
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="card p-5">
          <h2 className="font-display font-semibold text-charcoal-900 mb-4">User Growth</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6d6d62' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6d6d62' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e8e8e0', fontSize: '12px' }}
                />
                <Bar dataKey="users" fill="#d4892a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
