import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string | string[];
  requiredRole?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requiredRole,
}) => {
  const { isAuthenticated, isHydrated, hasPermission, hasRole } = useAuthStore();

  // Wait for checkAuth to finish before making any routing decisions
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermission) {
    const ok = Array.isArray(requiredPermission)
      ? requiredPermission.some((p) => hasPermission(p))
      : hasPermission(requiredPermission);
    if (!ok) return <Navigate to="/forbidden" replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <>{children}</>;
};

// Higher order component for permission checking
export const withPermission = (
  WrappedComponent: React.ComponentType<any>,
  requiredPermission: string
) => {
  return (props: any) => {
    const { hasPermission } = useAuthStore();

    if (!hasPermission(requiredPermission)) {
      return <div className="text-red-500">Access denied - insufficient permissions</div>;
    }

    return <WrappedComponent {...props} />;
  };
};
