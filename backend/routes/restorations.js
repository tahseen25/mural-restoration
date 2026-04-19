/**
 * routes/restorations.js — Start, poll and download restoration jobs
 */

const router = require('express').Router();
const sharp  = require('sharp');

const Image       = require('../models/Image');
const Restoration = require('../models/Restoration');
const { protect }  = require('../middleware/auth');
const modelService = require('../services/modelService');
const logger       = require('../utils/logger');

// ── POST /api/restorations — start a new job ──────────────────
router.post('/', protect, async (req, res, next) => {
  try {
    const { imageId, damageType = 'auto', mode = 'original' } = req.body;

    if (!imageId) return res.status(400).json({ error: 'imageId is required.' });

    const image = await Image.findOne({ _id: imageId, userId: req.user._id });
    if (!image) return res.status(404).json({ error: 'Image not found.' });

    // Create job record
    const job = new Restoration({
      userId: req.user._id,
      imageId,
      damageType,
      mode,
      status: 'queued',
    });
    await job.save();
    logger.info(`Restoration job created: ${job._id}`);

    // Run inference asynchronously so we can respond immediately
    _runInference(job, image).catch(err =>
      logger.error(`Inference error for job ${job._id}: ${err.message}`)
    );

    res.status(202).json({ job, message: 'Job queued. Poll /api/restorations/:id for status.' });
  } catch (err) { next(err); }
});

// ── Async inference runner ─────────────────────────────────────
async function _runInference(job, image) {
  const t0 = Date.now();
  try {
    await Restoration.findByIdAndUpdate(job._id, { status: 'processing', progress: 5 });

    const result = await modelService.restoreImage(
      image.originalData,
      job.damageType,
      job.mode,
    );

    await Restoration.findByIdAndUpdate(job._id, {
      status:       'completed',
      progress:     100,
      restoredData: result.restoredBuffer,
      maskData:     result.maskBuffer,
      restoredMime: 'image/png',
      predictedStyle:      result.style,
      detectedDamageTypes: result.damageTypes,
      damageScore:         result.metrics?.damageScore ?? null,
      metrics: {
        psnr:  result.metrics?.psnr  ?? null,
        ssim:  result.metrics?.ssim  ?? null,
        lpips: result.metrics?.lpips ?? null,
      },
      processingTimeMs: Date.now() - t0,
    });
    logger.info(`Restoration job ${job._id} completed in ${Date.now()-t0}ms`);
  } catch (err) {
    await Restoration.findByIdAndUpdate(job._id, {
      status: 'failed',
      errorMessage: err.message,
      processingTimeMs: Date.now() - t0,
    });
    logger.error(`Restoration job ${job._id} failed: ${err.message}`);
  }
}

// ── GET /api/restorations — history list ─────────────────────
router.get('/', protect, async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 12);
    const skip  = (page - 1) * limit;

    const filter = { userId: req.user._id, deletedAt: null };

    const [jobs, total] = await Promise.all([
      Restoration.find(filter)
        .select('-restoredData -maskData')
        .populate('imageId', 'originalName width height')
        .sort({ createdAt: -1 })
        .skip(skip).limit(limit),
      Restoration.countDocuments(filter),
    ]);

    res.json({ jobs, total, page, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

// ── GET /api/restorations/:id — single job status ─────────────
router.get('/:id', protect, async (req, res, next) => {
  try {
    const job = await Restoration.findOne({ _id: req.params.id, userId: req.user._id })
      .select('-restoredData -maskData')
      .populate('imageId', 'originalName width height mimeType');
    if (!job) return res.status(404).json({ error: 'Job not found.' });
    res.json({ job });
  } catch (err) { next(err); }
});

// ── GET /api/restorations/:id/restored — download restored image ──
router.get('/:id/restored', protect, async (req, res, next) => {
  try {
    const job = await Restoration.findOne({
      _id: req.params.id, userId: req.user._id, status: 'completed',
    });
    if (!job || !job.restoredData) return res.status(404).json({ error: 'Restored image not available.' });

    let data = job.restoredData;
    const size = parseInt(req.query.size);

    if (size && size > 0 && size < 8192) {
      data = await sharp(job.restoredData)
        .resize(size, size, { fit: 'inside', withoutEnlargement: true })
        .png()
        .toBuffer();
    }

    res.set('Content-Type', job.restoredMime || 'image/png');
    res.set('Cache-Control', 'private, max-age=3600');
    res.set('Content-Disposition', `attachment; filename="restored_${job._id}.png"`);
    res.send(data);
  } catch (err) { next(err); }
});

// ── GET /api/restorations/:id/mask — download damage mask ─────
router.get('/:id/mask', protect, async (req, res, next) => {
  try {
    const job = await Restoration.findOne({
      _id: req.params.id, userId: req.user._id, status: 'completed',
    });
    if (!job || !job.maskData) return res.status(404).json({ error: 'Mask not available.' });
    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'private, max-age=3600');
    res.send(job.maskData);
  } catch (err) { next(err); }
});

// ── DELETE /api/restorations/:id — soft delete ────────────────
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const job = await Restoration.findOne({ _id: req.params.id, userId: req.user._id });
    if (!job) return res.status(404).json({ error: 'Job not found.' });
    job.deletedAt = new Date();
    await job.save();
    res.json({ message: 'Restoration deleted.' });
  } catch (err) { next(err); }
});

module.exports = router;
