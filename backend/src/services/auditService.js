const AuditLog = require('../models/AuditLog');

async function logAudit({ action, performedBy, targetResource, targetId, details = {}, ipAddress = '127.0.0.1' }) {
  try {
    await AuditLog.create({
      action,
      performedBy,
      targetResource,
      targetId: targetId ? targetId.toString() : undefined,
      details,
      ipAddress
    });
  } catch (err) {
    console.error('[AuditLog] Error writing audit log:', err.message);
  }
}

module.exports = {
  logAudit
};
