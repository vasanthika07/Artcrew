import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Image, Palette, Radio, Video, CreditCard, Users,
  LogOut, ChevronRight, ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_SECTIONS = [
  {
    label: 'Overview',
    links: [
      { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    label: 'Content',
    links: [
      { to: '/admin/gallery',       icon: Image,   label: 'Gallery' },
      { to: '/admin/mediums',       icon: Palette, label: 'Mediums' },
      { to: '/admin/live-sessions', icon: Radio,   label: 'Live Sessions' },
      { to: '/admin/recordings',    icon: Video,   label: 'Recordings' },
    ],
  },
  {
    label: 'Business',
    links: [
      { to: '/admin/subscriptions', icon: CreditCard, label: 'Subscriptions' },
      { to: '/admin/users',         icon: Users,       label: 'Users' },
    ],
  },
];

// Derive a readable page title from the path
const getPageTitle = (pathname) => {
  const seg = pathname.split('/').filter(Boolean).pop() || 'dashboard';
  return seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ');
};

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const location         = useLocation();
  const pageTitle        = getPageTitle(location.pathname);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex bg-charcoal-50">

      {/* ── Sidebar ── */}
      <aside
        className="w-60 shrink-0 bg-charcoal-950 flex flex-col sticky top-0 h-screen overflow-y-auto"
        aria-label="Admin navigation"
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-charcoal-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-canvas-500 to-terracotta-500 flex items-center justify-center shadow-art shrink-0">
              <Palette className="w-4 h-4 text-white" aria-hidden="true" />
            </div>
            <div>
              <p className="font-display font-bold text-white text-sm leading-none">ArtCrew</p>
              <p className="text-charcoal-500 text-[10px] mt-0.5 font-medium uppercase tracking-wide">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-5 overflow-y-auto" aria-label="Admin pages">
          {NAV_SECTIONS.map(({ label, links }) => (
            <div key={label}>
              <p className="sidebar-section-label">{label}</p>
              <div className="space-y-0.5">
                {links.map(({ to, icon: Icon, label: linkLabel }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      `sidebar-link ${isActive ? 'active' : ''}`
                    }
                    aria-label={linkLabel}
                  >
                    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{linkLabel}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* View site link */}
        <div className="px-3 pb-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs text-charcoal-500 hover:text-charcoal-300 hover:bg-charcoal-800 transition-all"
            aria-label="View public site in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            View Site
          </a>
        </div>

        {/* User footer */}
        <div className="p-3 border-t border-charcoal-800/60">
          <div className="flex items-center gap-2.5 px-2 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-canvas-400 to-terracotta-400 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-art">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
              <p className="text-charcoal-500 text-[10px] truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-2 rounded-xl text-xs text-charcoal-400 hover:bg-red-900/25 hover:text-red-400 transition-all"
            aria-label="Sign out of admin panel"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-charcoal-100 flex items-center px-6 sticky top-0 z-20 shadow-sm">
          <nav className="flex items-center gap-1.5 text-sm text-charcoal-400" aria-label="Breadcrumb">
            <span className="text-charcoal-400">Admin</span>
            <ChevronRight className="w-3.5 h-3.5 text-charcoal-300" aria-hidden="true" />
            <span className="text-charcoal-800 font-semibold capitalize">{pageTitle}</span>
          </nav>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8 overflow-auto bg-charcoal-50" id="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
