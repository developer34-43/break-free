/**
 * utils/validate.js
 * Lightweight validation helpers (no external validation library needed).
 */
const { VALID_ADDICTIONS, VALID_GENDERS, VALID_USER_TYPES, DURATIONS } = require('../constants');

const isValidName = (value) =>
  typeof value === 'string' && value.trim().length >= 2 && value.trim().length <= 100;

// Indian mobile numbers: 10 digits starting with 6-9.
// "+91 9876543210", "09876543210" and "9876543210" are all accepted.
const normalizePhone = (value) => {
  if (typeof value !== 'string') return null;
  let phone = value.replace(/[\s\-()]/g, '');
  if (phone.startsWith('+91')) phone = phone.slice(3);
  if (phone.startsWith('91') && phone.length === 12) phone = phone.slice(2);
  if (phone.startsWith('0') && phone.length === 11) phone = phone.slice(1);
  if (!/^[6-9]\d{9}$/.test(phone)) return null;
  return phone;
};

const isValidAge = (value) => {
  const age = Number(value);
  return Number.isInteger(age) && age >= 1 && age <= 120;
};

const isValidGender = (value) => ['male', 'female', 'other', 'prefer-not-to-say'].includes(value);

const isValidUserType = (value) => VALID_USER_TYPES.has(value);

const isValidAddictionCategories = (categories) => {
  if (!Array.isArray(categories) || categories.length === 0) return false;
  return categories.every((c) => VALID_ADDICTIONS.has(c));
};

const isValidDuration = (value) => value === '' || DURATIONS.includes(value);

const isPlainText = (value, maxLength = 1000) =>
  typeof value === 'string' && value.trim().length <= maxLength;

module.exports = {
  isValidName,
  normalizePhone,
  isValidAge,
  isValidGender,
  isValidUserType,
  isValidAddictionCategories,
  isValidDuration,
  isPlainText
};