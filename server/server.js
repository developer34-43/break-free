/**
 * server.js
 * Break Free - Express application.
 *
 * Works in TWO environments:
 *  - Local development: `npm start` / `npm run dev` -> starts an HTTP server.
 *  - Vercel (serverless): the app is EXPORTED and invoked per-request by
 *    api/index.js. app.listen() never runs in that case.
 *
 * Serves:
 *   - the single-page public website (public/)
 *   - the admin dashboard (public/admin/)
 *   - the REST API under /api
 */
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { publicLimiter } = require('./middleware/rateLimit');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Behind platforms like Vercel we sit behind a proxy - needed so that
// rate limiting sees the real client IP.
app.set('trust proxy', 1);

// ---------- CORS ----------
// In development we allow any origin; tighten this to your domain in production.
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',') : true,
    credentials: false
  })
);

// ---------- Body parsing ----------
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true }));

// ---------- Static files ----------
// Used in local development. In production Vercel serves these directly
// as static assets (see vercel.json).
app.use(express.static(path.join(__dirname, '..', 'public')));

// ---------- API ----------
app.use('/api', publicLimiter);
app.use('/api/ngos', require('./routes/ngoRoutes'));
app.use('/api/support-requests', require('./routes/supportRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/config', require('./routes/configRoutes'));

// ---------- Health check ----------
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Break Free API is running.', time: new Date().toISOString() });
});

// ---------- Errors ----------
// Every unmatched route and every error returns JSON - never an HTML page.
app.use(notFound);
app.use(errorHandler);

module.exports = app;

// ---------- Local development only ----------
// This block runs ONLY when server.js is executed directly
// (npm start / npm run dev). Vercel imports the module, so this is skipped.
if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  (async () => {
    try {
      await connectDB();
      app.listen(PORT, () => {
        console.log(`Break Free server running at http://localhost:${PORT}`);
        console.log(`Admin panel at http://localhost:${PORT}/admin/admin.html`);
      });
    } catch (err) {
      console.error('Failed to start server:', err.message);
      process.exit(1);
    }
  })();
}