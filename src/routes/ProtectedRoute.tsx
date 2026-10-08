import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAppSelector } from '../hooks';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  allowedRoles,
}) => {
  const { isAuthenticated, token, user } = useAppSelector((state) => state.auth);
  const location = useLocation();

  // If unauthenticated, redirect to login with return path
  if (requireAuth && (!isAuthenticated || !token)) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role-based authorization check
  if (allowedRoles && allowedRoles.length > 0 && user) {
    const userRole = (user.role || '').toUpperCase();
    const isAllowed = allowedRoles.some((r) => r.toUpperCase() === userRole);

    if (!isAllowed) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white">Access Restricted</h2>
            <p className="text-xs text-slate-400">
              Your role (<span className="text-amber-300 font-semibold">{user.role}</span>) does not have
              sufficient clearance for this section. Required role(s):{' '}
              <span className="text-slate-200 font-mono">{allowedRoles.join(', ')}</span>.
            </p>
            <div className="pt-2">
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Return to Dashboard
              </Link>
            </div>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
