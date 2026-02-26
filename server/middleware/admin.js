import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Vérifie que l'utilisateur est connecté ET est admin
export async function adminProtect(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Acces non autorise' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key');

    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: 'Utilisateur introuvable' });
    if (user.role !== 'admin') return res.status(403).json({ message: 'Acces reserve aux administrateurs' });

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token invalide' });
  }
}
