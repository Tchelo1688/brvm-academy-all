import { Router } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { protect } from '../middleware/auth.js';
import { audit, getClientIp } from '../middleware/audit.js';

const router = Router();

const signToken = (id, tokenId) =>
  jwt.sign(
    { id, tokenId, iat: Math.floor(Date.now() / 1000) },
    process.env.JWT_SECRET || 'dev-secret-key',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
  next();
};

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=]).{8,}$/;

const passwordValidator = body('password')
  .isLength({ min: 8 }).withMessage('Minimum 8 caracteres')
  .matches(PASSWORD_REGEX).withMessage('Requis: 1 majuscule, 1 minuscule, 1 chiffre, 1 special (!@#$%^&*)');

const formatUser = (user) => ({
  id: user._id, name: user.name, email: user.email, country: user.country,
  plan: user.plan, role: user.role, xp: user.xp, progress: user.progress,
  twoFactorEnabled: user.twoFactorEnabled || false, lastLoginAt: user.lastLoginAt,
});

// ===== REGISTER =====
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Nom requis').isLength({ min: 2, max: 50 }).escape(),
  body('email').isEmail().withMessage('Email invalide').normalizeEmail(),
  passwordValidator,
  body('country').optional().trim().isLength({ max: 5 }).escape(),
  validate,
], async (req, res) => {
  try {
    const { name, email, password, country } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Cet email est deja utilise' });

    const user = await User.create({ name, email, password, country });
    const tokenId = crypto.randomBytes(16).toString('hex');
    const token = signToken(user._id, tokenId);

    user.activeSessions.push({ tokenId, ip: getClientIp(req), userAgent: (req.headers['user-agent'] || '').substring(0, 256), expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });
    user.lastLoginAt = new Date();
    user.lastLoginIp = getClientIp(req);
    await user.save({ validateBeforeSave: false });

    await audit(req, 'REGISTER', { userId: user._id, userEmail: email, description: 'Nouveau compte' });
    res.status(201).json({ token, user: formatUser(user) });
  } catch (error) {
    res.status(500).json({ message: 'Erreur inscription' });
  }
});

// ===== LOGIN =====
router.post('/login', [
  body('email').isEmail().withMessage('Email invalide').normalizeEmail(),
  body('password').notEmpty().withMessage('Mot de passe requis'),
  validate,
], async (req, res) => {
  try {
    const { email, password, twoFactorCode } = req.body;
    const user = await User.findOne({ email }).select('+password +twoFactorSecret +twoFactorBackupCodes');

    if (!user) {
      await audit(req, 'LOGIN_FAILED', { userEmail: email, status: 'failure', description: 'Email inconnu' });
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    if (!user.isActive) {
      await audit(req, 'LOGIN_FAILED', { userId: user._id, userEmail: email, status: 'failure', description: 'Compte desactive' });
      return res.status(401).json({ message: 'Compte desactive' });
    }

    if (user.isLocked) {
      await audit(req, 'LOGIN_LOCKED', { userId: user._id, userEmail: email, status: 'failure' });
      const mins = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(423).json({ message: `Compte verrouille. Reessayez dans ${mins} min.` });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incLoginAttempts();
      const left = Math.max(0, 5 - (user.loginAttempts + 1));
      await audit(req, 'LOGIN_FAILED', { userId: user._id, userEmail: email, status: 'failure', metadata: { attemptsLeft: left } });
      if (left <= 0) return res.status(423).json({ message: 'Compte verrouille 30 min apres 5 echecs.' });
      return res.status(401).json({ message: `Email ou mot de passe incorrect. ${left} tentatives restantes.` });
    }

    // 2FA
    if (user.twoFactorEnabled) {
      if (!twoFactorCode) return res.status(200).json({ requires2FA: true, message: 'Code 2FA requis' });

      const isValid2FA = verifyTOTP(user.twoFactorSecret, twoFactorCode);
      let usedBackup = false;
      if (!isValid2FA && user.twoFactorBackupCodes?.length) {
        const idx = user.twoFactorBackupCodes.indexOf(twoFactorCode);
        if (idx > -1) { user.twoFactorBackupCodes.splice(idx, 1); usedBackup = true; }
      }
      if (!isValid2FA && !usedBackup) {
        await audit(req, '2FA_FAILED', { userId: user._id, userEmail: email, status: 'failure' });
        return res.status(401).json({ message: 'Code 2FA invalide' });
      }
    }

    await user.resetLoginAttempts();
    const tokenId = crypto.randomBytes(16).toString('hex');
    const token = signToken(user._id, tokenId);

    if (user.activeSessions.length >= 5) user.activeSessions.shift();
    user.activeSessions.push({ tokenId, ip: getClientIp(req), userAgent: (req.headers['user-agent'] || '').substring(0, 256), expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });
    user.lastLoginAt = new Date();
    user.lastLoginIp = getClientIp(req);
    await user.save({ validateBeforeSave: false });

    await audit(req, 'LOGIN_SUCCESS', { userId: user._id, userEmail: email });
    res.json({ token, user: formatUser(user) });
  } catch (error) {
    res.status(500).json({ message: 'Erreur connexion' });
  }
});

// ===== ME =====
router.get('/me', protect, (req, res) => res.json({ user: formatUser(req.user) }));

// ===== CHANGE PASSWORD =====
router.post('/change-password', protect, [
  body('currentPassword').notEmpty(),
  body('password').isLength({ min: 8 }).matches(PASSWORD_REGEX).withMessage('Mot de passe trop faible'),
  validate,
], async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+password +passwordHistory');
    if (!(await user.comparePassword(req.body.currentPassword))) {
      await audit(req, 'PASSWORD_CHANGE', { status: 'failure' });
      return res.status(401).json({ message: 'Mot de passe actuel incorrect' });
    }
    if (await user.isPasswordReused(req.body.password)) {
      return res.status(400).json({ message: 'Ce mot de passe a deja ete utilise' });
    }
    user.password = req.body.password;
    user.activeSessions = [];
    await user.save();

    const tokenId = crypto.randomBytes(16).toString('hex');
    const token = signToken(user._id, tokenId);
    user.activeSessions.push({ tokenId, ip: getClientIp(req), userAgent: (req.headers['user-agent'] || '').substring(0, 256), expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });
    await user.save({ validateBeforeSave: false });

    await audit(req, 'PASSWORD_CHANGE', { description: 'Succes' });
    res.json({ message: 'Mot de passe change', token });
  } catch (error) {
    res.status(500).json({ message: 'Erreur' });
  }
});

// ===== 2FA SETUP =====
router.post('/2fa/setup', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const secret = crypto.randomBytes(20).toString('hex');
    const backupCodes = Array.from({ length: 8 }, () => crypto.randomBytes(4).toString('hex'));
    user.twoFactorSecret = secret;
    user.twoFactorBackupCodes = backupCodes;
    await user.save({ validateBeforeSave: false });

    const b32 = base32Encode(secret);
    res.json({ secret: b32, otpAuthUrl: `otpauth://totp/BRVMAcademy:${user.email}?secret=${b32}&issuer=BRVMAcademy&digits=6&period=30`, backupCodes });
  } catch (error) {
    res.status(500).json({ message: 'Erreur' });
  }
});

// ===== 2FA VERIFY =====
router.post('/2fa/verify', protect, [body('code').notEmpty().isLength({ min: 6, max: 8 }), validate], async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+twoFactorSecret');
    if (!user.twoFactorSecret) return res.status(400).json({ message: '2FA non configuree' });
    if (!verifyTOTP(user.twoFactorSecret, req.body.code)) return res.status(400).json({ message: 'Code invalide' });
    user.twoFactorEnabled = true;
    await user.save({ validateBeforeSave: false });
    await audit(req, '2FA_ENABLED');
    res.json({ message: '2FA activee !' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur' });
  }
});

// ===== 2FA DISABLE =====
router.post('/2fa/disable', protect, [body('password').notEmpty(), validate], async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(req.body.password))) return res.status(401).json({ message: 'Mot de passe incorrect' });
    user.twoFactorEnabled = false; user.twoFactorSecret = undefined; user.twoFactorBackupCodes = [];
    await user.save({ validateBeforeSave: false });
    await audit(req, '2FA_DISABLED');
    res.json({ message: '2FA desactivee' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur' });
  }
});

// ===== SESSIONS =====
router.get('/sessions', protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ sessions: (user.activeSessions || []).map(s => ({ id: s.tokenId?.substring(0, 8), ip: s.ip, userAgent: s.userAgent?.substring(0, 100), createdAt: s.createdAt, expiresAt: s.expiresAt })) });
});

router.post('/sessions/revoke-all', protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  user.activeSessions = [];
  await user.save({ validateBeforeSave: false });
  await audit(req, 'SESSION_REVOKE_ALL');
  res.json({ message: 'Toutes les sessions fermees' });
});

// ===== LOGOUT =====
router.post('/logout', protect, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = jwt.decode(token);
      if (decoded?.tokenId) {
        const user = await User.findById(req.user._id);
        user.activeSessions = user.activeSessions.filter(s => s.tokenId !== decoded.tokenId);
        await user.save({ validateBeforeSave: false });
      }
    }
    await audit(req, 'LOGOUT');
    res.json({ message: 'Deconnexion reussie' });
  } catch { res.json({ message: 'Deconnexion reussie' }); }
});

// ===== TOTP Helpers =====
function base32Encode(hex) {
  const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = ''; for (const b of Buffer.from(hex, 'hex')) bits += b.toString(2).padStart(8, '0');
  let r = ''; for (let i = 0; i < bits.length; i += 5) r += alpha[parseInt(bits.substring(i, i + 5).padEnd(5, '0'), 2)];
  return r;
}

function verifyTOTP(secret, code) {
  if (!secret || !code) return false;
  const now = Math.floor(Date.now() / 1000);
  for (let i = -1; i <= 1; i++) {
    const counter = Math.floor((now + i * 30) / 30);
    const buf = Buffer.alloc(8); buf.writeBigUInt64BE(BigInt(counter));
    const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'hex')).update(buf).digest();
    const off = hmac[hmac.length - 1] & 0xf;
    const otp = (((hmac[off] & 0x7f) << 24 | hmac[off + 1] << 16 | hmac[off + 2] << 8 | hmac[off + 3]) % 1000000).toString().padStart(6, '0');
    if (otp === code.toString()) return true;
  }
  return false;
}

export default router;
