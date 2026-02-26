import { Router } from 'express';
import ForumPost from '../models/ForumPost.js';
import { protect } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

// GET /api/forum — Liste des posts
router.get('/', async (req, res) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (category && category !== 'tous') filter.category = category;

    const posts = await ForumPost.find(filter)
      .select('-replies')
      .sort({ isPinned: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const total = await ForumPost.countDocuments(filter);
    res.json({ posts, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// GET /api/forum/:id — Detail d'un post
router.get('/:id', async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post introuvable' });
    post.views += 1;
    await post.save({ validateBeforeSave: false });
    res.json(post);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// POST /api/forum — Creer un post
router.post('/', protect, async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;
    if (!title || !content) return res.status(400).json({ message: 'Titre et contenu requis' });

    const post = await ForumPost.create({
      title, content,
      category: category || 'general',
      tags: tags || [],
      author: req.user._id,
      authorName: req.user.name,
      authorRole: req.user.role,
    });
    res.status(201).json(post);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// POST /api/forum/:id/reply — Repondre
router.post('/:id/reply', protect, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Contenu requis' });

    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post introuvable' });
    if (post.isClosed) return res.status(400).json({ message: 'Discussion fermee' });

    post.replies.push({
      author: req.user._id,
      authorName: req.user.name,
      authorRole: req.user.role,
      content,
    });
    await post.save();
    res.json(post);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// POST /api/forum/:id/like — Liker un post
router.post('/:id/like', protect, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post introuvable' });

    const idx = post.likes.indexOf(req.user._id);
    if (idx > -1) post.likes.splice(idx, 1);
    else post.likes.push(req.user._id);
    await post.save();
    res.json({ likes: post.likes.length, liked: idx === -1 });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// DELETE /api/forum/:id — Supprimer (moderator+)
router.delete('/:id', requireRole('moderator', 'admin'), async (req, res) => {
  try {
    await ForumPost.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post supprime' });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// PUT /api/forum/:id/pin — Epingler (moderator+)
router.put('/:id/pin', requireRole('moderator', 'admin'), async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    post.isPinned = !post.isPinned;
    await post.save();
    res.json(post);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

export default router;
