const pool=require('../config/db');

exports.createAuditLog=async(log)=>{
    const {user_id,action_name,entity_type,entity_id,
        success=1,
        error_message=null,
        ip_address=null,
        mac_address=null,
        device_name=null,
        old_values_json=null,
        new_values_json=null
    }=log;

  const sql = `
    INSERT INTO audit_logs
    (user_id, action_name, entity_type, entity_id,
     success, error_message, ip_address, mac_address,
     device_name, old_values_json, new_values_json)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
  `;
    const values=[user_id,action_name,entity_type,entity_id,
        success, error_message, ip_address, mac_address,
        device_name, old_values_json, new_values_json];
    const [result]=await pool.query(sql,values);
    return result.insertId;
};

// auditLogModel.js
exports.getAuditLogs = async ({ page = 1, limit = 25, q = '' }) => {
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 25, 1), 100);
  const offset = (safePage - 1) * safeLimit;

  const term = (q || '').trim();
  const hasSearch = term.length > 0;

  // Search across a few useful fields (adjust as you like)
  const where = hasSearch
    ? `
      WHERE
        COALESCE(u.username, '') LIKE ?
        OR COALESCE(al.action_name, '') LIKE ?
        OR COALESCE(al.entity_type, '') LIKE ?
        OR CAST(al.entity_id AS CHAR) LIKE ?
        OR COALESCE(al.ip_address, '') LIKE ?
        OR COALESCE(al.device_name, '') LIKE ?
        OR COALESCE(al.error_message, '') LIKE ?
    `
    : '';

  const params = hasSearch
    ? Array(7).fill(`%${term}%`)
    : [];

  const sqlData = `
    SELECT
      al.log_id,
      al.timestamp_utc,
      al.user_id,
      al.action_name,
      al.entity_type,
      al.entity_id,
      al.success,
      al.error_message,
      al.ip_address,
      al.device_name,
      u.username
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.user_id
    ${where}
    ORDER BY al.timestamp_utc DESC
    LIMIT ? OFFSET ?;
  `;

  const sqlCount = `
    SELECT COUNT(*) AS total
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.user_id
    ${where};
  `;

  const [[countRow]] = await pool.query(sqlCount, params);
  const total = countRow?.total ?? 0;

  const [rows] = await pool.query(sqlData, [...params, safeLimit, offset]);

  return {
    data: rows,
    meta: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.max(Math.ceil(total / safeLimit), 1),
    },
  };
};