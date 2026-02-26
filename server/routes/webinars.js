import { Router } from 'express';
import Webinar from '../models/Webinar.js';
import { protect } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

// GET /api/webinars — Liste
router.get('/', async (req, res) => {
  try {
    const webinars = await Webinar.find({ published: true })
      .select('-messages')
      .sort({ scheduledAt: 1 })
      .lean();
    res.json(webinars);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// GET /api/webinars/:id
router.get('/:id', async (req, res) => {
  try {
    const webinar = await Webinar.findById(req.params.id);
    if (!webinar) return res.status(404).json({ message: 'Webinaire introuvable' });
    res.json(webinar);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// POST /api/webinars — Creer (instructor+)
router.post('/', requireRole('instructor', 'moderator', 'admin'), async (req, res) => {
  try {
    const webinar = await Webinar.create(req.body);
    res.status(201).json(webinar);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// PUT /api/webinars/:id
router.put('/:id', requireRole('instructor', 'moderator', 'admin'), async (req, res) => {
  try {
    const webinar = await Webinar.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(webinar);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// POST /api/webinars/:id/register — S'inscrire
router.post('/:id/register', protect, async (req, res) => {
  try {
    const webinar = await Webinar.findById(req.params.id);
    if (!webinar) return res.status(404).json({ message: 'Webinaire introuvable' });
    if (webinar.registrations.length >= webinar.maxParticipants) {
      return res.status(400).json({ message: 'Webinaire complet' });
    }
    const already = webinar.registrations.find(r => r.userId.toString() === req.user._id.toString());
    if (already) return res.status(400).json({ message: 'Deja inscrit' });

    webinar.registrations.push({ userId: req.user._id, userName: req.user.name });
    await webinar.save();
    res.json({ message: 'Inscrit avec succes', registrations: webinar.registrations.length });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// POST /api/webinars/:id/message — Envoyer un message (chat live)
router.post('/:id/message', protect, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Message requis' });

    const webinar = await Webinar.findById(req.params.id);
    if (!webinar) return res.status(404).json({ message: 'Webinaire introuvable' });

    webinar.messages.push({ userId: req.user._id, userName: req.user.name, content });
    await webinar.save();

    const lastMessages = webinar.messages.slice(-50);
    res.json(lastMessages);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// GET /api/webinars/:id/messages — Derniers messages
router.get('/:id/messages', protect, async (req, res) => {
  try {
    const webinar = await Webinar.findById(req.params.id).select('messages');
    res.json(webinar?.messages?.slice(-50) || []);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// DELETE /api/webinars/:id
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    await Webinar.findByIdAndDelete(req.params.id);
    res.json({ message: 'Supprime' });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

export default router;
