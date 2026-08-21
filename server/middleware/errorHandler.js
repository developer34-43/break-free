/**
 * middleware/errorHandler.js
 * Central error handler - every route error ends up here
 * and is returned as a clean JSON response.
 */
function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(`[${new Date().toISOString()}]`, err.message);

  // Mongoose validation errors -> 400
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: Object.values(err.errors).map((e) => e.message)
    });
  }

  // Mongoose duplicate key -> 409
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'A record with this value already exists.'
    });
  }

  // Invalid ObjectId -> 400
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid identifier provided.' });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.expose ? err.message : 'Something went wrong. Please try again.'
  });
}

module.exports = { notFound, errorHandler };