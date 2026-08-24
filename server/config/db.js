/**
 * config/db.js
 * MongoDB connection using Mongoose.
 *
 * Works in TWO environments:
 *  - Local/normal server: connects once at startup.
 *  - Serverless (Vercel): caches the connection on `global` so warm
 *    function invocations reuse it instead of reconnecting every time.
 */
const mongoose = require('mongoose');

// Reuse a global cache across serverless invocations.
const cached = global.__breakfreeMongo || (global.__breakfreeMongo = { conn: null, promise: null });

async function connectDB() {
  // Already connected -> reuse.
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // A connection attempt is already in progress -> wait for it.
  if (!cached.promise) {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/breakfree';
    cached.promise = mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 8000,
        maxPoolSize: 10
      })
      .then((conn) => {
        console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
        return conn;
      })
      .catch((err) => {
        cached.promise = null; // allow retrying on next request
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.conn = null;
    throw err;
  }
  return cached.conn;
}

module.exports = connectDB;