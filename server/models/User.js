import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8, select: false },
  country: { type: String, default: '' },
  plan: { type: String, enum: ['gratuit', 'premium', 'pro'], default: 'gratuit' },
  role: { type: String, enum: ['user', 'instructor', 'moderator', 'admin'], default: 'user' },
  xp: { type: Number, default: 0 },
  progress: { type: Map, of: Number, default: {} },
  completedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  certificates: [{ courseId: String, earnedAt: Date }],
  avatar: { type: String, default: '' },

  // ===== OWASP: 2FA (A07:2021 - Identification & Authentication Failures) =====
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String, select: false },
  twoFactorBackupCodes: { type: [String], select: false },

  // ===== OWASP: Account Lockout (A07:2021) =====
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },
  lastLoginAt: { type: Date, default: null },
  lastLoginIp: { type: String, default: '' },

  // ===== OWASP: Password Policy (A07:2021) =====
  passwordChangedAt: { type: Date, default: Date.now },
  passwordHistory: { type: [String], select: false, default: [] }, // 5 derniers hashes

  // ===== OWASP: Session Management (A07:2021) =====
  activeSessions: [{
    tokenId: String,
    ip: String,
    userAgent: String,
    createdAt: { type: Date, default: Date.now },
    expiresAt: Date,
  }],

  // ===== OWASP: Account Status =====
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String, select: false },
  emailVerificationExpires: { type: Date, select: false },
  passwordResetToken: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },

}, { timestamps: true });

// Index pour performance et nettoyage auto des sessions
userSchema.index({ 'activeSessions.expiresAt': 1 }, { expireAfterSeconds: 0 });
userSchema.index({ lockUntil: 1 });

// ===== Verifier si le compte est verrouille =====
userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// ===== Hash password avant sauvegarde =====
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  // Garder l'historique des 5 derniers mots de passe
  if (this.passwordHistory.length >= 5) {
    this.passwordHistory.shift();
  }
  if (this.password) {
    this.passwordHistory.push(await bcrypt.hash(this.password, 12));
  }

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordChangedAt = Date.now();
  next();
});

// ===== Comparer mot de passe =====
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// ===== Verifier si le mot de passe a deja ete utilise =====
userSchema.methods.isPasswordReused = async function (candidate) {
  for (const oldHash of this.passwordHistory || []) {
    if (await bcrypt.compare(candidate, oldHash)) return true;
  }
  return false;
};

// ===== Incrementer les tentatives de connexion =====
userSchema.methods.incLoginAttempts = async function () {
  // Reset si le verrouillage a expire
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // Verrouiller apres 5 tentatives (30 min)
  if (this.loginAttempts + 1 >= 5) {
    updates.$set = { lockUntil: Date.now() + 30 * 60 * 1000 };
  }

  return this.updateOne(updates);
};

// ===== Reset tentatives apres connexion reussie =====
userSchema.methods.resetLoginAttempts = async function () {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

// ===== Generer token de reset password =====
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = Date.now() + 30 * 60 * 1000; // 30 min
  return resetToken;
};

// ===== Generer token de verification email =====
userSchema.methods.createEmailVerificationToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24h
  return token;
};

// ===== Verifier si le token JWT a ete emis avant le changement de MDP =====
userSchema.methods.changedPasswordAfter = function (jwtTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return jwtTimestamp < changedTimestamp;
  }
  return false;
};

export default mongoose.model('User', userSchema);
