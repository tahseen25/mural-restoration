/**
 * middleware/upload.js — Multer configuration for image uploads
 */

const multer = require('multer');

const MAX_MB   = Number(process.env.MAX_FILE_SIZE_MB) || 20;
const ALLOWED  = (process.env.ALLOWED_MIME_TYPES || 'image/jpeg,image/png,image/webp')
                   .split(',').map(s => s.trim());

const storage = multer.memoryStorage(); // store in memory → write to MongoDB

const fileFilter = (_req, file, cb) => {
  if (ALLOWED.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: ${ALLOWED.join(', ')}`), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_MB * 1024 * 1024 },
  fileFilter,
});

module.exports = upload;
