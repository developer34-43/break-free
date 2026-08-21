/**
 * models/Admin.js
 * Admin user for the simple admin dashboard.
 * Passwords are stored ONLY as bcrypt hashes - never in plain text.
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Compare a plain password with the stored bcrypt hash.
adminSchema.methods.verifyPassword = function (password) {
  return bcrypt.compareSync(password, this.passwordHash);
};

module.exports = mongoose.model('Admin', adminSchema);