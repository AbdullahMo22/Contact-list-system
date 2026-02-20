import React from 'react';
import { useAuthStore } from '../../stores/authStore';

type Props = {
  perm: string;
  children: React.ReactNode;
  fallback?: React.ReactNode; // optional
};

export const PermissionGate: React.FC<Props> = ({ perm, children, fallback = null }) => {
  const { hasPermission } = useAuthStore();
  return hasPermission(perm) ? <>{children}</> : <>{fallback}</>;
};
