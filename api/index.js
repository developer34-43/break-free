/**
 * api/index.js
 * Vercel serverless entry point.
 *
 * Vercel routes every /api/* request (see vercel.json) to this function.
 * It ensures the MongoDB connection is ready (reusing a cached connection
 * on warm invocations) and then hands the request to the Express app.
 *
 * The Express app itself lives in server/server.js and is exported -
 * nothing about the application logic changes between local and production.
 */
const app = require('../server/server');
const connectDB = require('../server/config/db');

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    res.status(503).json({
      success: false,
      message: 'Database temporarily unavailable. Please try again in a moment.'
    });
    return;
  }

  return app(req, res);
};