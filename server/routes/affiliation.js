import { Router } from 'express';
import Affiliation from '../models/Affiliation.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// GET /api/affiliation — Mon programme d'affiliation
router.get('/', protect, async (req, res) => {
  try {
    let aff = await Affiliation.findOne({ userId: req.user._id });
    if (!aff) {
      const code = Affiliation.generateCode(req.user.name);
      aff = await Affiliation.create({ userId: req.user._id, code });
    }
    res.json(aff);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// GET /api/affiliation/verify/:code — Verifier un code parrain
router.get('/verify/:code', async (req, res) => {
  try {
    const aff = await Affiliation.findOne({ code: req.params.code.toUpperCase() });
    if (!aff) return res.status(404).json({ message: 'Code parrain invalide' });
    const sponsor = await User.findById(aff.userId).select('name');
    res.json({ valid: true, sponsorName: sponsor?.name || 'Parrain' });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// POST /api/affiliation/claim — Enregistrer un parrainage (lors de l'inscription)
router.post('/claim', protect, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: 'Code requis' });

    const aff = await Affiliation.findOne({ code: code.toUpperCase() });
    if (!aff) return res.status(404).json({ message: 'Code parrain invalide' });
    if (aff.userId.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Vous ne pouvez pas vous parrainer vous-meme' });
    }

    const already = aff.referrals.find(r => r.referredUser?.toString() === req.user._id.toString());
    if (already) return res.status(400).json({ message: 'Deja enregistre' });

    aff.referrals.push({ referredUser: req.user._id, userName: req.user.name });
    await aff.save();

    res.json({ message: 'Parrainage enregistre !' });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

export default router;
