/**
 * config/database.js — MongoDB connection with retry logic
 */

const mongoose = require('mongoose');
const logger   = require('../utils/logger');

const connectDB = async () => {
  const MAX_RETRIES = 5;
  let   attempt    = 0;

  while (attempt < MAX_RETRIES) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS:          45000,
      });
      logger.info(`✅  MongoDB connected: ${conn.connection.host}`);

      // Graceful shutdown
      process.on('SIGINT', async () => {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed on app termination');
        process.exit(0);
      });
      return;
    } catch (err) {
      attempt++;
      logger.error(`MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed: ${err.message}`);
      if (attempt < MAX_RETRIES) {
        const delay = attempt * 2000;
        logger.info(`Retrying in ${delay / 1000}s…`);
        await new Promise(r => setTimeout(r, delay));
      } else {
        logger.error('Max retries reached. Exiting.');
        process.exit(1);
      }
    }
  }
};

module.exports = connectDB;
