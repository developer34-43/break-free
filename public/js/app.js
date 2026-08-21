/* ============================================================
   BREAK FREE - app.js
   Frontend logic: config loading, navigation, form validation,
   submission, matching results, filtering and NGO details.
   ============================================================ */
(function () {
  'use strict';

  // ---------- State ----------
  const state = {
    config: null,
    matches: [],        // NGOs returned for the current enquiry
    isAllMode: false,   // true when browsing all centres (no enquiry)
    userArea: '',       // preferred area from the form (for area sorting)
    filters: {
      search: '',
      addiction: '',
      area: '',
      service: '',
      gender: '',
      facility: '',
      pricing: '',
      verified: false,
      sort: 'best'
    }
  };

  // Fallback labels (kept in sync with server/constants.js) in case
  // /api/config cannot be reached.
  const FALLBACK = {
    addictionTypes: [
      { key: 'smoking', label: 'Cigarette Smoking' }, { key: 'tobacco', label: 'Tobacco' },
      { key: 'gutkha', label: 'Gutkha' }, { key: 'pan-masala', label: 'Pan Masala' },
      { key: 'alcohol', label: 'Alcohol' }, { key: 'cannabis', label: 'Cannabis / Marijuana' },
      { key: 'opioids', label: 'Opioids' }, { key: 'heroin', label: 'Heroin' },
      { key: 'cocaine', label: 'Cocaine' }, { key: 'synthetic', label: 'Synthetic Drugs' },
      { key: 'prescription', label: 'Prescription Drug Misuse' }, { key: 'inhalants', label: 'Inhalants' },
      { key: 'nicotine', label: 'Nicotine Dependence' }, { key: 'multiple', label: 'Multiple Substance Use' },
      { key: 'other', label: 'Other' }
    ],
    serviceTypes: [
      { key: 'counselling', label: 'Counselling' }, { key: 'rehabilitation', label: 'Rehabilitation' },
      { key: 'de-addiction', label: 'De-addiction treatment' }, { key: 'residential', label: 'Residential / Inpatient' },
      { key: 'outpatient', label: 'Outpatient' }, { key: 'family-counselling', label: 'Family counselling' },
      { key: 'awareness', label: 'Awareness / Support' }, { key: 'medical-support', label: 'Medical support' },
      { key: 'other', label: 'Other' }
    ],
    facilityTypes: [
      { key: 'hospital', label: 'Hospital' }, { key: 'clinic', label: 'Psychiatric Clinic' },
      { key: 'rehab-centre', label: 'Rehabilitation Centre' }, { key: 'ngo-trust', label: 'NGO / Trust' },
      { key: 'not-available', label: 'Not available' }
    ],
    durations: ['Less than 1 month', '1-6 months', '6 months-1 year', '1-3 years', '3+ years'],
    areas: []
  };

  // ---------- Helpers ----------
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  function labelMap(list) {
    const map = {};
    (list || []).forEach((item) => { map[item.key] = item.label; });
    return map;
  }

  let toastTimer = null;
  function showToast(message, isError) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.toggle('error', Boolean(isError));
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3800);
  }

  function escapeHTML(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function telHref(phone) {
    const digits = String(phone).replace(/[^\d+]/g, '');
    return 'tel:' + digits;
  }

  function waHref(phone) {
    let digits = String(phone).replace(/\D/g, '');
    if (digits.length === 10) digits = '91' + digits;
    return 'https://wa.me/' + digits;
  }

  // WhatsApp only works with mobile numbers (10 digits starting 6-9).
  function isMobileNumber(phone) {
    let digits = String(phone).replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
    if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
    return /^[6-9]\d{9}$/.test(digits);
  }

  function mapsHref(ngo) {
    const query = ngo.address && ngo.address !== '' ? ngo.address : [ngo.name, ngo.city].filter(Boolean).join(', ');
    return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query);
  }

  // ---------- Config ----------
  async function loadConfig() {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      state.config = data.success ? data.config : FALLBACK;
    } catch {
      state.config = FALLBACK;
    }
    buildTypeCards();
    buildCategoryChips();
    // The empty option already means "Prefer not to say", so skip that value.
    const durationValues = (state.config.durations || FALLBACK.durations).filter((d) => d !== 'Prefer not to say');
    populateSelect($('#duration'), [''].concat(durationValues), 'Prefer not to say');
    populateSelect($('#preferredArea'), [''].concat(state.config.areas || []), 'No preference');
    populateSelect(
      $('#preferredService'),
      [''].concat((state.config.serviceTypes || []).map((s) => s.key)),
      'No preference',
      labelMap(state.config.serviceTypes)
    );
    populateFilterSelects();
  }

  function populateSelect(select, values, emptyLabel, labels) {
    if (!select) return;
    select.innerHTML = '';
    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = emptyLabel;
    select.appendChild(empty);
    values.filter(Boolean).forEach((value) => {
      const opt = document.createElement('option');
      opt.value = value;
      opt.textContent = labels ? labels[value] || value : value;
      select.appendChild(opt);
    });
  }

  function populateFilterSelects() {
    const addSel = $('#filterAddiction');
    addSel.innerHTML = '<option value="">All</option>';
    (state.config.addictionTypes || []).forEach((a) => {
      const opt = document.createElement('option');
      opt.value = a.key;
      opt.textContent = a.label;
      addSel.appendChild(opt);
    });

    const areas = [...new Set(['', ...state.config.areas])];
    populateSelect($('#filterArea'), areas, 'All areas');

    const svcSel = $('#filterService');
    svcSel.innerHTML = '<option value="">All services</option>';
    (state.config.serviceTypes || []).forEach((s) => {
      const opt = document.createElement('option');
      opt.value = s.key;
      opt.textContent = s.label;
      svcSel.appendChild(opt);
    });

    const facSel = $('#filterFacility');
    facSel.innerHTML = '<option value="">All facilities</option>';
    (state.config.facilityTypes || [])
      .filter((f) => f.key !== 'not-available')
      .forEach((f) => {
        const opt = document.createElement('option');
        opt.value = f.key;
        opt.textContent = f.label;
        facSel.appendChild(opt);
      });
  }

  // ---------- Awareness section cards ----------
  const TYPE_DESCRIPTIONS = {
    smoking: 'Quitting cigarettes is one of the most rewarding health decisions at any age.',
    tobacco: 'Chewing tobacco harms the mouth and body silently over the years.',
    gutkha: 'A common habit in Gujarat - and a very treatable one with the right support.',
    'pan-masala': 'Regular use can quietly create dependence and health issues.',
    alcohol: 'One of the most common dependencies - counselling and medical support work well.',
    cannabis: 'Regular use affects memory, motivation and mental wellbeing.',
    opioids: 'Dependence on painkillers or opioids needs careful, medically guided help.',
    heroin: 'Recovery is absolutely possible with structured de-addiction treatment.',
    cocaine: 'Stimulant dependence responds well to counselling-based programmes.',
    synthetic: 'Newer substances can be unpredictable - professional guidance matters.',
    prescription: 'Medicines meant to heal can create dependence when misused.',
    inhalants: 'Common among younger people - early support makes a big difference.',
    nicotine: 'Nicotine in any form creates strong habits that can be unlearned.',
    multiple: 'Using more than one substance is common - centres plan for this.',
    other: 'Any habit that feels out of control deserves support. Tell us about it.'
  };

  function typeIcon(key) {
    const icons = {
      smoking: '<path d="M3 14h13v4H3zM18 14h3v4h-3zM7 10a3 3 0 0 1 3-3c1.5 0 2.5-.8 2.5-2"/>',
      tobacco: '<path d="M12 22c5 0 8-3.5 8-8 0-5-4-9-8-12-4 3-8 7-8 12 0 4.5 3 8 8 8z"/>',
      gutkha: '<rect x="5" y="4" width="14" height="16" rx="2"/><path d="M9 9h6M9 13h6"/>',
      'pan-masala': '<path d="M4 15c2-6 8-9 16-9-1 8-6 11-11 11"/><path d="M4 15c3-1 7-1 9 2"/>',
      alcohol: '<path d="M8 21h8M12 15v6M5 3h14l-2 6a5 5 0 0 1-10 0z"/>',
      cannabis: '<path d="M12 22v-8M12 14C7 14 4 11 3 6c5 0 8 2 9 8zM12 14c5 0 8-3 9-8-5 0-8 2-9 8z"/>',
      opioids: '<rect x="3" y="8" width="18" height="8" rx="4"/><circle cx="15" cy="12" r="2.4"/>',
      heroin: '<path d="M12 21s-7-4.6-9.5-8.8C.6 8.6 2.6 5 6 5c2.2 0 3.6 1.2 4.4 2.4L12 9l1.6-1.6C14.4 6.2 15.8 5 18 5c3.4 0 5.4 3.6 3.5 7.2C19 16.4 12 21 12 21z"/>',
      cocaine: '<path d="m12 3 2.5 6H21l-5 4 2 7-6-4.5L6 20l2-7-5-4h6.5z"/>',
      synthetic: '<path d="M13 2 4 14h6l-1 8 9-12h-6z"/>',
      prescription: '<path d="M6 20V4h6a4 4 0 0 1 0 8H6M12 12l6 8"/>',
      inhalants: '<path d="M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11z"/>',
      nicotine: '<path d="M9 3v10M9 13c-3 0-5 2-5 4h10c0-2-2-4-5-4zM15 6v7"/>',
      multiple: '<circle cx="8" cy="8" r="5"/><circle cx="16" cy="16" r="5"/>',
      other: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.3-1 .9-1 1.7M12 17h.01"/>'
    };
    return (
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      (icons[key] || icons.other) +
      '</svg>'
    );
  }

  function buildTypeCards() {
    const wrap = $('#typeCards');
    wrap.innerHTML = '';
    (state.config.addictionTypes || []).forEach((type) => {
      const card = document.createElement('article');
      card.className = 'card type-card reveal';
      card.innerHTML =
        '<div class="icon-chip">' + typeIcon(type.key) + '</div>' +
        '<div><h3>' + escapeHTML(type.label) + '</h3><p>' + escapeHTML(TYPE_DESCRIPTIONS[type.key] || '') + '</p></div>';
      wrap.appendChild(card);
    });
    observeReveals(wrap);
  }

  // ---------- Category chips ----------
  function buildCategoryChips() {
    const wrap = $('#categoryChips');
    wrap.innerHTML = '';
    (state.config.addictionTypes || []).forEach((type) => {
      const label = document.createElement('label');
      label.className = 'chip';
      label.innerHTML =
        '<input type="checkbox" name="addictionCategories" value="' + type.key + '" />' +
        '<span>' + escapeHTML(type.label) + '</span>';
      wrap.appendChild(label);
    });

    wrap.addEventListener('change', () => {
      const checked = $$('input[name="addictionCategories"]:checked').map((i) => i.value);
      $('#otherAddictionWrap').classList.toggle('show', checked.includes('other'));
      setFieldValid('addictionCategories', checked.length > 0);
    });
  }

  // ---------- Navigation ----------
  function initNav() {
    const toggle = $('#navToggle');
    const links = $('#navLinks');

    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });

    links.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });

    // Highlight active section link while scrolling.
    const sections = ['home', 'about', 'types', 'how', 'results'];
    const navAnchors = $$('#navLinks a[href^="#"]');
    window.addEventListener(
      'scroll',
      () => {
        let current = 'home';
        sections.forEach((id) => {
          const el = document.getElementById(id);
          if (el && window.scrollY >= el.offsetTop - 120) current = id;
        });
        navAnchors.forEach((a) => {
          a.classList.toggle('active', a.getAttribute('href') === '#' + current);
        });
      },
      { passive: true }
    );
  }

  // ---------- Reveal on scroll ----------
  let revealObserver = null;
  function observeReveals(root) {
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12 }
      );
    }
    (root || document).querySelectorAll('.reveal:not(.visible)').forEach((el) => revealObserver.observe(el));
  }

  // ---------- Form validation ----------
  function setFieldInvalid(name, message) {
    const field = document.querySelector('[data-field="' + name + '"]');
    if (!field) return;
    field.classList.add('invalid');
    const err = field.querySelector('[data-error]');
    if (err && message) err.textContent = message;
  }

  function setFieldValid(name, isValid) {
    const field = document.querySelector('[data-field="' + name + '"]');
    if (!field) return;
    field.classList.toggle('invalid', !isValid);
  }

  function validateForm() {
    let ok = true;

    const name = $('#name').value.trim();
    setFieldValid('name', name.length >= 2);
    if (name.length < 2) ok = false;

    let phone = $('#phone').value.replace(/[\s\-()]/g, '');
    if (phone.startsWith('+91')) phone = phone.slice(3);
    if (phone.startsWith('91') && phone.length === 12) phone = phone.slice(2);
    if (phone.startsWith('0') && phone.length === 11) phone = phone.slice(1);
    const phoneOk = /^[6-9]\d{9}$/.test(phone);
    setFieldValid('phone', phoneOk);
    if (!phoneOk) ok = false;

    const age = Number($('#age').value);
    const ageOk = Number.isInteger(age) && age >= 1 && age <= 120;
    setFieldValid('age', ageOk);
    if (!ageOk) ok = false;

    const genderOk = $('#gender').value !== '';
    setFieldValid('gender', genderOk);
    if (!genderOk) ok = false;

    const userTypeOk = !!$('input[name="userType"]:checked');
    setFieldValid('userType', userTypeOk);
    if (!userTypeOk) ok = false;

    const categories = $$('input[name="addictionCategories"]:checked').map((i) => i.value);
    const catOk = categories.length > 0;
    setFieldValid('addictionCategories', catOk);
    if (!catOk) ok = false;

    if (catOk && categories.includes('other') && !$('#otherAddiction').value.trim()) {
      setFieldInvalid('addictionCategories', 'Please describe the "Other" addiction type.');
      ok = false;
    }

    const privacyOk = $('#privacyConsent').checked;
    setFieldValid('privacyConsent', privacyOk);
    if (!privacyOk) ok = false;

    return ok;
  }

  function clearValidationStyles() {
    $$('.field.invalid').forEach((f) => f.classList.remove('invalid'));
  }

  // Radio card visual selection
  document.addEventListener('change', (e) => {
    if (e.target.name === 'userType') {
      $$('.radio-card').forEach((c) => c.classList.remove('selected'));
      e.target.closest('.radio-card').classList.add('selected');
      setFieldValid('userType', true);
    }
    if (e.target.id === 'privacyConsent') setFieldValid('privacyConsent', e.target.checked);
  });

  // ---------- Form submission ----------
  async function submitForm(event) {
    event.preventDefault();
    const status = $('#formStatus');
    status.textContent = '';
    status.className = 'form-status';

    if (!validateForm()) {
      status.textContent = 'Please fix the highlighted fields.';
      status.classList.add('error');
      const firstInvalid = $('.field.invalid');
      if (firstInvalid) firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const btn = $('#submitBtn');
    const label = $('#submitLabel');
    btn.disabled = true;
    btn.classList.add('loading');
    label.textContent = 'Finding...';

    const payload = {
      name: $('#name').value.trim(),
      phone: $('#phone').value,
      age: Number($('#age').value),
      gender: $('#gender').value,
      userType: $('input[name="userType"]:checked').value,
      addictionCategories: $$('input[name="addictionCategories"]:checked').map((i) => i.value),
      otherAddiction: $('#otherAddiction').value.trim(),
      duration: $('#duration').value,
      currentSituation: $('#currentSituation').value.trim(),
      preferredArea: $('#preferredArea').value,
      preferredService: $('#preferredService').value,
      preferredGender: $('#preferredGender').value,
      budgetPreference: $('#budgetPreference').value,
      message: $('#message').value.trim(),
      privacyConsent: $('#privacyConsent').checked
    };

    try {
      const res = await fetch('/api/support-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        const msg = data.errors && data.errors.length ? data.errors[0] : data.message || 'Something went wrong. Please try again.';
        throw new Error(msg);
      }

      state.matches = data.matches || [];
      state.isAllMode = false;
      state.userArea = payload.preferredArea;
      resetFilterControls();

      showResults();
      renderResults();

      status.textContent = 'Enquiry saved securely. ' + (data.matchCount || 0) + ' option(s) found below.';
      status.classList.add('ok');
    } catch (err) {
      status.textContent = err.message || 'Something went wrong. Please try again.';
      status.classList.add('error');
      showToast(err.message || 'Something went wrong. Please try again.', true);
    } finally {
      btn.disabled = false;
      btn.classList.remove('loading');
      label.textContent = 'Find Support';
    }
  }

  // ---------- Results rendering ----------
  function showResults() {
    const section = $('#results');
    section.classList.add('show');
    $('#resultsState').hidden = false;
    $('#loadingBox').style.display = 'block';
    $('#resultsContent').hidden = true;
    section.scrollIntoView({ behavior: 'smooth' });

    // Brief loading state so the user sees the "finding" feedback.
    setTimeout(() => {
      $('#loadingBox').style.display = 'none';
      $('#resultsState').hidden = true;
      $('#resultsContent').hidden = false;
    }, 700);
  }

  function applyFilters() {
    const f = state.filters;
    const search = f.search.trim().toLowerCase();

    let list = state.matches.filter((ngo) => {
      if (search) {
        const hay = [ngo.name, ngo.area, ngo.shortDescription, (ngo.services || []).join(' ')].join(' ').toLowerCase();
        if (!hay.includes(search)) return false;
      }
      if (f.addiction && !(ngo.addictionTypes || []).includes(f.addiction)) return false;
      if (f.area && ngo.area !== f.area) return false;
      if (f.service && !(ngo.services || []).includes(f.service)) return false;
      if (f.gender && !(ngo.genderSupported || []).includes(f.gender)) return false;
      if (f.facility && ngo.facilityType !== f.facility) return false;
      if (f.pricing && ngo.pricingType !== f.pricing) return false;
      if (f.verified && !ngo.verified) return false;
      return true;
    });

    list.sort((a, b) => {
      switch (f.sort) {
        case 'az':
          return a.name.localeCompare(b.name);
        case 'verified':
          return (b.verified === true) - (a.verified === true) || a.name.localeCompare(b.name);
        case 'area': {
          const aMatch = state.userArea && a.area === state.userArea ? 1 : 0;
          const bMatch = state.userArea && b.area === state.userArea ? 1 : 0;
          return bMatch - aMatch || a.name.localeCompare(b.name);
        }
        default:
          return (b.matchScore || 0) - (a.matchScore || 0) || a.name.localeCompare(b.name);
      }
    });
    return list;
  }

  function matchLabel(score) {
    if (score >= 80) return 'Strong Match';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Possible Match';
    return 'General Option';
  }

  function renderResults() {
    const grid = $('#ngoGrid');
    const countEl = $('#resultsCount');
    const noExact = $('#noExactBanner');
    const allMode = $('#allModeBanner');

    allMode.hidden = !state.isAllMode;
    const best = state.matches.reduce((max, n) => Math.max(max, n.matchScore || 0), 0);
    noExact.hidden = state.isAllMode || best >= 40 || state.matches.length === 0;

    const list = applyFilters();
    countEl.textContent = list.length + (list.length === 1 ? ' support option found' : ' support options found');

    grid.innerHTML = '';
    if (list.length === 0) {
      $('#emptyBox').hidden = false;
      return;
    }
    $('#emptyBox').hidden = true;

    const maps = {
      addiction: labelMap(state.config.addictionTypes),
      service: labelMap(state.config.serviceTypes),
      facility: labelMap(state.config.facilityTypes),
      pricing: { free: 'Free', 'low-cost': 'Low cost', paid: 'Paid', 'not-available': '' }
    };

    list.forEach((ngo) => {
      const card = document.createElement('article');
      card.className = 'ngo-card';

      const badges = [];
      if (ngo.verified) badges.push('<span class="badge badge-verified">&#10003; Verified</span>');
      if (maps.pricing[ngo.pricingType]) badges.push('<span class="badge">' + escapeHTML(maps.pricing[ngo.pricingType]) + '</span>');
      if (maps.facility[ngo.facilityType]) badges.push('<span class="badge">' + escapeHTML(maps.facility[ngo.facilityType]) + '</span>');

      const services = (ngo.services || [])
        .slice(0, 4)
        .map((s) => '<span class="tag">' + escapeHTML(maps.service[s] || s) + '</span>')
        .join('');
      const addictions = (ngo.addictionTypes || [])
        .slice(0, 5)
        .map((a) => '<span class="tag">' + escapeHTML(maps.addiction[a] || a) + '</span>')
        .join('');

      const actions = [];
      actions.push('<button type="button" class="action-btn primary" data-action="details" data-id="' + ngo._id + '">View Details</button>');
      if (ngo.phone) actions.push('<a class="action-btn" href="' + telHref(ngo.phone) + '">Call</a>');
      if (ngo.phone && isMobileNumber(ngo.phone)) actions.push('<a class="action-btn" target="_blank" rel="noopener" href="' + waHref(ngo.phone) + '">WhatsApp</a>');
      actions.push('<a class="action-btn" target="_blank" rel="noopener" href="' + mapsHref(ngo) + '">Directions</a>');
      if (ngo.website) actions.push('<a class="action-btn" target="_blank" rel="noopener" href="' + escapeHTML(ngo.website) + '">Website</a>');

      const scoreBlock = state.isAllMode
        ? ''
        : '<div class="match-pill"><strong>' + (ngo.matchScore || 0) + '%</strong><span>' + matchLabel(ngo.matchScore || 0) + '</span></div>';

      card.innerHTML =
        '<div class="ngo-head"><div>' +
        '<h3 class="ngo-name">' + escapeHTML(ngo.name) + '</h3>' +
        '<div class="ngo-area"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>' +
        escapeHTML(ngo.area || 'Surat') + ', Surat</div></div>' + scoreBlock + '</div>' +
        '<div class="badge-row">' + badges.join('') + '</div>' +
        '<p class="ngo-desc">' + escapeHTML(ngo.shortDescription || '') + '</p>' +
        (services ? '<div class="tag-list"><span class="tag-label">Services:</span>' + services + '</div>' : '') +
        (addictions ? '<div class="tag-list"><span class="tag-label">Supports:</span>' + addictions + '</div>' : '') +
        '<div class="ngo-actions">' + actions.join('') + '</div>';

      grid.appendChild(card);
    });
  }

  // ---------- Filters wiring ----------
  function resetFilterControls() {
    $('#filterSearch').value = '';
    $('#filterAddiction').value = '';
    $('#filterArea').value = '';
    $('#filterService').value = '';
    $('#filterGender').value = '';
    $('#filterFacility').value = '';
    $('#filterPricing').value = '';
    $('#filterVerified').checked = false;
    $('#filterSort').value = 'best';
    state.filters = { search: '', addiction: '', area: '', service: '', gender: '', facility: '', pricing: '', verified: false, sort: 'best' };
  }

  function initFilters() {
    const bind = (id, key, event) => {
      $(id).addEventListener(event || 'change', (e) => {
        state.filters[key] = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        renderResults();
      });
    };
    bind('#filterSearch', 'search', 'input');
    bind('#filterAddiction', 'addiction');
    bind('#filterArea', 'area');
    bind('#filterService', 'service');
    bind('#filterGender', 'gender');
    bind('#filterFacility', 'facility');
    bind('#filterPricing', 'pricing');
    bind('#filterVerified', 'verified');
    bind('#filterSort', 'sort');

    $('#resetFilters').addEventListener('click', () => {
      resetFilterControls();
      renderResults();
    });
  }

  // ---------- Explore all centres ----------
  async function exploreAll() {
    try {
      const res = await fetch('/api/ngos?sort=verified');
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      state.matches = (data.ngos || []).map((n) => Object.assign(n, { matchScore: 0 }));
      state.isAllMode = true;
      state.userArea = '';
      resetFilterControls();
      showResults();
      renderResults();
    } catch (err) {
      showToast(err.message || 'Could not load support centres. Is the server running?', true);
    }
  }

  // "Find Support" links should load the directory if results aren't shown yet.
  function initResultsLinks() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href="#results"]');
      if (!link) return;
      if (!$('#results').classList.contains('show')) {
        e.preventDefault();
        exploreAll();
      }
    });
  }

  // ---------- Modal ----------
  function openModal(ngo) {
    const maps = {
      addiction: labelMap(state.config.addictionTypes),
      service: labelMap(state.config.serviceTypes),
      facility: labelMap(state.config.facilityTypes)
    };
    const pricingLabels = { free: 'Free', 'low-cost': 'Low cost', paid: 'Paid', 'not-available': 'Not available' };
    const genderLabels = { male: 'Male', female: 'Female', all: 'All genders', 'not-sure': 'Not sure' };

    const item = (labelText, valueText) =>
      '<div class="detail-item"><div class="label">' + labelText + '</div><div class="value">' + (valueText || 'Not available') + '</div></div>';

    const services = (ngo.services || []).map((s) => maps.service[s] || s).join(', ');
    const addictions = (ngo.addictionTypes || []).map((a) => maps.addiction[a] || a).join(', ');
    const genders = (ngo.genderSupported || []).map((g) => genderLabels[g] || g).join(', ');

    const actions = [];
    if (ngo.phone) actions.push('<a class="btn btn-primary btn-sm" href="' + telHref(ngo.phone) + '">Call: ' + escapeHTML(ngo.phone) + '</a>');
    if (ngo.phone && isMobileNumber(ngo.phone)) actions.push('<a class="btn btn-outline btn-sm" target="_blank" rel="noopener" href="' + waHref(ngo.phone) + '">WhatsApp</a>');
    actions.push('<a class="btn btn-outline btn-sm" target="_blank" rel="noopener" href="' + mapsHref(ngo) + '">Directions</a>');
    if (ngo.email) actions.push('<a class="btn btn-outline btn-sm" href="mailto:' + escapeHTML(ngo.email) + '">Email</a>');
    if (ngo.website) actions.push('<a class="btn btn-outline btn-sm" target="_blank" rel="noopener" href="' + escapeHTML(ngo.website) + '">Website</a>');

    $('#modalBody').innerHTML =
      '<h2 id="modalTitle" style="padding-right:36px">' + escapeHTML(ngo.name) + '</h2>' +
      '<div class="badge-row" style="margin-bottom:14px">' +
      (ngo.verified ? '<span class="badge badge-verified">&#10003; Verified listing</span>' : '') +
      '<span class="badge">' + escapeHTML(pricingLabels[ngo.pricingType] || 'Not available') + '</span>' +
      (maps.facility[ngo.facilityType] ? '<span class="badge">' + escapeHTML(maps.facility[ngo.facilityType]) + '</span>' : '') +
      '</div>' +
      '<p style="color:var(--muted)">' + escapeHTML(ngo.description || ngo.shortDescription || '') + '</p>' +
      '<div class="detail-grid">' +
      item('Address', escapeHTML(ngo.address)) +
      item('Area', escapeHTML(ngo.area) + ', ' + escapeHTML(ngo.city || 'Surat')) +
      item('Phone', ngo.alternatePhone ? escapeHTML(ngo.phone) + ' / ' + escapeHTML(ngo.alternatePhone) : escapeHTML(ngo.phone)) +
      item('Email', ngo.email ? '<a href="mailto:' + escapeHTML(ngo.email) + '">' + escapeHTML(ngo.email) + '</a>' : '') +
      item('Timings', escapeHTML(ngo.timings)) +
      item('Gender support', escapeHTML(genders)) +
      item('Services', escapeHTML(services)) +
      item('Addictions supported', escapeHTML(addictions)) +
      '</div>' +
      (ngo.source
        ? '<p class="source-link">Source: <a href="' + escapeHTML(ngo.source.match(/https?:\/\/\S+/) ? ngo.source.split(' ')[0] : '#') + '" target="_blank" rel="noopener">' + escapeHTML(ngo.source) + '</a></p>'
        : '') +
      '<div class="modal-actions">' + actions.join('') + '</div>' +
      '<p style="font-size:0.82rem;color:var(--muted);margin-top:18px">Contact details are collected from public sources. Please verify details with the organisation before visiting.</p>';

    $('#ngoModal').classList.add('open');
    document.body.style.overflow = 'hidden';
    $('#modalClose').focus();
  }

  function closeModal() {
    $('#ngoModal').classList.remove('open');
    document.body.style.overflow = '';
  }

  function initModal() {
    $('#modalClose').addEventListener('click', closeModal);
    $('#ngoModal').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });

    // Delegate clicks for "View Details"
    $('#ngoGrid').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action="details"]');
      if (!btn) return;
      const ngo = state.matches.find((n) => n._id === btn.dataset.id);
      if (ngo) openModal(ngo);
    });
  }

  // ---------- Init ----------
  async function init() {
    initNav();
    observeReveals(document);
    initFilters();
    initModal();
    initResultsLinks();
    $('#supportForm').addEventListener('submit', submitForm);
    $('#exploreBtn').addEventListener('click', exploreAll);
    await loadConfig();
  }

  document.addEventListener('DOMContentLoaded', init);
})();