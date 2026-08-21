/**
 * controllers/supportController.js
 * Handles the confidential support enquiry form.
 */
const SupportRequest = require('../models/SupportRequest');
const NGO = require('../models/NGO');
const { findMatches } = require('../utils/match');
const {
  isValidName,
  normalizePhone,
  isValidAge,
  isValidGender,
  isValidUserType,
  isValidAddictionCategories,
  isValidDuration,
  isPlainText
} = require('../utils/validate');

/**
 * POST /api/support-requests
 * Validate -> save the enquiry -> calculate NGO matches -> respond.
 */
async function createSupportRequest(req, res, next) {
  try {
    const body = req.body || {};
    const errors = [];

    // ---------- Validation ----------
    if (!isValidName(body.name)) errors.push('Please enter your full name (2-100 characters).');

    const phone = normalizePhone(body.phone);
    if (!phone) errors.push('Please enter a valid 10-digit Indian mobile number (starting with 6-9).');

    if (!isValidAge(body.age)) errors.push('Please enter a valid age (1-120).');

    if (!isValidGender(body.gender)) errors.push('Please select a gender.');

    if (!isValidUserType(body.userType)) errors.push('Please select who you need help for.');

    if (!isValidAddictionCategories(body.addictionCategories)) {
      errors.push('Please select at least one addiction category.');
    }

    if (!isValidDuration(body.duration || '')) errors.push('Please select a valid duration.');

    if (!isPlainText(body.otherAddiction || '', 200)) errors.push('Other addiction text is too long.');
    if (!isPlainText(body.currentSituation || '', 1000)) errors.push('Current situation text is too long.');
    if (!isPlainText(body.message || '', 1000)) errors.push('Message text is too long.');

    if (body.privacyConsent !== true) {
      errors.push('Please accept the privacy consent before submitting.');
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Please fix the highlighted issues.', errors });
    }

    // "Other" selected but no description -> ask for it (soft validation).
    if (body.addictionCategories.includes('other') && !String(body.otherAddiction || '').trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please describe the "Other" addiction type.',
        errors: ['Please describe the "Other" addiction type.']
      });
    }

    // ---------- Save enquiry ----------
    const request = await SupportRequest.create({
      name: String(body.name).trim(),
      phone,
      age: Number(body.age),
      gender: body.gender,
      userType: body.userType,
      addictionCategories: [...new Set(body.addictionCategories)],
      otherAddiction: String(body.otherAddiction || '').trim(),
      duration: body.duration || '',
      currentSituation: String(body.currentSituation || '').trim(),
      preferredArea: String(body.preferredArea || '').trim(),
      preferredService: body.preferredService || '',
      preferredGender: body.preferredGender || '',
      budgetPreference: body.budgetPreference || '',
      message: String(body.message || '').trim(),
      privacyConsent: true
    });

    // ---------- Matching ----------
    const allNGOs = await NGO.find({});
    const matches = findMatches(request, allNGOs);

    // We only return public, non-sensitive NGO data to the user.
    const safeMatches = matches.map(({ matchScore, ...ngo }) => ({
      ...ngo,
      matchScore
    }));

    return res.status(201).json({
      success: true,
      message:
        safeMatches.length > 0
          ? 'Support options found'
          : 'No exact matches found. Here are other support options in Surat.',
      requestId: request._id,
      matchCount: safeMatches.length,
      matches: safeMatches
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/support-requests
 * Admin only. Returns recent enquiries (newest first), never publicly.
 * Sensitive data (phone, situation details) is visible to admins only - this
 * endpoint requires a valid admin token.
 */
async function listSupportRequests(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, parseInt(req.query.limit, 10) || 15);

    const [total, requests] = await Promise.all([
      SupportRequest.countDocuments(),
      SupportRequest.find()
        .populate({ path: 'selectedNGO', select: 'name area' })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
    ]);

    res.json({
      success: true,
      total,
      page,
      limit,
      requests
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/support-requests/:id
 * Admin only. Returns one enquiry.
 */
async function getSupportRequest(req, res, next) {
  try {
    const request = await SupportRequest.findById(req.params.id).populate({
      path: 'selectedNGO',
      select: 'name area'
    });
    if (!request) {
      return res.status(404).json({ success: false, message: 'Support request not found.' });
    }
    res.json({ success: true, request });
  } catch (err) {
    next(err);
  }
}

module.exports = { createSupportRequest, listSupportRequests, getSupportRequest };