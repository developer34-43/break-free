/**
 * routes/configRoutes.js
 * Serves the shared controlled vocabulary to the frontend so the
 * form options always stay in sync with the backend validation.
 */
const express = require('express');
const router = express.Router();
const constants = require('../constants');

router.get('/', (req, res) => {
  res.json({
    success: true,
    config: {
      addictionTypes: constants.ADDICTION_TYPES,
      serviceTypes: constants.SERVICE_TYPES,
      genderSupport: constants.GENDER_SUPPORT,
      pricingTypes: constants.PRICING_TYPES,
      facilityTypes: constants.FACILITY_TYPES,
      userTypes: constants.USER_TYPES,
      durations: constants.DURATIONS,
      areas: constants.SURAT_AREAS
    }
  });
});

module.exports = router;