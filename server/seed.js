// ===========================================
// Script pour remplir la base de données avec
// les cours initiaux de BRVM Academy
// ===========================================
// Exécuter : node server/seed.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

// --- Modèles inline (pour éviter les problèmes d'import) ---

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  country: { type: String, default: '' },
  plan: { type: String, default: 'gratuit' },
  role: { type: String, default: 'user' },
  xp: { type: Number, default: 0 },
  progress: { type: Map, of: Number, default: {} },
  completedCourses: [mongoose.Schema.Types.ObjectId],
  certificates: [{ courseId: String, earnedAt: Date }],
}, { timestamps: true });

const lessonSchema = new mongoose.Schema({
  title: String,
  description: String,
  videoUrl: String,
  duration: String,
  order: Number,
  isFree: { type: Boolean, default: false },
});

const courseSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  level: { type: String, enum: ['debutant', 'intermediaire', 'avance'] },
  emoji: String,
  thumbClass: String,
  duration: String,
  instructor: String,
  rating: Number,
  studentCount: Number,
  lessons: [lessonSchema],
  quizQuestions: [{ question: String, options: [String], correct: Number }],
  published: { type: Boolean, default: true },
  isFree: { type: Boolean, default: false },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Course = mongoose.model('Course', courseSchema);

// --- Données ---

const courses = [
  {
    title: 'Introduction à la BRVM : Comprendre la Bourse Ouest-Africaine',
    description: 'Découvrez le fonctionnement de la BRVM, les marchés actions et obligations, et comment ouvrir votre premier compte titre.',
    category: 'Fondamentaux',
    level: 'debutant',
    emoji: '📈',
    thumbClass: 'bg-gradient-to-br from-[#1a3a2a] to-[#0d1f17]',
    duration: '2h 45min',
    instructor: 'Ibrahima Ndiaye',
    rating: 4.9,
    studentCount: 2400,
    isFree: true,
    lessons: [
      { title: "Qu'est-ce que la BRVM ?", duration: '12:30', order: 0, isFree: true, videoUrl: '' },
      { title: 'Les 8 pays de la zone UEMOA', duration: '8:45', order: 1, isFree: true, videoUrl: '' },
      { title: 'Actions vs Obligations', duration: '15:20', order: 2, videoUrl: '' },
      { title: 'Comment ouvrir un compte titre', duration: '18:00', order: 3, videoUrl: '' },
      { title: "Les SGI (Sociétés de Gestion et d'Intermédiation)", duration: '14:10', order: 4, videoUrl: '' },
      { title: 'Lire une cotation BRVM', duration: '11:30', order: 5, videoUrl: '' },
      { title: 'Les indices BRVM-Composite et BRVM-10', duration: '13:45', order: 6, videoUrl: '' },
      { title: 'Passer un ordre au marché', duration: '16:20', order: 7, videoUrl: '' },
      { title: 'Passer un ordre à cours limité', duration: '14:50', order: 8, videoUrl: '' },
      { title: 'Les frais de courtage', duration: '10:15', order: 9, videoUrl: '' },
      { title: 'La fiscalité boursière en zone UEMOA', duration: '17:30', order: 10, videoUrl: '' },
      { title: 'Résumé et quiz final', duration: '8:00', order: 11, videoUrl: '' },
    ],
    quizQuestions: [
      {
        question: "Qu'est-ce que la BRVM ?",
        options: ['Une banque centrale africaine', 'La Bourse Régionale des Valeurs Mobilières', "Un fonds d'investissement", 'Une agence de notation'],
        correct: 1,
      },
      {
        question: 'Combien de pays composent la zone UEMOA ?',
        options: ['6', '7', '8', '10'],
        correct: 2,
      },
      {
        question: "Quel est le rôle d'une SGI ?",
        options: ['Imprimer la monnaie FCFA', 'Gérer les impôts boursiers', "Servir d'intermédiaire pour acheter/vendre des titres en bourse", 'Réguler les banques commerciales'],
        correct: 2,
      },
      {
        question: "Que mesure l'indice BRVM-Composite ?",
        options: ['Le PIB de la zone UEMOA', 'La performance globale de toutes les actions cotées à la BRVM', 'Le taux de change du FCFA', "L'inflation en Côte d'Ivoire"],
        correct: 1,
      },
    ],
  },
  {
    title: 'Analyse Technique des Actions BRVM',
    description: 'Maîtrisez les chandeliers japonais, les supports/résistances et les indicateurs clés pour trader sur la BRVM.',
    category: 'Analyse Technique',
    level: 'intermediaire',
    emoji: '📊',
    thumbClass: 'bg-gradient-to-br from-[#2a1a0a] to-[#1f0d05]',
    duration: '3h 20min',
    instructor: 'Fatou Diallo',
    rating: 4.8,
    studentCount: 1800,
    lessons: [
      { title: "Introduction à l'analyse technique", duration: '10:00', order: 0, isFree: true, videoUrl: '' },
      { title: 'Les chandeliers japonais', duration: '14:30', order: 1, videoUrl: '' },
      { title: 'Supports et résistances', duration: '12:00', order: 2, videoUrl: '' },
      { title: 'Les figures chartistes', duration: '16:00', order: 3, videoUrl: '' },
      { title: 'Les moyennes mobiles', duration: '13:00', order: 4, videoUrl: '' },
      { title: 'Le RSI (Relative Strength Index)', duration: '11:00', order: 5, videoUrl: '' },
      { title: 'Le MACD', duration: '14:00', order: 6, videoUrl: '' },
      { title: 'Les volumes de transaction', duration: '10:00', order: 7, videoUrl: '' },
    ],
    quizQuestions: [],
  },
  {
    title: "Stratégies d'Investissement UEMOA",
    description: 'Construisez un portefeuille diversifié avec les meilleures actions de la zone UEMOA.',
    category: 'Stratégies',
    level: 'avance',
    emoji: '💰',
    thumbClass: 'bg-gradient-to-br from-[#0a1a2a] to-[#050d1f]',
    duration: '4h 10min',
    instructor: 'Moussa Traoré',
    rating: 4.7,
    studentCount: 1200,
    lessons: [],
    quizQuestions: [],
  },
  {
    title: 'Investir dans les Obligations BRVM',
    description: "Comprenez le marché obligataire ouest-africain, les emprunts d'État et les obligations d'entreprises cotées.",
    category: 'Obligations',
    level: 'debutant',
    emoji: '🏦',
    thumbClass: 'bg-gradient-to-br from-[#2a0a1a] to-[#1f050d]',
    duration: '1h 50min',
    instructor: 'Awa Konaté',
    rating: 4.6,
    studentCount: 980,
    lessons: [],
    quizQuestions: [],
  },
  {
    title: 'Lire les États Financiers des Sociétés Cotées',
    description: 'Apprenez à analyser les bilans, comptes de résultat et ratios financiers des entreprises listées à la BRVM.',
    category: 'Analyse Fondamentale',
    level: 'intermediaire',
    emoji: '🔍',
    thumbClass: 'bg-gradient-to-br from-[#1a2a0a] to-[#0d1f05]',
    duration: '3h 00min',
    instructor: 'Ibrahima Ndiaye',
    rating: 4.9,
    studentCount: 1500,
    lessons: [],
    quizQuestions: [],
  },
  {
    title: 'Ouvrir un Compte Titre & Passer ses Premiers Ordres',
    description: 'Guide pas-à-pas pour ouvrir un compte chez un SGI et placer vos premiers ordres.',
    category: 'Pratique',
    level: 'debutant',
    emoji: '🌐',
    thumbClass: 'bg-gradient-to-br from-[#0a2a2a] to-[#051f1f]',
    duration: '2h 15min',
    instructor: 'Fatou Diallo',
    rating: 4.8,
    studentCount: 3100,
    isFree: true,
    lessons: [],
    quizQuestions: [],
  },
];

// --- Seed ---

async function seed() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('❌ MONGODB_URI manquant dans .env');
      process.exit(1);
    }

    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(uri);
    console.log('✅ Connecté !');

    // Nettoyer les collections
    await User.deleteMany({});
    await Course.deleteMany({});
    console.log('🗑️  Collections nettoyées');

    // Créer un utilisateur admin de test
    const hashedPassword = await bcrypt.hash('Admin@2026!', 12);
    const admin = await User.create({
      name: 'Admin BRVM',
      email: 'admin@brvm-academy.com',
      password: hashedPassword,
      country: 'CI',
      plan: 'pro',
      role: 'admin',
      xp: 10000,
    });
    console.log('Admin cree : admin@brvm-academy.com / Admin@2026!');

    // Créer un utilisateur test
    const testPassword = await bcrypt.hash('Test@2026!', 12);
    await User.create({
      name: 'Amadou Konate',
      email: 'amadou@test.com',
      password: testPassword,
      country: 'ML',
      plan: 'premium',
      xp: 4250,
    });
    console.log('User cree : amadou@test.com / Test@2026!');

    // Créer les cours
    const createdCourses = await Course.insertMany(courses);
    console.log(`📚 ${createdCourses.length} cours créés`);

    console.log('\n🎉 Base de données initialisée avec succès !');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Comptes de test :');
    console.log('  Admin : admin@brvm-academy.com / admin123');
    console.log('  User  : amadou@test.com / test123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

seed();
