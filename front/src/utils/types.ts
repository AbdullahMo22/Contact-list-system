
export type AuditLogDTO = {
  logId: number;
  timestampUtc: string;          // ISO string
  userId: number | null;

  username: string | null;       // ييجي من JOIN على users
  actionName: string;

  entityType: string | null;
  entityId: string | null;

  success: boolean;
  errorMessage: string | null;

  ipAddress: string | null;
  macAddress: string | null;
  deviceName: string | null;

  oldValuesJson: any | null;
  newValuesJson: any | null;
};
export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'READ'
  | 'EXPORT';