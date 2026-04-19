/**
 * routes/gallery.js — Community gallery CRUD + engagement
 */

const router = require('express').Router();
const { body, validationResult } = require('express-validator');

const Gallery     = require('../models/Gallery');
const Restoration = require('../models/Restoration');
const { protect, optionalAuth } = require('../middleware/auth');
const logger = require('../utils/logger');

// ── GET /api/gallery — public feed ───────────────────────────
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const page    = Math.max(1, parseInt(req.query.page) || 1);
    const limit   = Math.min(50, parseInt(req.query.limit) || 12);
    const skip    = (page - 1) * limit;
    const { search, style, sort = 'newest' } = req.query;

    const filter = { isPublic: true, deletedAt: null };
    if (style) filter.style = style;
    if (search) filter.$text = { $search: search };

    const sortOpt = {
      newest:  { createdAt: -1 },
      popular: { 'likes': -1, createdAt: -1 },
      views:   { views: -1 },
    }[sort] || { createdAt: -1 };

    const [posts, total] = await Promise.all([
      Gallery.find(filter)
        .populate('userId', 'name avatar')
        .populate({ path: 'restorationId', select: 'predictedStyle detectedDamageTypes metrics' })
        .sort(sortOpt)
        .skip(skip).limit(limit)
        .select('-comments.userId'),     // hide commenter user refs in list view
      Gallery.countDocuments(filter),
    ]);

    // annotate with viewer's like status
    const currentUserId = req.user?._id?.toString();
    const annotated = posts.map(p => {
      const obj = p.toJSON();
      obj.likedByMe = currentUserId
        ? p.likes.some(id => id.toString() === currentUserId)
        : false;
      return obj;
    });

    res.json({ posts: annotated, total, page, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

// ── POST /api/gallery — publish a restoration ─────────────────
router.post('/',
  protect,
  [
    body('restorationId').notEmpty().withMessage('restorationId required'),
    body('title').trim().notEmpty().isLength({ max: 150 }).withMessage('Title required (max 150)'),
    body('description').optional().isLength({ max: 1000 }),
    body('tags').optional().isArray(),
    body('isPublic').optional().isBoolean(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

      const { restorationId, title, description, tags, isPublic = true } = req.body;

      const restoration = await Restoration.findOne({
        _id: restorationId,
        userId: req.user._id,
        status: 'completed',
      });
      if (!restoration) return res.status(404).json({ error: 'Completed restoration not found.' });

      const post = new Gallery({
        userId: req.user._id,
        restorationId,
        title,
        description,
        tags: tags?.map(t => t.toLowerCase().trim()) ?? [],
        style:   restoration.predictedStyle,
        isPublic,
      });
      await post.save();

      // Link back from restoration
      restoration.isPublic   = isPublic;
      restoration.galleryRef = post._id;
      await restoration.save();

      logger.info(`Gallery post created: ${post._id}`);
      res.status(201).json({ post });
    } catch (err) { next(err); }
  }
);

// ── GET /api/gallery/:id ──────────────────────────────────────
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const post = await Gallery.findOne({ _id: req.params.id, deletedAt: null })
      .populate('userId', 'name avatar')
      .populate('comments.userId', 'name avatar')
      .populate({ path: 'restorationId', select: 'predictedStyle detectedDamageTypes metrics mode damageType' });

    if (!post || (!post.isPublic && post.userId._id.toString() !== req.user?._id?.toString())) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    // Increment views
    await Gallery.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    const obj = post.toJSON();
    obj.likedByMe = req.user
      ? post.likes.some(id => id.toString() === req.user._id.toString())
      : false;

    res.json({ post: obj });
  } catch (err) { next(err); }
});

// ── POST /api/gallery/:id/like — toggle like ─────────────────
router.post('/:id/like', protect, async (req, res, next) => {
  try {
    const post = await Gallery.findOne({ _id: req.params.id, isPublic: true, deletedAt: null });
    if (!post) return res.status(404).json({ error: 'Post not found.' });

    const uid = req.user._id;
    const already = post.likes.some(id => id.toString() === uid.toString());

    if (already) {
      post.likes.pull(uid);
    } else {
      post.likes.push(uid);
    }
    await post.save();

    res.json({ liked: !already, likeCount: post.likes.length });
  } catch (err) { next(err); }
});

// ── POST /api/gallery/:id/comments — add comment ─────────────
router.post('/:id/comments', protect,
  [ body('text').trim().notEmpty().isLength({ max: 500 }).withMessage('Comment required (max 500 chars)') ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

      const post = await Gallery.findOne({ _id: req.params.id, isPublic: true, deletedAt: null });
      if (!post) return res.status(404).json({ error: 'Post not found.' });

      post.comments.push({ userId: req.user._id, text: req.body.text });
      await post.save();

      const comment = post.comments[post.comments.length - 1];
      res.status(201).json({ comment });
    } catch (err) { next(err); }
  }
);

// ── DELETE /api/gallery/:id — remove post ────────────────────
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const post = await Gallery.findOne({ _id: req.params.id, userId: req.user._id });
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    post.deletedAt = new Date();
    await post.save();
    res.json({ message: 'Post removed.' });
  } catch (err) { next(err); }
});

// ── PATCH /api/gallery/:id/visibility ────────────────────────
router.patch('/:id/visibility', protect, async (req, res, next) => {
  try {
    const { isPublic } = req.body;
    if (typeof isPublic !== 'boolean') return res.status(400).json({ error: 'isPublic must be boolean.' });

    const post = await Gallery.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, deletedAt: null },
      { isPublic },
      { new: true }
    );
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    res.json({ post: { _id: post._id, isPublic: post.isPublic } });
  } catch (err) { next(err); }
});

module.exports = router;
