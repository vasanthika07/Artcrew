import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';

// Layouts
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';

// Public pages
import Home from './pages/Home';
import Gallery from './pages/Gallery';
import Mediums from './pages/Mediums';
import MediumDetail from './pages/MediumDetail';
import LiveSessions from './pages/LiveSessions';
import LiveSessionViewer from './pages/LiveSessionViewer';
import RecordedSessions from './pages/RecordedSessions';
import Studios from './pages/Studios';
import Subscriptions from './pages/Subscriptions';
import Assistant from './pages/Assistant';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Account from './pages/Account';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminGallery from './pages/admin/AdminGallery';
import AdminMediums from './pages/admin/AdminMediums';
import AdminLiveSessions from './pages/admin/AdminLiveSessions';
import AdminRecordings from './pages/admin/AdminRecordings';
import AdminSubscriptions from './pages/admin/AdminSubscriptions';
import AdminUsers from './pages/admin/AdminUsers';
import AdminProgress from './pages/admin/AdminProgress';

const NotFound = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
    <p className="text-8xl font-display font-bold text-canvas-200 mb-4">404</p>
    <h1 className="font-display font-bold text-2xl text-charcoal-800 mb-2">Page Not Found</h1>
    <p className="text-charcoal-500 mb-6">The page you're looking for doesn't exist.</p>
    <a href="/" className="btn-primary">Go Home</a>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastContainer />
        <Routes>
          {/* Public layout */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/mediums" element={<Mediums />} />
            <Route path="/mediums/:id" element={<MediumDetail />} />
            <Route path="/live-sessions" element={<LiveSessions />} />
            <Route path="/live-sessions/:id" element={<LiveSessionViewer />} />
            <Route path="/recorded-sessions" element={<RecordedSessions />} />
            <Route path="/studios" element={<Studios />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/assistant" element={<Assistant />} />

            {/* Auth-required */}
            <Route path="/account" element={
              <ProtectedRoute><Account /></ProtectedRoute>
            } />
          </Route>

          {/* Auth pages (no layout) */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Admin layout */}
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="gallery" element={<AdminGallery />} />
            <Route path="mediums" element={<AdminMediums />} />
            <Route path="live-sessions" element={<AdminLiveSessions />} />
            <Route path="recordings" element={<AdminRecordings />} />
            <Route path="subscriptions" element={<AdminSubscriptions />} />
            <Route path="progress" element={<AdminProgress />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>

          <Route path="*" element={
            <MainLayout />
          }>
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
