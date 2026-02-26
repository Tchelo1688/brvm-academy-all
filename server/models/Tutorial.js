import mongoose from 'mongoose';

const tutorialSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  content: { type: String, default: '' }, // Contenu markdown/texte

  // Categorie
  category: {
    type: String,
    enum: ['Guide Pratique', 'Analyse', 'Strategie', 'Reglementation', 'Outils', 'Debutant'],
    default: 'Guide Pratique',
  },
  icon: { type: String, default: '📘' },
  color: { type: String, default: 'bg-blue-500/15' },

  // Fichiers PDF
  pdfFiles: [{
    name: { type: String, required: true },
    url: { type: String, required: true },
    publicId: { type: String, default: '' }, // Cloudinary ID
    size: { type: Number, default: 0 }, // en bytes
    pages: { type: Number, default: 0 },
    uploadedAt: { type: Date, default: Date.now },
  }],

  // Auteur
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, default: '' },

  // Stats
  views: { type: Number, default: 0 },
  readTime: { type: String, default: '5 min' },

  // Access
  accessLevel: {
    type: String,
    enum: ['gratuit', 'premium', 'pro'],
    default: 'gratuit',
  },
  published: { type: Boolean, default: true },

  // Tags
  tags: [{ type: String }],

}, { timestamps: true });

tutorialSchema.index({ published: 1, category: 1 });
tutorialSchema.index({ author: 1 });
tutorialSchema.index({ tags: 1 });

export default mongoose.model('Tutorial', tutorialSchema);
