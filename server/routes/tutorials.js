import { Router } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import Tutorial from '../models/Tutorial.js';
import { protect } from '../middleware/auth.js';
import { requireRole, requirePermission } from '../middleware/rbac.js';
import { audit } from '../middleware/audit.js';

const router = Router();

// Multer pour PDF
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Seuls les fichiers PDF sont acceptes'), false);
  },
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max
});

// =============================================
// GET /api/tutorials — Liste des tutoriels publies
// =============================================
router.get('/', async (req, res) => {
  try {
    const { category, accessLevel } = req.query;
    const filter = { published: true };
    if (category) filter.category = category;
    if (accessLevel) filter.accessLevel = accessLevel;

    const tutorials = await Tutorial.find(filter)
      .select('-content') // Ne pas envoyer le contenu complet dans la liste
      .sort({ createdAt: -1 })
      .lean();

    res.json(tutorials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =============================================
// GET /api/tutorials/:id — Detail d'un tutoriel
// =============================================
router.get('/:id', async (req, res) => {
  try {
    const tutorial = await Tutorial.findById(req.params.id);
    if (!tutorial) return res.status(404).json({ message: 'Tutoriel introuvable' });

    // Incrementer les vues
    tutorial.views += 1;
    await tutorial.save({ validateBeforeSave: false });

    res.json(tutorial);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =============================================
// POST /api/tutorials — Creer un tutoriel
// Accessible: instructor, moderator, admin
// =============================================
router.post('/', requireRole('instructor', 'moderator', 'admin'), async (req, res) => {
  try {
    const { title, description, content, category, icon, color, accessLevel, tags, readTime } = req.body;

    const tutorial = await Tutorial.create({
      title, description, content,
      category: category || 'Guide Pratique',
      icon: icon || '📘',
      color: color || 'bg-blue-500/15',
      accessLevel: accessLevel || 'gratuit',
      tags: tags || [],
      readTime: readTime || '5 min',
      author: req.user._id,
      authorName: req.user.name,
    });

    await audit(req, 'ADMIN_COURSE_CREATE', {
      description: `Tutoriel cree: ${title}`,
      metadata: { tutorialId: tutorial._id },
    });

    res.status(201).json(tutorial);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =============================================
// PUT /api/tutorials/:id — Modifier un tutoriel
// =============================================
router.put('/:id', requireRole('instructor', 'moderator', 'admin'), async (req, res) => {
  try {
    const tutorial = await Tutorial.findById(req.params.id);
    if (!tutorial) return res.status(404).json({ message: 'Tutoriel introuvable' });

    // Instructor ne peut modifier que ses propres tutoriels
    if (req.user.role === 'instructor' && tutorial.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Vous ne pouvez modifier que vos propres tutoriels' });
    }

    const updates = req.body;
    Object.assign(tutorial, updates);
    await tutorial.save();

    res.json(tutorial);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =============================================
// DELETE /api/tutorials/:id — Supprimer un tutoriel
// Accessible: moderator, admin
// =============================================
router.delete('/:id', requireRole('moderator', 'admin'), async (req, res) => {
  try {
    const tutorial = await Tutorial.findByIdAndDelete(req.params.id);
    if (!tutorial) return res.status(404).json({ message: 'Tutoriel introuvable' });

    // Supprimer les PDFs de Cloudinary
    for (const pdf of tutorial.pdfFiles || []) {
      if (pdf.publicId) {
        try {
          await cloudinary.uploader.destroy(pdf.publicId, { resource_type: 'raw' });
        } catch { /* ignore */ }
      }
    }

    await audit(req, 'ADMIN_COURSE_DELETE', { description: `Tutoriel supprime: ${tutorial.title}` });

    res.json({ message: 'Tutoriel supprime' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =============================================
// POST /api/tutorials/:id/pdf — Upload PDF
// Accessible: instructor (own), moderator, admin
// =============================================
router.post('/:id/pdf', requireRole('instructor', 'moderator', 'admin'), upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Aucun fichier PDF envoye' });

    const tutorial = await Tutorial.findById(req.params.id);
    if (!tutorial) return res.status(404).json({ message: 'Tutoriel introuvable' });

    // Verifier ownership pour instructor
    if (req.user.role === 'instructor' && tutorial.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Vous ne pouvez ajouter un PDF qu\'a vos propres tutoriels' });
    }

    // Upload vers Cloudinary (ou stockage local si non configure)
    let pdfData;

    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
      // Upload Cloudinary
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({
          resource_type: 'raw',
          folder: 'brvm-academy/pdfs',
          format: 'pdf',
          access_mode: 'public',
          type: 'upload',
        }, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        });
        stream.end(req.file.buffer);
      });

      pdfData = {
        name: req.file.originalname,
        url: result.secure_url,
        publicId: result.public_id,
        size: req.file.size,
      };
    } else {
      // Mode sans Cloudinary — encoder en base64 data URL (pour dev seulement)
      const base64 = req.file.buffer.toString('base64');
      pdfData = {
        name: req.file.originalname,
        url: `data:application/pdf;base64,${base64}`,
        publicId: '',
        size: req.file.size,
      };
    }

    tutorial.pdfFiles.push(pdfData);
    await tutorial.save();

    await audit(req, 'ADMIN_COURSE_UPDATE', {
      description: `PDF ajoute: ${req.file.originalname} au tutoriel ${tutorial.title}`,
    });

    res.json({
      message: 'PDF uploade avec succes',
      pdf: pdfData,
      tutorial,
    });

  } catch (error) {
    console.error('PDF upload error:', error);
    res.status(500).json({ message: error.message || 'Erreur upload PDF' });
  }
});

// =============================================
// DELETE /api/tutorials/:id/pdf/:pdfId — Supprimer un PDF
// =============================================
router.delete('/:id/pdf/:pdfId', requireRole('instructor', 'moderator', 'admin'), async (req, res) => {
  try {
    const tutorial = await Tutorial.findById(req.params.id);
    if (!tutorial) return res.status(404).json({ message: 'Tutoriel introuvable' });

    const pdf = tutorial.pdfFiles.id(req.params.pdfId);
    if (!pdf) return res.status(404).json({ message: 'PDF introuvable' });

    // Supprimer de Cloudinary
    if (pdf.publicId) {
      try { await cloudinary.uploader.destroy(pdf.publicId, { resource_type: 'raw' }); } catch { /* ignore */ }
    }

    tutorial.pdfFiles.pull(req.params.pdfId);
    await tutorial.save();

    res.json({ message: 'PDF supprime', tutorial });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =============================================
// GET /api/tutorials/admin/all — Tous les tutoriels (admin view)
// =============================================
router.get('/admin/all', requireRole('instructor', 'moderator', 'admin'), async (req, res) => {
  try {
    let filter = {};
    // Instructor ne voit que ses tutoriels
    if (req.user.role === 'instructor') {
      filter.author = req.user._id;
    }

    const tutorials = await Tutorial.find(filter).sort({ createdAt: -1 }).lean();
    res.json(tutorials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
