import { Router } from 'express';
import Course from '../models/Course.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// GET /api/courses — Tous les cours publiés
router.get('/', async (req, res) => {
  try {
    const { level, category } = req.query;
    const filter = { published: true };
    if (level) filter.level = level;
    if (category) filter.category = category;

    const courses = await Course.find(filter).select('-quizQuestions').sort({ createdAt: -1 });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/courses/:id — Détail d'un cours
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Cours introuvable' });
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/courses — Créer un cours (admin)
router.post('/', protect, async (req, res) => {
  try {
    const course = await Course.create(req.body);
    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/courses/:id — Modifier un cours (admin)
router.put('/:id', protect, async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!course) return res.status(404).json({ message: 'Cours introuvable' });
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
