// middleware/auditLogger.js
const auditModel = require('../models/auditLogModel');

function auditLogger({ action_name, entity_type, getEntityId, getOldValues }) {
  return async (req, res, next) => {
    const user_id = req.user?.user_id ?? null;
    const ip_address = getClientIp(req);

    // 1) قبل التنفيذ: هات old values لو مطلوب
    let oldValues = null;
    try {
      if (getOldValues) {
        oldValues = await getOldValues(req);
      }
    } catch (e) {
      // لو فشلنا في جلب oldValues ما نوقفش العملية
      oldValues = null;
    }

    // 2) بعد ما الرد يخلص بنجاح
    res.on('finish', async () => {
      // اعتبر النجاح أي status أقل من 400
      const success = res.statusCode < 400 ? 1 : 0;
  const entity_id = (() => {
        try { return getEntityId ? getEntityId(req, res) : null; } catch { return null; }
      })();

      const newValues = req.audit?.newValues ?? null;

      try {
        await auditModel.createAuditLog({
          user_id,
          action_name,
          entity_type,
          entity_id: entity_id ? String(entity_id) : null,
          success,
          error_message: res.locals?.errorMessage ?? null,
          ip_address,
          old_values_json: oldValues ? JSON.stringify(oldValues) : null,
          new_values_json: newValues ? JSON.stringify(newValues) : null,
          device_name: req.headers['user-agent'] ?? null,
          mac_address:req.headers['x-device-mac'] ?? null,  
        });
      } catch (_) {
        // ما نكسرش التطبيق لو اللوج فشل
      }
    });

    next();
  };
}

module.exports = { auditLogger };

function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return xff.split(',')[0].trim();
  return req.ip || req.connection?.remoteAddress || null;
}
