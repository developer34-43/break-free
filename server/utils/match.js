/**
 * utils/match.js
 * The Break Free matching algorithm.
 *
 * A support request is compared with every NGO and a match score
 * (0-100) is calculated using simple, explainable rules:
 *
 *   +30  addiction category match
 *   +20  service match
 *   +15  area match
 *   +10  gender match
 *   +10  budget match
 *   +10  verified organisation
 *   +5   facility type match
 *   ----------
 *   max  100
 *
 * IMPORTANT: This is a preference-comparison tool, NOT a medical
 * recommendation. The wording in the UI must keep that clear.
 */

// Approximate mapping between the user's preferred service
// and the physical type of facility that usually provides it.
const SERVICE_TO_FACILITY = {
  'de-addiction': 'hospital',
  'medical-support': 'hospital',
  counselling: 'clinic',
  outpatient: 'clinic',
  residential: 'rehab-centre',
  rehabilitation: 'rehab-centre',
  'family-counselling': 'clinic',
  awareness: 'ngo-trust',
  other: null
};

/**
 * Calculate the match score between a support request and an NGO.
 * @returns {number} score between 0 and 100
 */
function calculateMatchScore(request, ngo) {
  let score = 0;

  // +30 addiction category overlap
  const selected = request.addictionCategories || [];
  const treated = ngo.addictionTypes || [];
  if (selected.some((cat) => treated.includes(cat))) {
    score += 30;
  } else if (selected.includes('other')) {
    // "Other" is treated softly: an organisation handling a wide range
    // of addictions still gets partial credit.
    if (treated.includes('multiple')) score += 15;
  }

  // +20 service match
  const wantedService = request.preferredService || '';
  if (wantedService && (ngo.services || []).includes(wantedService)) {
    score += 20;
  }

  // +15 area match
  const wantedArea = (request.preferredArea || '').trim();
  if (wantedArea && wantedArea !== 'no-preference' && ngo.area === wantedArea) {
    score += 15;
  }

  // +10 gender match
  const wantedGender = request.preferredGender || '';
  const supported = ngo.genderSupported || ['all'];
  if (wantedGender && wantedGender !== 'not-sure' && supported.includes(wantedGender)) {
    score += 10;
  } else if (wantedGender && wantedGender !== 'not-sure' && supported.includes('all')) {
    score += 10;
  }

  // +10 budget match
  // Note: "Free" and "Low cost" are treated as compatible because government
  // hospitals charge only nominal fees.
  const wantedBudget = request.budgetPreference || '';
  const pricing = ngo.pricingType;
  if (wantedBudget && wantedBudget !== 'no-preference') {
    const affordable =
      wantedBudget === 'low-cost' || wantedBudget === 'free'
        ? pricing === 'low-cost' || pricing === 'free'
        : pricing === wantedBudget;
    if (affordable) score += 10;
  }

  // +10 verified
  if (ngo.verified) score += 10;

  // +5 facility type match (derived from the preferred service)
  const expectedFacility = SERVICE_TO_FACILITY[wantedService];
  if (expectedFacility && ngo.facilityType === expectedFacility) {
    score += 5;
  }

  return Math.min(100, score);
}

/**
 * Compute matches for a support request, returning NGOs sorted by score.
 */
function findMatches(request, allNGOs, limit = 30) {
  const scored = allNGOs.map((ngo) => ({
    matchScore: calculateMatchScore(request, ngo)
  }));

  return allNGOs
    .map((ngo, index) => ({
      ...ngo.toObject(),
      matchScore: scored[index].matchScore
    }))
    .sort((a, b) => b.matchScore - a.matchScore || a.name.localeCompare(b.name))
    .slice(0, limit);
}

module.exports = { calculateMatchScore, findMatches, SERVICE_TO_FACILITY };