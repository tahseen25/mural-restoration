/**
 * routes/images.js — Image upload and retrieval
 */

const router = require('express').Router();
const sharp  = require('sharp');

const Image    = require('../models/Image');
const upload   = require('../middleware/upload');
const { protect } = require('../middleware/auth');
const logger   = require('../utils/logger');

// ── POST /api/images/upload ───────────────────────────────────
/**
 * Upload a new mural image.
 * Multipart: field name = "image"
 * Returns image metadata (no raw bytes).
 */
router.post('/upload', protect, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

    const { buffer, mimetype, originalname, size } = req.file;

    // Get dimensions via sharp
    const meta = await sharp(buffer).metadata();

    const image = new Image({
      userId:       req.user._id,
      originalName: originalname,
      mimeType:     mimetype,
      sizeBytes:    size,
      width:        meta.width,
      height:       meta.height,
      originalData: buffer,
      status:       'uploaded',
    });
    await image.save();

    logger.info(`Image uploaded: ${image._id} by user ${req.user._id}`);
    res.status(201).json({ image });
  } catch (err) { next(err); }
});

// ── GET /api/images — list current user's images ──────────────
router.get('/', protect, async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 12);
    const skip  = (page - 1) * limit;

    const [images, total] = await Promise.all([
      Image.find({ userId: req.user._id })
           .select('-originalData')
           .sort({ createdAt: -1 })
           .skip(skip).limit(limit),
      Image.countDocuments({ userId: req.user._id }),
    ]);

    res.json({ images, total, page, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

// ── GET /api/images/:id — get metadata ───────────────────────
router.get('/:id', protect, async (req, res, next) => {
  try {
    const image = await Image.findOne({ _id: req.params.id, userId: req.user._id })
                             .select('-originalData');
    if (!image) return res.status(404).json({ error: 'Image not found.' });
    res.json({ image });
  } catch (err) { next(err); }
});

// ── GET /api/images/:id/file — serve raw image ───────────────
router.get('/:id/file', protect, async (req, res, next) => {
  try {
    const image = await Image.findOne({ _id: req.params.id, userId: req.user._id });
    if (!image || !image.originalData) return res.status(404).json({ error: 'Image data not found.' });

    // Optional resize via ?size=512
    const size = parseInt(req.query.size);
    let data = image.originalData;

    if (size && size > 0 && size < 4096) {
      data = await sharp(image.originalData)
        .resize(size, size, { fit: 'inside', withoutEnlargement: true })
        .toBuffer();
    }

    res.set('Content-Type', image.mimeType);
    res.set('Cache-Control', 'private, max-age=3600');
    res.send(data);
  } catch (err) { next(err); }
});

// ── DELETE /api/images/:id ────────────────────────────────────
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const image = await Image.findOne({ _id: req.params.id, userId: req.user._id });
    if (!image) return res.status(404).json({ error: 'Image not found.' });
    await image.deleteOne();
    logger.info(`Image deleted: ${req.params.id}`);
    res.json({ message: 'Image deleted.' });
  } catch (err) { next(err); }
});

module.exports = router;
