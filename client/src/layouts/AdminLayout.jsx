import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu, ChevronRight, Shield } from 'lucide-react';
import AdminSidebar from '../components/admin/AdminSidebar';

const getPageTitle = (pathname) => {
  const seg = pathname.split('/').filter(Boolean).pop() || 'dashboard';
  return seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ');
};

const AdminLayout = () => {
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-charcoal-50">
      {/* Desktop Sticky Sidebar */}
      <div className="hidden lg:block sticky top-0 h-screen shrink-0">
        <AdminSidebar />
      </div>

      {/* Mobile Drawer Backdrop & Drawer */}
      {mobileDrawerOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-charcoal-950/80 backdrop-blur-sm z-50 animate-fade-in"
          onClick={() => setMobileDrawerOpen(false)}
        >
          <div
            className="w-64 h-full bg-charcoal-950 animate-slide-in-left"
            onClick={(e) => e.stopPropagation()}
          >
            <AdminSidebar onClose={() => setMobileDrawerOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Breadcrumb Bar */}
        <header className="h-16 bg-white border-b border-charcoal-100 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open admin navigation menu"
              className="lg:hidden p-2 rounded-xl text-charcoal-600 hover:text-charcoal-900 hover:bg-charcoal-100 transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <nav className="flex items-center gap-2 text-xs sm:text-sm font-medium" aria-label="Breadcrumb">
              <span className="text-charcoal-400 font-semibold flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-canvas-500" /> Admin
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-charcoal-300" />
              <span className="text-charcoal-900 font-bold capitalize">{pageTitle}</span>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-canvas-50 text-canvas-700 border border-canvas-200">
              ⚡ Admin Mode
            </span>
          </div>
        </header>

        {/* Page Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto bg-charcoal-50" id="admin-main-content">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
