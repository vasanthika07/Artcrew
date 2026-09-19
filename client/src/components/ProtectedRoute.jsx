import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingState from './LoadingState';

const ProtectedRoute = ({ children, requireAdmin = false, requireSubscription = false }) => {
  const { isAuthenticated, isAdmin, hasSubscription, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingState fullScreen />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
