import AuditLog from '../models/AuditLog.js';

// =============================================
// Helper : extraire l'IP reelle (derriere proxy)
// =============================================
export function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.connection?.remoteAddress
    || req.ip
    || 'unknown';
}

// =============================================
// Helper : creer un log d'audit
// =============================================
export async function audit(req, action, opts = {}) {
  const logData = {
    userId: opts.userId || req.user?._id || null,
    userEmail: opts.userEmail || req.user?.email || '',
    userRole: opts.userRole || req.user?.role || '',
    action,
    description: opts.description || '',
    metadata: opts.metadata || {},
    ip: getClientIp(req),
    userAgent: (req.headers['user-agent'] || '').substring(0, 256),
    endpoint: req.originalUrl || req.url || '',
    method: req.method || '',
    status: opts.status || 'success',
  };

  await AuditLog.log(logData);
}

// =============================================
// Middleware : log automatique des endpoints admin
// =============================================
export function auditAdminActions(req, res, next) {
  // Intercepter la reponse pour logger apres
  const originalSend = res.json;
  res.json = function (body) {
    // Logger les actions admin (sauf GET)
    if (req.method !== 'GET' && req.user) {
      const action = detectAdminAction(req);
      if (action) {
        audit(req, action, {
          description: `${req.method} ${req.originalUrl}`,
          metadata: { body: sanitizeBody(req.body) },
          status: res.statusCode >= 400 ? 'failure' : 'success',
        });
      }
    }
    return originalSend.call(this, body);
  };
  next();
}

// Detecter le type d'action admin
function detectAdminAction(req) {
  const path = req.originalUrl;
  const method = req.method;

  if (path.includes('/admin/courses') && path.includes('/lessons')) {
    if (method === 'POST') return 'ADMIN_LESSON_ADD';
    if (method === 'DELETE') return 'ADMIN_LESSON_DELETE';
  }
  if (path.includes('/admin/courses') && path.includes('/publish')) return method === 'PUT' ? 'ADMIN_COURSE_PUBLISH' : null;
  if (path.includes('/admin/courses')) {
    if (method === 'POST') return 'ADMIN_COURSE_CREATE';
    if (method === 'PUT') return 'ADMIN_COURSE_UPDATE';
    if (method === 'DELETE') return 'ADMIN_COURSE_DELETE';
  }
  if (path.includes('/admin/users')) {
    if (method === 'PUT') return 'ADMIN_USER_UPDATE';
    if (method === 'DELETE') return 'ADMIN_USER_DELETE';
  }
  return null;
}

// Enlever les mots de passe des logs
function sanitizeBody(body) {
  if (!body) return {};
  const safe = { ...body };
  delete safe.password;
  delete safe.currentPassword;
  delete safe.newPassword;
  delete safe.twoFactorSecret;
  return safe;
}
