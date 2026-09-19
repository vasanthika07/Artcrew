import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Image,
  Palette,
  Radio,
  Video,
  CreditCard,
  Users,
  LogOut,
  ExternalLink,
  Shield,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ADMIN_NAV_SECTIONS = [
  {
    label: 'Overview',
    links: [
      { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    label: 'Content Management',
    links: [
      { to: '/admin/gallery', icon: Image, label: 'Gallery' },
      { to: '/admin/mediums', icon: Palette, label: 'Mediums' },
      { to: '/admin/live-sessions', icon: Radio, label: 'Live Sessions' },
      { to: '/admin/recordings', icon: Video, label: 'Recordings' },
    ],
  },
  {
    label: 'Business & Access',
    links: [
      { to: '/admin/subscriptions', icon: CreditCard, label: 'Subscriptions' },
      { to: '/admin/users', icon: Users, label: 'Users' },
    ],
  },
];

const AdminSidebar = ({ onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside
      className="w-64 shrink-0 bg-charcoal-950 flex flex-col h-full overflow-y-auto border-r border-charcoal-800/60"
      aria-label="Admin navigation"
    >
      {/* Brand Header */}
      <div className="px-6 py-5 border-b border-charcoal-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-canvas-500 to-terracotta-500 flex items-center justify-center shadow-lg shadow-canvas-500/20 shrink-0">
            <Palette className="w-5 h-5 text-charcoal-950" />
          </div>
          <div>
            <p className="font-display font-bold text-white text-base leading-tight tracking-tight">
              ArtCrew
            </p>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-canvas-400">
              <Shield className="w-2.5 h-2.5" /> Admin Portal
            </span>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-charcoal-400 hover:text-white hover:bg-charcoal-800"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto" aria-label="Admin routes">
        {ADMIN_NAV_SECTIONS.map(({ label, links }) => (
          <div key={label} className="space-y-1.5">
            <p className="px-3 text-[11px] font-bold uppercase tracking-widest text-charcoal-500 mb-2 font-mono">
              {label}
            </p>
            <div className="space-y-1">
              {links.map(({ to, icon: Icon, label: linkLabel }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-canvas-500 text-charcoal-950 font-bold shadow-md shadow-canvas-500/10'
                        : 'text-charcoal-400 hover:text-white hover:bg-charcoal-900'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{linkLabel}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* View Public Site Link */}
      <div className="px-4 pb-2">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-charcoal-400 hover:text-white hover:bg-charcoal-900 transition-colors border border-charcoal-800/80"
        >
          <span>View Public Platform</span>
          <ExternalLink className="w-3.5 h-3.5 text-canvas-400" />
        </a>
      </div>

      {/* Admin User Footer */}
      <div className="p-4 border-t border-charcoal-800/80 bg-charcoal-950">
        <div className="flex items-center gap-3 px-2 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-canvas-400 to-terracotta-400 flex items-center justify-center text-charcoal-950 text-xs font-bold shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-xs font-semibold truncate">{user?.name || 'Admin User'}</p>
            <p className="text-charcoal-500 text-[10px] truncate">{user?.email}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors cursor-pointer border border-red-950/60"
        >
          <LogOut className="w-3.5 h-3.5" /> Sign Out
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
