/**
 * models/SupportRequest.js
 * A confidential support enquiry submitted through the Get Support form.
 * Only administrators can view these records.
 */
const mongoose = require('mongoose');

const supportRequestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 1, max: 120 },
    gender: { type: String, required: true },

    userType: { type: String, required: true },

    addictionCategories: { type: [String], required: true },
    otherAddiction: { type: String, trim: true, default: '' },
    duration: { type: String, default: '' },
    currentSituation: { type: String, trim: true, maxlength: 1000 },

    preferredArea: { type: String, default: '' },
    preferredService: { type: String, default: '' },
    preferredGender: { type: String, default: '' },
    budgetPreference: { type: String, default: '' },

    message: { type: String, trim: true, maxlength: 1000 },

    privacyConsent: { type: Boolean, default: false },

    // The NGO the user showed interest in via "View Details" (optional)
    selectedNGO: { type: mongoose.Schema.Types.ObjectId, ref: 'NGO', default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('SupportRequest', supportRequestSchema);