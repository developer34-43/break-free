/**
 * constants.js
 * Shared controlled vocabulary for Break Free.
 * Both the frontend and the backend use the SAME canonical keys,
 * which keeps matching simple and understandable.
 */

// Addiction categories (canonical key -> display label)
const ADDICTION_TYPES = [
  { key: 'smoking', label: 'Cigarette Smoking' },
  { key: 'tobacco', label: 'Tobacco' },
  { key: 'gutkha', label: 'Gutkha' },
  { key: 'pan-masala', label: 'Pan Masala' },
  { key: 'alcohol', label: 'Alcohol' },
  { key: 'cannabis', label: 'Cannabis / Marijuana' },
  { key: 'opioids', label: 'Opioids' },
  { key: 'heroin', label: 'Heroin' },
  { key: 'cocaine', label: 'Cocaine' },
  { key: 'synthetic', label: 'Synthetic Drugs' },
  { key: 'prescription', label: 'Prescription Drug Misuse' },
  { key: 'inhalants', label: 'Inhalants' },
  { key: 'nicotine', label: 'Nicotine Dependence' },
  { key: 'multiple', label: 'Multiple Substance Use' },
  { key: 'other', label: 'Other' }
];

// Service types offered by support centres (canonical key -> label)
const SERVICE_TYPES = [
  { key: 'counselling', label: 'Counselling' },
  { key: 'rehabilitation', label: 'Rehabilitation' },
  { key: 'de-addiction', label: 'De-addiction treatment' },
  { key: 'residential', label: 'Residential / Inpatient' },
  { key: 'outpatient', label: 'Outpatient' },
  { key: 'family-counselling', label: 'Family counselling' },
  { key: 'awareness', label: 'Awareness / Support' },
  { key: 'medical-support', label: 'Medical support' },
  { key: 'other', label: 'Other' }
];

// Genders a centre can support (canonical key -> label)
const GENDER_SUPPORT = [
  { key: 'male', label: 'Male' },
  { key: 'female', label: 'Female' },
  { key: 'all', label: 'All' },
  { key: 'not-sure', label: 'Not sure' }
];

// Pricing types
const PRICING_TYPES = [
  { key: 'free', label: 'Free' },
  { key: 'low-cost', label: 'Low cost' },
  { key: 'paid', label: 'Paid' },
  { key: 'not-available', label: 'Not available' }
];

// Facility types
const FACILITY_TYPES = [
  { key: 'hospital', label: 'Hospital' },
  { key: 'clinic', label: 'Psychiatric Clinic' },
  { key: 'rehab-centre', label: 'Rehabilitation Centre' },
  { key: 'ngo-trust', label: 'NGO / Trust' },
  { key: 'not-available', label: 'Not available' }
];

// User types
const USER_TYPES = [
  { key: 'self', label: 'I need help for myself' },
  { key: 'family', label: 'I am helping a family member' },
  { key: 'friend', label: 'I am helping a friend' },
  { key: 'information', label: 'I am looking for general information' }
];

// Duration options
const DURATIONS = [
  'Less than 1 month',
  '1-6 months',
  '6 months-1 year',
  '1-3 years',
  '3+ years',
  'Prefer not to say'
];

// Common areas of Surat city (used in the preferences dropdown)
const SURAT_AREAS = [
  'Adajan',
  'Athwa',
  'Bhagal',
  'Bhatar',
  'Chowk Bazaar',
  'Delhi Gate',
  'Dumas',
  'Katargam',
  'Magdalla',
  'Majura Gate',
  'Pal',
  'Palsana',
  'Piplod',
  'Rander',
  'Ring Road',
  'Sahara Darwaja',
  'Udhna',
  'Varachha',
  'Vesu'
];

const validKeys = (list) => new Set(list.map((item) => item.key));

const VALID_ADDICTIONS = validKeys(ADDICTION_TYPES);
const VALID_SERVICES = validKeys(SERVICE_TYPES);
const VALID_GENDERS = validKeys(GENDER_SUPPORT);
const VALID_PRICING = validKeys(PRICING_TYPES);
const VALID_FACILITIES = validKeys(FACILITY_TYPES);
const VALID_USER_TYPES = validKeys(USER_TYPES);

module.exports = {
  ADDICTION_TYPES,
  SERVICE_TYPES,
  GENDER_SUPPORT,
  PRICING_TYPES,
  FACILITY_TYPES,
  USER_TYPES,
  DURATIONS,
  SURAT_AREAS,
  VALID_ADDICTIONS,
  VALID_SERVICES,
  VALID_GENDERS,
  VALID_PRICING,
  VALID_FACILITIES,
  VALID_USER_TYPES
};