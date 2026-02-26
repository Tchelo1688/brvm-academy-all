import { Router } from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// POST /api/progress/complete-lesson — Marquer une leçon comme complétée
router.post('/complete-lesson', protect, async (req, res) => {
  try {
    const { courseId, lessonIndex } = req.body;
    const user = req.user;

    const currentProgress = user.progress.get(courseId) || -1;
    if (lessonIndex > currentProgress) {
      user.progress.set(courseId, lessonIndex);
      user.xp += 50; // +50 XP par leçon
      await user.save();
    }

    res.json({ progress: user.progress, xp: user.xp });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/progress/complete-quiz — Valider un quiz
router.post('/complete-quiz', protect, async (req, res) => {
  try {
    const { courseId, score, total } = req.body;
    const pct = (score / total) * 100;

    if (pct >= 70) {
      const user = req.user;
      if (!user.certificates.find((c) => c.courseId === courseId)) {
        user.certificates.push({ courseId, earnedAt: new Date() });
        user.xp += 500; // +500 XP pour un certificat
        await user.save();
      }
      return res.json({ passed: true, certificate: true, xp: user.xp });
    }

    res.json({ passed: false, certificate: false });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/progress/leaderboard — Classement
router.get('/leaderboard', async (req, res) => {
  try {
    const users = await User.find()
      .select('name country xp')
      .sort({ xp: -1 })
      .limit(20);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
