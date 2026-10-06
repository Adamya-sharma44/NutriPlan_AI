import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loading } from './UI';

/**
 * Wraps pages that require a signed-in user.
 * While the session is being checked it shows a loading state rather than
 * redirecting, which avoids a flash of the login page on refresh.
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loading label="Checking your session…" />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;

  return children;
}
