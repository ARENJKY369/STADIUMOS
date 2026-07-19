import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../common/LoadingSpinner';

export default function ProtectedRoute({ children, roles = [] }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900"><LoadingSpinner size="lg" /></div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && user && !roles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center"><p className="text-4xl mb-4">🔒</p><h2 className="font-bold text-lg">Access Denied</h2><p className="text-sm text-slate-500 mt-2">Role {user.role} not authorized. Required: {roles.join(', ')}</p></div>
      </div>
    );
  }

  return children;
}
