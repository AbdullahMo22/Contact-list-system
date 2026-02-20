import { apiClient } from "./authStore";

export const getAuditLogs = async () => {
  try {
    const response = await apiClient.get('/auth/audit-logs');
    return response.data; // لازم يرجع AuditLogDTO[]
    } catch (error) {   
    console.error('Failed to fetch audit logs:', error);
    throw error;
  }
  };