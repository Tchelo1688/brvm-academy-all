import mongoose from 'mongoose';

// =============================================
// OWASP A09:2021 — Security Logging & Monitoring
// =============================================
// Enregistre toutes les actions sensibles pour
// la detection d'intrusion et la conformite

const auditLogSchema = new mongoose.Schema({
  // Qui
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  userEmail: { type: String, default: '' },
  userRole: { type: String, default: '' },

  // Quoi
  action: {
    type: String,
    required: true,
    enum: [
      // Auth
      'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGIN_LOCKED',
      'REGISTER', 'LOGOUT',
      'PASSWORD_CHANGE', 'PASSWORD_RESET_REQUEST', 'PASSWORD_RESET_SUCCESS',
      '2FA_ENABLED', '2FA_DISABLED', '2FA_VERIFIED', '2FA_FAILED',

      // Admin
      'ADMIN_COURSE_CREATE', 'ADMIN_COURSE_UPDATE', 'ADMIN_COURSE_DELETE',
      'ADMIN_COURSE_PUBLISH', 'ADMIN_COURSE_UNPUBLISH',
      'ADMIN_LESSON_ADD', 'ADMIN_LESSON_DELETE',
      'ADMIN_USER_UPDATE', 'ADMIN_USER_DELETE', 'ADMIN_USER_ROLE_CHANGE',

      // Session
      'SESSION_CREATE', 'SESSION_REVOKE', 'SESSION_REVOKE_ALL',

      // Data
      'DATA_EXPORT', 'DATA_DELETE',

      // Security
      'SUSPICIOUS_ACTIVITY', 'RATE_LIMIT_HIT', 'INVALID_TOKEN',
      'UNAUTHORIZED_ACCESS', 'CSRF_VIOLATION',
    ]
  },

  // Details
  description: { type: String, default: '' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },

  // Ou
  ip: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  endpoint: { type: String, default: '' },
  method: { type: String, default: '' },

  // Resultat
  status: { type: String, enum: ['success', 'failure', 'warning'], default: 'success' },

  // Quand
  timestamp: { type: Date, default: Date.now },

}, { timestamps: false });

// Index pour recherche rapide et retention
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ ip: 1, timestamp: -1 });

// Auto-suppression apres 90 jours (retention policy)
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Methode statique pour creer un log facilement
auditLogSchema.statics.log = async function (data) {
  try {
    return await this.create(data);
  } catch (err) {
    // Ne jamais bloquer l'application si le logging echoue
    console.error('Audit log error:', err.message);
  }
};

export default mongoose.model('AuditLog', auditLogSchema);
