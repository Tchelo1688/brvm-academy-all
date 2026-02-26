import { Router } from 'express';
import crypto from 'crypto';
import Course from '../models/Course.js';
import Certificate from '../models/Certificate.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// POST /api/quiz/:courseId/submit — Soumettre un quiz
router.post('/:courseId/submit', protect, async (req, res) => {
  try {
    const { answers } = req.body; // [{questionIndex, selectedOption}]
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: 'Cours introuvable' });
    if (!course.quizQuestions?.length) return res.status(400).json({ message: 'Pas de quiz pour ce cours' });

    // Corriger
    let correct = 0;
    const results = course.quizQuestions.map((q, i) => {
      const userAnswer = answers?.find(a => a.questionIndex === i);
      const isCorrect = userAnswer?.selectedOption === q.correct;
      if (isCorrect) correct++;
      return { question: q.question, correct: q.correct, selected: userAnswer?.selectedOption ?? -1, isCorrect };
    });

    const score = Math.round((correct / course.quizQuestions.length) * 100);
    const passed = score >= 70;

    // XP
    const xpEarned = Math.round(score / 10) * 5;
    await User.findByIdAndUpdate(req.user._id, { $inc: { xp: xpEarned } });

    // Si reussi >= 70%, creer le certificat
    let certificate = null;
    if (passed) {
      const existing = await Certificate.findOne({ userId: req.user._id, courseId: course._id });
      if (!existing) {
        const certNumber = 'BRVM-' + Date.now().toString(36).toUpperCase() + '-' + crypto.randomBytes(3).toString('hex').toUpperCase();
        certificate = await Certificate.create({
          userId: req.user._id,
          userName: req.user.name,
          userEmail: req.user.email,
          courseId: course._id,
          courseTitle: course.title,
          courseCategory: course.category,
          courseLevel: course.level,
          instructor: course.instructor,
          quizScore: score,
          certificateNumber: certNumber,
        });
        // Ajouter aux cours completes
        await User.findByIdAndUpdate(req.user._id, {
          $addToSet: { completedCourses: course._id, certificates: { courseId: course._id.toString(), earnedAt: new Date() } },
        });
      } else {
        certificate = existing;
      }
    }

    res.json({
      score,
      correct,
      total: course.quizQuestions.length,
      passed,
      xpEarned,
      results,
      certificate: certificate ? { certificateNumber: certificate.certificateNumber, id: certificate._id } : null,
    });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// GET /api/quiz/certificates — Mes certificats
router.get('/certificates', protect, async (req, res) => {
  try {
    const certs = await Certificate.find({ userId: req.user._id }).sort({ earnedAt: -1 }).lean();
    res.json(certs);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// GET /api/quiz/certificates/:id — Detail d'un certificat (public pour verification)
router.get('/certificates/:id', async (req, res) => {
  try {
    const cert = await Certificate.findOne({
      $or: [{ _id: req.params.id }, { certificateNumber: req.params.id }],
    }).lean();
    if (!cert) return res.status(404).json({ message: 'Certificat introuvable' });
    res.json(cert);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

export default router;
