import { Router } from 'express';
import Course from '../models/Course.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import Payment from '../models/Payment.js';
import { adminProtect } from '../middleware/admin.js';
import { auditAdminActions } from '../middleware/audit.js';

const router = Router();

// Toutes les routes admin sont protegees
router.use(adminProtect);
// Logger automatiquement les actions admin
router.use(auditAdminActions);

// =====================
// DASHBOARD STATS
// =====================

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCourses = await Course.countDocuments();
    const publishedCourses = await Course.countDocuments({ published: true });
    const premiumUsers = await User.countDocuments({ plan: { $in: ['premium', 'pro'] } });

    // Utilisateurs recents (7 derniers jours)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newUsers = await User.countDocuments({ createdAt: { $gte: weekAgo } });

    // Total lecons
    const courses = await Course.find();
    const totalLessons = courses.reduce((sum, c) => sum + (c.lessons?.length || 0), 0);

    // Revenus paiements
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const monthRevenue = await Payment.aggregate([
      { $match: { status: 'completed', paidAt: { $gte: monthAgo } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalPayments = await Payment.countDocuments({ status: 'completed' });

    res.json({
      totalUsers,
      totalCourses,
      publishedCourses,
      premiumUsers,
      newUsers,
      totalLessons,
      totalRevenue: totalRevenue[0]?.total || 0,
      monthRevenue: monthRevenue[0]?.total || 0,
      totalPayments,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =====================
// GESTION DES COURS
// =====================

// GET /api/admin/courses — Tous les cours (publies + brouillons)
router.get('/courses', async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/admin/courses — Creer un cours
router.post('/courses', async (req, res) => {
  try {
    const course = await Course.create(req.body);
    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/admin/courses/:id — Modifier un cours
router.put('/courses/:id', async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!course) return res.status(404).json({ message: 'Cours introuvable' });
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/admin/courses/:id — Supprimer un cours
router.delete('/courses/:id', async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ message: 'Cours introuvable' });
    res.json({ message: 'Cours supprime' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/admin/courses/:id/publish — Publier/Depublier un cours
router.put('/courses/:id/publish', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Cours introuvable' });
    course.published = !course.published;
    await course.save();
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =====================
// GESTION DES LECONS
// =====================

// POST /api/admin/courses/:id/lessons — Ajouter une lecon
router.post('/courses/:id/lessons', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Cours introuvable' });

    const newLesson = {
      title: req.body.title,
      description: req.body.description || '',
      videoUrl: req.body.videoUrl || '',
      duration: req.body.duration || '',
      order: course.lessons.length,
      isFree: req.body.isFree || false,
    };

    course.lessons.push(newLesson);
    await course.save();
    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/admin/courses/:id/lessons/:lessonId — Modifier une lecon
router.put('/courses/:id/lessons/:lessonId', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Cours introuvable' });

    const lesson = course.lessons.id(req.params.lessonId);
    if (!lesson) return res.status(404).json({ message: 'Lecon introuvable' });

    if (req.body.title) lesson.title = req.body.title;
    if (req.body.description !== undefined) lesson.description = req.body.description;
    if (req.body.videoUrl !== undefined) lesson.videoUrl = req.body.videoUrl;
    if (req.body.duration) lesson.duration = req.body.duration;
    if (req.body.isFree !== undefined) lesson.isFree = req.body.isFree;

    await course.save();
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/admin/courses/:id/lessons/:lessonId — Supprimer une lecon
router.delete('/courses/:id/lessons/:lessonId', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Cours introuvable' });

    course.lessons = course.lessons.filter(l => l._id.toString() !== req.params.lessonId);
    await course.save();
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =====================
// GESTION DES UTILISATEURS
// =====================

// GET /api/admin/users — Tous les utilisateurs
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/admin/users/:id — Modifier un utilisateur (role, plan)
router.put('/users/:id', async (req, res) => {
  try {
    const updates = {};
    if (req.body.role) updates.role = req.body.role;
    if (req.body.plan) updates.plan = req.body.plan;

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/admin/users/:id — Supprimer un utilisateur
router.delete('/users/:id', async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Vous ne pouvez pas supprimer votre propre compte' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json({ message: 'Utilisateur supprime' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =====================
// AUDIT TRAIL (OWASP A09:2021)
// =====================

// GET /api/admin/audit — Journal d'audit
router.get('/audit', async (req, res) => {
  try {
    const { action, status, limit = 50, page = 1 } = req.query;
    const filter = {};
    if (action) filter.action = action;
    if (status) filter.status = status;

    const total = await AuditLog.countDocuments(filter);
    const logs = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    res.json({ logs, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/admin/audit/stats — Stats de securite
router.get('/audit/stats', async (req, res) => {
  try {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [failedLogins24h, failedLoginsWeek, lockedAccounts, totalLogs] = await Promise.all([
      AuditLog.countDocuments({ action: 'LOGIN_FAILED', timestamp: { $gte: dayAgo } }),
      AuditLog.countDocuments({ action: 'LOGIN_FAILED', timestamp: { $gte: weekAgo } }),
      AuditLog.countDocuments({ action: 'LOGIN_LOCKED', timestamp: { $gte: weekAgo } }),
      AuditLog.countDocuments(),
    ]);

    // Top IPs avec echecs de connexion
    const suspiciousIps = await AuditLog.aggregate([
      { $match: { action: 'LOGIN_FAILED', timestamp: { $gte: dayAgo } } },
      { $group: { _id: '$ip', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Actions recentes par type
    const recentActions = await AuditLog.aggregate([
      { $match: { timestamp: { $gte: dayAgo } } },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]);

    res.json({
      failedLogins24h,
      failedLoginsWeek,
      lockedAccounts,
      totalLogs,
      suspiciousIps,
      recentActions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
