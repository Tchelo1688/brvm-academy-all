import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Acces non autorise' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key');

    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: 'Utilisateur introuvable' });

    // OWASP: Verifier si le compte est actif
    if (!user.isActive) {
      return res.status(401).json({ message: 'Compte desactive' });
    }

    // OWASP: Verifier si le MDP a change apres emission du token
    if (user.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({ message: 'Mot de passe change. Reconnectez-vous.' });
    }

    // OWASP: Verifier si la session est active
    if (decoded.tokenId && user.activeSessions?.length > 0) {
      const sessionExists = user.activeSessions.some(s => s.tokenId === decoded.tokenId);
      if (!sessionExists) {
        return res.status(401).json({ message: 'Session revoquee' });
      }
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expiree' });
    }
    res.status(401).json({ message: 'Token invalide' });
  }
}
