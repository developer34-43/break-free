/**
 * server.js
 * Break Free - Express server entry point.
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
// The public website lives in /public and the admin panel in /public/admin.
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
app.use(notFound);
app.use(errorHandler);

// ---------- Start ----------
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

module.exports = app;