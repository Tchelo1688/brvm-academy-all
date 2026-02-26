import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// =============================================
// ROLES & PERMISSIONS (RBAC)
// =============================================
// Chaque role herite des permissions du role inferieur

const PERMISSIONS = {
  user: [
    'course:read',
    'tutorial:read',
    'quiz:take',
    'progress:read',
    'progress:write',
    'payment:own',
    'profile:own',
  ],
  instructor: [
    // Herite de user +
    'course:create',
    'course:edit_own',
    'lesson:create',
    'lesson:edit_own',
    'tutorial:create',
    'tutorial:edit_own',
    'tutorial:upload_pdf',
    'student:view',
  ],
  moderator: [
    // Herite de instructor +
    'course:edit_any',
    'lesson:edit_any',
    'tutorial:edit_any',
    'tutorial:delete',
    'user:view',
    'user:edit_plan',
    'audit:read',
  ],
  admin: [
    // Tout
    'course:delete',
    'lesson:delete',
    'user:edit_role',
    'user:delete',
    'admin:stats',
    'admin:settings',
    'payment:view_all',
    'payment:refund',
  ],
};

// Resoudre toutes les permissions d'un role (avec heritage)
const ROLE_HIERARCHY = ['user', 'instructor', 'moderator', 'admin'];

export function getPermissions(role) {
  const idx = ROLE_HIERARCHY.indexOf(role);
  if (idx === -1) return PERMISSIONS.user;

  let perms = [];
  for (let i = 0; i <= idx; i++) {
    perms = [...perms, ...(PERMISSIONS[ROLE_HIERARCHY[i]] || [])];
  }
  return [...new Set(perms)];
}

export function hasPermission(role, permission) {
  return getPermissions(role).includes(permission);
}

// =============================================
// MIDDLEWARE: Verifier un role minimum
// =============================================
export function requireRole(...roles) {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Acces non autorise' });
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key');

      const user = await User.findById(decoded.id);
      if (!user) return res.status(401).json({ message: 'Utilisateur introuvable' });
      if (!user.isActive) return res.status(401).json({ message: 'Compte desactive' });

      // Verifier si le role de l'utilisateur est dans la liste autorisee
      if (!roles.includes(user.role)) {
        // Verifier aussi par hierarchie (admin > moderator > instructor > user)
        const userLevel = ROLE_HIERARCHY.indexOf(user.role);
        const minLevel = Math.min(...roles.map(r => ROLE_HIERARCHY.indexOf(r)));
        if (userLevel < minLevel) {
          return res.status(403).json({ message: 'Permissions insuffisantes' });
        }
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({ message: 'Token invalide' });
    }
  };
}

// =============================================
// MIDDLEWARE: Verifier une permission specifique
// =============================================
export function requirePermission(permission) {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Acces non autorise' });
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key');

      const user = await User.findById(decoded.id);
      if (!user) return res.status(401).json({ message: 'Utilisateur introuvable' });
      if (!user.isActive) return res.status(401).json({ message: 'Compte desactive' });

      if (!hasPermission(user.role, permission)) {
        return res.status(403).json({ message: `Permission requise: ${permission}` });
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({ message: 'Token invalide' });
    }
  };
}

// =============================================
// HELPER: Liste des roles pour le frontend
// =============================================
export const ROLES = [
  { value: 'user', label: 'Utilisateur', description: 'Acces cours et quiz', color: 'gray' },
  { value: 'instructor', label: 'Instructeur', description: 'Creer et gerer ses propres cours/tutoriels', color: 'blue' },
  { value: 'moderator', label: 'Moderateur', description: 'Modifier tous les contenus + voir les utilisateurs', color: 'orange' },
  { value: 'admin', label: 'Administrateur', description: 'Acces complet a la plateforme', color: 'red' },
];
