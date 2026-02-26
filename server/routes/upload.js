import { Router } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';
import { adminProtect } from '../middleware/admin.js';
import { audit } from '../middleware/audit.js';

dotenv.config();

const router = Router();

// =============================================
// CONFIG CLOUDINARY
// =============================================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// =============================================
// MULTER — Stockage temporaire en memoire
// =============================================
const storage = multer.memoryStorage();

const videoFilter = (req, file, cb) => {
  const allowedVideo = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
  const allowedImage = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const allowed = [...allowedVideo, ...allowedImage];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format non supporte. Utilisez MP4, WebM, MOV, JPG, PNG, WebP.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter: videoFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500 MB max
  },
});

// =============================================
// POST /api/upload/video — Upload video vers Cloudinary
// =============================================
router.post('/video', adminProtect, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier envoye' });
    }

    // Verifier que Cloudinary est configure
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
      return res.status(500).json({ message: 'Cloudinary non configure. Ajoutez CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY et CLOUDINARY_API_SECRET dans .env' });
    }

    const isVideo = req.file.mimetype.startsWith('video/');

    // Upload vers Cloudinary via stream
    const result = await new Promise((resolve, reject) => {
      const uploadOptions = {
        resource_type: isVideo ? 'video' : 'image',
        folder: isVideo ? 'brvm-academy/videos' : 'brvm-academy/images',
        // Pour les videos: transcoder en MP4 adaptatif
        ...(isVideo && {
          eager: [
            { streaming_profile: 'hd', format: 'mp4' },
          ],
          eager_async: true,
        }),
      };

      const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      });

      stream.end(req.file.buffer);
    });

    // Audit
    await audit(req, 'ADMIN_COURSE_UPDATE', {
      description: `Upload ${isVideo ? 'video' : 'image'}: ${req.file.originalname}`,
      metadata: {
        filename: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype,
        cloudinaryId: result.public_id,
      }
    });

    res.json({
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      duration: result.duration || null,
      size: result.bytes,
      width: result.width,
      height: result.height,
      resourceType: result.resource_type,
      message: 'Upload reussi !',
    });

  } catch (error) {
    console.error('Upload error:', error);
    if (error.message?.includes('File too large')) {
      return res.status(413).json({ message: 'Fichier trop volumineux (max 500 MB)' });
    }
    res.status(500).json({ message: error.message || 'Erreur d\'upload' });
  }
});

// =============================================
// POST /api/upload/image — Upload image (thumbnail)
// =============================================
router.post('/image', adminProtect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Aucun fichier envoye' });

    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return res.status(500).json({ message: 'Cloudinary non configure' });
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({
        resource_type: 'image',
        folder: 'brvm-academy/thumbnails',
        transformation: [{ width: 800, height: 450, crop: 'fill', quality: 'auto' }],
      }, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
      stream.end(req.file.buffer);
    });

    res.json({
      url: result.secure_url,
      publicId: result.public_id,
      message: 'Image uploadee !',
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Erreur upload image' });
  }
});

// =============================================
// DELETE /api/upload/:publicId — Supprimer un fichier
// =============================================
router.delete('/:publicId(*)', adminProtect, async (req, res) => {
  try {
    const { resourceType = 'video' } = req.query;
    await cloudinary.uploader.destroy(req.params.publicId, { resource_type: resourceType });
    res.json({ message: 'Fichier supprime de Cloudinary' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =============================================
// GET /api/upload/status — Verifier config Cloudinary
// =============================================
router.get('/status', adminProtect, async (req, res) => {
  const configured = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
  
  if (!configured) {
    return res.json({
      configured: false,
      message: 'Cloudinary non configure. Ajoutez les cles dans .env',
    });
  }

  try {
    // Tester la connexion
    const result = await cloudinary.api.ping();
    res.json({
      configured: true,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      status: result.status || 'ok',
    });
  } catch (error) {
    res.json({ configured: true, status: 'error', message: error.message });
  }
});

export default router;
