/**
 * models/NGO.js
 * A support organisation / centre / rehabilitation facility in Surat.
 */
const mongoose = require('mongoose');

const ngoSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    shortDescription: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },

    // Location
    address: { type: String, trim: true, default: '' },
    area: { type: String, trim: true, default: 'Not available' },
    city: { type: String, trim: true, default: 'Surat' },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },

    // Contact
    phone: { type: String, trim: true, default: '' },
    alternatePhone: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, default: '' },
    website: { type: String, trim: true, default: '' },

    // What they offer (canonical keys from server/constants.js)
    services: { type: [String], default: [] },
    addictionTypes: { type: [String], default: [] },

    // Who they support
    genderSupported: { type: [String], default: ['all'] },

    facilityType: { type: String, default: 'not-available' },
    pricingType: { type: String, default: 'not-available' },
    timings: { type: String, trim: true, default: 'Not available' },

    // Presentation & provenance
    image: { type: String, default: '' },
    verified: { type: Boolean, default: false },
    source: { type: String, trim: true, default: '' }
  },
  { timestamps: true }
);

ngoSchema.index({ name: 'text', area: 'text', services: 'text', shortDescription: 'text' });

module.exports = mongoose.model('NGO', ngoSchema);