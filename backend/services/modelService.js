/**
 * services/modelService.js
 * Communicates with the Python inference microservice (see model/server.py).
 * Falls back to a mock response when MODEL_SERVICE_URL is not set.
 */

const axios    = require('axios');
const FormData = require('form-data');
const logger   = require('../utils/logger');

const MODEL_URL = process.env.MODEL_SERVICE_URL || 'http://localhost:8000';
const TIMEOUT   = 120_000; // 2 minutes — model inference can be slow

/**
 * restoreImage
 * @param {Buffer} imageBuffer  — original image bytes
 * @param {string} damageType   — e.g. 'faded', 'cracked', 'auto'
 * @param {string} mode         — 'original' | 'sliding_window'
 * @returns {{ restoredBuffer, maskBuffer, style, damageTypes, metrics }}
 */
const restoreImage = async (imageBuffer, damageType = 'auto', mode = 'original') => {
  // If no model service is configured, return a mock (useful for UI dev)
  if (!process.env.MODEL_SERVICE_URL) {
    logger.warn('MODEL_SERVICE_URL not set — returning mock restoration result');
    return _mockResult(imageBuffer);
  }

  const form = new FormData();
  form.append('image', imageBuffer, { filename: 'input.png', contentType: 'image/png' });
  form.append('damage_type', damageType);
  form.append('mode', mode);

  const response = await axios.post(`${MODEL_URL}/restore`, form, {
    headers: form.getHeaders(),
    timeout: TIMEOUT,
    responseType: 'json',
    maxContentLength: 100 * 1024 * 1024, // 100MB response
  });

  const { restored_b64, mask_b64, style, damage_types, metrics } = response.data;

  return {
    restoredBuffer: Buffer.from(restored_b64, 'base64'),
    maskBuffer:     mask_b64 ? Buffer.from(mask_b64, 'base64') : null,
    style:          style || null,
    damageTypes:    damage_types || [],
    metrics:        metrics || {},
  };
};

/**
 * _mockResult — returns the original image as "restored" (dev mode)
 */
const _mockResult = async (imageBuffer) => {
  await new Promise(r => setTimeout(r, 1500)); // simulate latency
  return {
    restoredBuffer: imageBuffer,
    maskBuffer:     null,
    style:          'warli painting',
    damageTypes:    ['faded'],
    metrics:        { psnr: 28.5, ssim: 0.82, lpips: 0.14 },
  };
};

/**
 * healthCheck — ping the model service
 */
const healthCheck = async () => {
  try {
    const res = await axios.get(`${MODEL_URL}/health`, { timeout: 5000 });
    return res.data;
  } catch (err) {
    return { status: 'unreachable', error: err.message };
  }
};

module.exports = { restoreImage, healthCheck };
