import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import courseRoutes from './routes/courses.js';
import progressRoutes from './routes/progress.js';
import adminRoutes from './routes/admin.js';
import uploadRoutes from './routes/upload.js';
import paymentRoutes from './routes/payments.js';
import tutorialRoutes from './routes/tutorials.js';
import forumRoutes from './routes/forum.js';
import quizRoutes from './routes/quiz.js';
import webinarRoutes from './routes/webinars.js';
import portfolioRoutes from './routes/portfolio.js';
import affiliationRoutes from './routes/affiliation.js';

dotenv.config();

const app = express();
const isProd = process.env.NODE_ENV === 'production';

// =============================================
// SECURITE — Middleware
// =============================================

// 1. Helmet — Headers HTTP securises
//    Protege contre : XSS, clickjacking, sniffing MIME, etc.
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: isProd ? undefined : false, // Desactive CSP en dev pour Vite
}));

// 2. CORS — Controle d'origine
//    Seul le frontend autorise peut appeler l'API
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:3000',
];
app.use(cors({
  origin: function (origin, callback) {
    // Autorise les requetes sans origin (mobile, Postman, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Non autorise par CORS'));
    }
  },
  credentials: true,
}));

// 3. Rate Limiting — Anti brute-force
//    Limite globale : 100 requetes / 15 min par IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // max 200 requetes par fenetre
  message: { message: 'Trop de requetes, reessayez dans 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', globalLimiter);

// Rate limit strict pour login — 5 tentatives / 15 min
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Trop de tentatives de connexion. Reessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit pour inscription — 3 comptes / heure par IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 3,
  message: { message: 'Trop de comptes crees. Reessayez dans 1 heure.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 4. Body parser avec limite de taille
//    Empeche les attaques par payload volumineux
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 5. Mongo Sanitize — Anti injection NoSQL
//    Supprime les $ et . des requetes pour empecher les injections MongoDB
//    Exemple attaque bloquee : { "email": { "$gt": "" }, "password": "test" }
app.use(mongoSanitize());

// 6. HPP — Anti pollution de parametres HTTP
//    Empeche les attaques par duplication de parametres dans l'URL
app.use(hpp());

// =============================================
// ROUTES API
// =============================================

// Appliquer le rate limit strict sur login et register
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', registerLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/tutorials', tutorialRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/webinars', webinarRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/affiliation', affiliationRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({
  status: 'ok',
  message: 'BRVM Academy API en marche',
  security: {
    helmet: true,
    cors: true,
    rateLimiting: true,
    mongoSanitize: true,
    hpp: true,
  }
}));

// =============================================
// FRONTEND — Servir le build React en production
// =============================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.env.NODE_ENV === 'production') {
  // Servir les fichiers statiques du build
  app.use(express.static(path.join(__dirname, '..', 'dist')));

  // Toute route non-API renvoie index.html (pour React Router)
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
  });
} else {
  // En dev, juste un message
  app.get('/', (req, res) => {
    res.json({ message: 'BRVM Academy API — Mode developpement. Frontend sur http://localhost:5173' });
  });

  // Route 404 API uniquement en dev
  app.use((req, res) => {
    res.status(404).json({ message: 'Route introuvable' });
  });
}

// Erreur globale
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err.message);

  // Erreur CORS
  if (err.message === 'Non autorise par CORS') {
    return res.status(403).json({ message: 'Origine non autorisee' });
  }

  // Erreur MongoDB doublon
  if (err.code === 11000) {
    return res.status(400).json({ message: 'Cette valeur existe deja' });
  }

  // Erreur validation Mongoose
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ message: messages.join(', ') });
  }

  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Token invalide' });
  }

  res.status(500).json({ message: isProd ? 'Erreur interne du serveur' : err.message });
});

// =============================================
// DEMARRAGE
// =============================================

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log('\n==========================================');
    console.log('   BRVM Academy API — Securisee');
    console.log('==========================================');
    console.log('   URL:           http://localhost:' + PORT);
    console.log('   Environnement: ' + (process.env.NODE_ENV || 'development'));
    console.log('   MongoDB:       ' + (process.env.MONGODB_URI ? 'Connecte' : 'Non configure'));
    console.log('   Securite:');
    console.log('     Helmet:        Actif');
    console.log('     CORS:          Actif');
    console.log('     Rate Limit:    200 req/15min (5 login/15min)');
    console.log('     NoSQL Sanitize: Actif');
    console.log('     HPP:           Actif');
    console.log('==========================================\n');
  });
});
