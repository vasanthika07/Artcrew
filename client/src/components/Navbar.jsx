import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import {
  Palette, Menu, X, ChevronDown, User, LogOut, Sparkles,
  LayoutDashboard, Image, BookOpen, Video, MapPin, Radio, CreditCard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navLinks = [
  { to: '/gallery',           label: 'Gallery',    icon: Image },
  { to: '/mediums',           label: 'Mediums',    icon: BookOpen },
  { to: '/studios',           label: 'Studios',    icon: MapPin },
  { to: '/live-sessions',     label: 'Live',       icon: Radio },
  { to: '/recorded-sessions', label: 'Workshops',  icon: Video },
  { to: '/subscriptions',     label: 'Plans',      icon: CreditCard },
  { to: '/assistant',         label: 'AI Advisor', icon: Sparkles, highlight: true },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const userMenuRef = useRef(null);

  // Scroll shadow
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on ESC
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  // Prevent body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setUserMenuOpen(false);
    setMobileOpen(false);
  };

  return (
    <>
      <nav
        className={`sticky top-0 z-50 bg-cream/95 backdrop-blur-md border-b border-charcoal-100 transition-shadow duration-300 ${
          scrolled ? 'shadow-[0_2px_20px_rgba(0,0,0,0.07)]' : 'shadow-none'
        }`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="container-art">
          <div className="flex items-center justify-between h-16">

            {/* ── Logo ── */}
            <Link to="/" className="flex items-center gap-2.5 group shrink-0" aria-label="ArtCrew home">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-canvas-500 to-terracotta-500 flex items-center justify-center shadow-art group-hover:shadow-art-lg transition-all duration-300 group-hover:scale-105">
                <Palette className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <div className="hidden sm:block">
                <span className="font-display font-bold text-lg text-charcoal-900 leading-none">ArtCrew</span>
                <span className="text-[10px] text-charcoal-400 block font-sans tracking-wide">Studio & Medium Finder</span>
              </div>
            </Link>

            {/* ── Desktop Nav ── */}
            <div className="hidden lg:flex items-center gap-0.5" role="list">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  role="listitem"
                  className={({ isActive }) => `
                    flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150
                    ${link.highlight
                      ? isActive
                        ? 'bg-canvas-100 text-canvas-700'
                        : 'text-canvas-600 hover:bg-canvas-50 hover:text-canvas-700'
                      : isActive
                        ? 'text-canvas-600 font-semibold bg-canvas-50'
                        : 'text-charcoal-600 hover:bg-charcoal-50 hover:text-charcoal-900'
                    }
                  `}
                >
                  {link.highlight && <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />}
                  {link.label}
                </NavLink>
              ))}
            </div>

            {/* ── Right side ── */}
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    aria-expanded={userMenuOpen}
                    aria-haspopup="menu"
                    aria-label="User menu"
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-charcoal-50 transition-colors focus-visible:ring-2 focus-visible:ring-canvas-500 focus-visible:ring-offset-2 outline-none"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-canvas-400 to-terracotta-400 flex items-center justify-center text-white text-xs font-bold shadow-art ring-2 ring-white">
                      {user?.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-charcoal-700 max-w-20 truncate">
                      {user?.name?.split(' ')[0]}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-charcoal-400 hidden sm:block transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  </button>

                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} aria-hidden="true" />
                      <div
                        role="menu"
                        className="absolute right-0 top-full mt-2 w-54 bg-white rounded-2xl shadow-card-hover border border-charcoal-100 py-2 z-20 animate-scale-in origin-top-right"
                      >
                        <div className="px-4 py-2.5 border-b border-charcoal-100 mb-1">
                          <p className="font-semibold text-sm text-charcoal-900">{user?.name}</p>
                          <p className="text-xs text-charcoal-400 truncate mt-0.5">{user?.email}</p>
                        </div>
                        <Link
                          to="/account"
                          role="menuitem"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-charcoal-700 hover:bg-canvas-50 hover:text-canvas-700 transition-colors"
                        >
                          <User className="w-4 h-4" aria-hidden="true" /> My Account
                        </Link>
                        {isAdmin && (
                          <Link
                            to="/admin/dashboard"
                            role="menuitem"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-charcoal-700 hover:bg-canvas-50 hover:text-canvas-700 transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4" aria-hidden="true" /> Admin Panel
                          </Link>
                        )}
                        <div className="border-t border-charcoal-100 mt-1 pt-1">
                          <button
                            role="menuitem"
                            onClick={handleLogout}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors w-full text-left"
                          >
                            <LogOut className="w-4 h-4" aria-hidden="true" /> Sign Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link to="/login" className="btn-ghost btn-sm">Sign In</Link>
                  <Link to="/signup" className="btn-primary btn-sm">Get Started</Link>
                </div>
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-expanded={mobileOpen}
                aria-controls="mobile-nav"
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                className="lg:hidden p-2 rounded-xl hover:bg-charcoal-50 text-charcoal-700 transition-colors focus-visible:ring-2 focus-visible:ring-canvas-500 outline-none"
              >
                {mobileOpen
                  ? <X className="w-5 h-5" aria-hidden="true" />
                  : <Menu className="w-5 h-5" aria-hidden="true" />
                }
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile Nav Overlay ── */}
      <div
        id="mobile-nav"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        className={`lg:hidden fixed inset-0 z-40 transition-all duration-300 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-charcoal-950/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />

        {/* Drawer panel */}
        <div
          className={`absolute right-0 top-0 bottom-0 w-[82vw] max-w-sm bg-cream shadow-dark-lg flex flex-col transition-transform duration-300 ease-spring ${
            mobileOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Drawer header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-charcoal-100">
            <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-canvas-500 to-terracotta-500 flex items-center justify-center">
                <Palette className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-charcoal-900">ArtCrew</span>
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
              className="p-2 rounded-xl hover:bg-charcoal-100 text-charcoal-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex-1 overflow-y-auto px-4 py-4" aria-label="Mobile navigation links">
            <div className="space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all
                      ${isActive
                        ? 'bg-canvas-50 text-canvas-700 font-semibold'
                        : link.highlight
                          ? 'text-canvas-600 hover:bg-canvas-50'
                          : 'text-charcoal-700 hover:bg-charcoal-50'
                      }
                    `}
                  >
                    <Icon className="w-4.5 h-4.5 shrink-0" aria-hidden="true" />
                    {link.label}
                  </NavLink>
                );
              })}
            </div>
          </nav>

          {/* Mobile auth footer */}
          <div className="px-4 pb-6 pt-4 border-t border-charcoal-100">
            {isAuthenticated ? (
              <div>
                <div className="flex items-center gap-3 px-4 py-3 mb-3 rounded-2xl bg-charcoal-50">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-canvas-400 to-terracotta-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-charcoal-900 truncate">{user?.name}</p>
                    <p className="text-xs text-charcoal-400 truncate">{user?.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link to="/account" onClick={() => setMobileOpen(false)} className="btn-ghost btn-sm justify-center">
                    <User className="w-4 h-4" /> Account
                  </Link>
                  <button onClick={handleLogout} className="btn-sm btn flex-1 justify-center text-red-500 hover:bg-red-50 border border-charcoal-200">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-outline btn-sm justify-center">Sign In</Link>
                <Link to="/signup" onClick={() => setMobileOpen(false)} className="btn-primary btn-sm justify-center">Get Started</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
