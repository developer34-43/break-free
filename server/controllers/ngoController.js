/**
 * controllers/ngoController.js
 * CRUD + search / filter / sort for support organisations.
 */
const NGO = require('../models/NGO');
const {
  VALID_ADDICTIONS,
  VALID_SERVICES,
  VALID_GENDERS,
  VALID_PRICING,
  VALID_FACILITIES
} = require('../constants');

// Fields an admin is allowed to set when creating/updating an NGO.
const NGO_FIELDS = [
  'name',
  'shortDescription',
  'description',
  'address',
  'area',
  'city',
  'latitude',
  'longitude',
  'phone',
  'alternatePhone',
  'email',
  'website',
  'services',
  'addictionTypes',
  'genderSupported',
  'facilityType',
  'pricingType',
  'timings',
  'image',
  'verified',
  'source'
];

function pickNGOFields(body) {
  const data = {};
  NGO_FIELDS.forEach((field) => {
    if (body[field] !== undefined) data[field] = body[field];
  });
  return data;
}

function sanitizeNGOData(data) {
  const clean = { ...data };

  // Only keep keys from the controlled vocabulary. Unknown keys are treated
  // as "other" only when the organisation says so.
  const filterKeys = (value, allowed) => {
    if (!Array.isArray(value)) return [];
    return [...new Set(value)].filter((item) => allowed.has(item));
  };

  clean.addictionTypes = filterKeys(data.addictionTypes, VALID_ADDICTIONS);
  clean.services = filterKeys(data.services, VALID_SERVICES);
  clean.genderSupported = filterKeys(data.genderSupported, VALID_GENDERS);

  if (!VALID_FACILITIES.has(data.facilityType)) clean.facilityType = 'not-available';
  if (!VALID_PRICING.has(data.pricingType)) clean.pricingType = 'not-available';

  ['name', 'address', 'area', 'city', 'phone', 'alternatePhone', 'email', 'website'].forEach(
    (field) => {
      if (typeof clean[field] === 'string') clean[field] = clean[field].trim();
    }
  );

  return clean;
}

function validateNGOName(data) {
  if (!data.name || String(data.name).trim().length < 2) {
    const error = new Error('NGO name is required (at least 2 characters).');
    error.status = 400;
    error.expose = true;
    throw error;
  }
}

function buildFilter(query) {
  const filter = {};

  if (query.addiction && VALID_ADDICTIONS.has(query.addiction)) {
    filter.addictionTypes = query.addiction; // exact match on canonical key
  }

  if (query.area && query.area !== 'all') {
    filter.area = query.area;
  }

  if (query.service && VALID_SERVICES.has(query.service)) {
    filter.services = query.service;
  }

  if (query.gender && VALID_GENDERS.has(query.gender)) {
    filter.genderSupported = query.gender;
  }

  if (query.facility && VALID_FACILITIES.has(query.facility)) {
    filter.facilityType = query.facility;
  }

  if (query.pricing && VALID_PRICING.has(query.pricing)) {
    filter.pricingType = query.pricing;
  }

  if (query.verified === 'true') filter.verified = true;

  if (query.search && String(query.search).trim()) {
    const term = new RegExp(String(query.search).trim(), 'i');
    filter.$or = [{ name: term }, { area: term }, { address: term }, { shortDescription: term }];
  }

  return filter;
}

/**
 * GET /api/ngos
 * Public. Supports search, filters and sorting.
 * Query params: search, addiction, area, service, gender, facility,
 * pricing, verified, sort (best|area|verified|az), limit.
 */
async function listNGOs(req, res, next) {
  try {
    const filter = buildFilter(req.query);
    const sortMap = {
      best: '-verified -matchScore name',
      area: 'area name',
      verified: '-verified name',
      az: 'name'
    };
    const sort = sortMap[req.query.sort] || '-verified name';
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 50);

    const ngos = await NGO.find(filter).sort(sort).limit(limit);

    res.json({
      success: true,
      count: ngos.length,
      ngos
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/ngos/:id
 * Public. Detailed view of one organisation.
 */
async function getNGO(req, res, next) {
  try {
    const ngo = await NGO.findById(req.params.id);
    if (!ngo) {
      return res.status(404).json({ success: false, message: 'Organisation not found.' });
    }
    res.json({ success: true, ngo });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/ngos  (admin only)
 */
async function createNGO(req, res, next) {
  try {
    const data = sanitizeNGOData(pickNGOFields(req.body || {}));
    validateNGOName(data);
    const ngo = await NGO.create(data);
    res.status(201).json({ success: true, message: 'Organisation added successfully.', ngo });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/ngos/:id  (admin only)
 */
async function updateNGO(req, res, next) {
  try {
    const data = sanitizeNGOData(pickNGOFields(req.body || {}));
    if ('name' in data) validateNGOName(data);

    const ngo = await NGO.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true
    });
    if (!ngo) {
      return res.status(404).json({ success: false, message: 'Organisation not found.' });
    }
    res.json({ success: true, message: 'Organisation updated successfully.', ngo });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/ngos/:id  (admin only)
 */
async function deleteNGO(req, res, next) {
  try {
    const ngo = await NGO.findByIdAndDelete(req.params.id);
    if (!ngo) {
      return res.status(404).json({ success: false, message: 'Organisation not found.' });
    }
    res.json({ success: true, message: 'Organisation deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/ngos/:id/verify  (admin only)
 * Quick toggle for the verified badge.
 */
async function toggleVerifyNGO(req, res, next) {
  try {
    const ngo = await NGO.findById(req.params.id);
    if (!ngo) {
      return res.status(404).json({ success: false, message: 'Organisation not found.' });
    }
    ngo.verified = req.body.verified === true;
    await ngo.save();
    res.json({
      success: true,
      message: `Organisation ${ngo.verified ? 'marked as verified' : 'unmarked as verified'}.`,
      ngo
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { listNGOs, getNGO, createNGO, updateNGO, deleteNGO, toggleVerifyNGO };