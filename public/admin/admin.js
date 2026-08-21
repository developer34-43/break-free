/* ============================================================
   BREAK FREE - admin.js
   Admin dashboard logic: login, stats, enquiries, NGO CRUD.
   ============================================================ */
(function () {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const TOKEN_KEY = 'breakfree_admin_token';
  let config = null;
  let ngosCache = [];

  // ---------- Helpers ----------
  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || '';
  }

  function setToken(token) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }

  async function api(path, options) {
    options = options || {};
    const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
    const token = getToken();
    if (token) headers.Authorization = 'Bearer ' + token;

    const res = await fetch(path, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    let data = {};
    try {
      data = await res.json();
    } catch {
      /* non-JSON response */
    }

    if (res.status === 401 && getToken()) {
      setToken('');
      showLogin();
      throw new Error('Session expired. Please login again.');
    }
    if (!res.ok || data.success === false) {
      throw new Error(data.message || 'Request failed (' + res.status + ')');
    }
    return data;
  }

  let toastTimer = null;
  function showToast(message, isError) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.toggle('error', Boolean(isError));
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
  }

  function escapeHTML(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function fmtDate(iso) {
    try {
      return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return iso;
    }
  }

  function labelOf(list, key) {
    const found = (list || []).find((item) => item.key === key);
    return found ? found.label : key;
  }

  // ---------- Views ----------
  function showLogin() {
    $('#loginView').style.display = 'flex';
    $('#dashView').hidden = true;
  }

  function showDashboard() {
    $('#loginView').style.display = 'none';
    $('#dashView').hidden = false;
    refreshAll();
  }

  // ---------- Data loading ----------
  async function refreshAll() {
    try {
      const [statsRes, ngosRes] = await Promise.all([api('/api/admin/stats'), api('/api/ngos?limit=100')]);
      renderStats(statsRes.stats);
      ngosCache = ngosRes.ngos || [];
      renderNGOs();
      await loadRequests();
    } catch (err) {
      showToast(err.message, true);
    }
  }

  function renderStats(stats) {
    $('#statRequests').textContent = stats.totalRequests;
    $('#statNgos').textContent = stats.totalNGOs;
    $('#statVerified').textContent = stats.verifiedNGOs;
  }

  async function loadRequests() {
    try {
      const data = await api('/api/support-requests?limit=50');
      const body = $('#requestsBody');
      $('#reqCount').textContent = data.total;

      if (!data.requests.length) {
        body.innerHTML = '<tr class="empty-row"><td colspan="8">No support requests yet.</td></tr>';
        return;
      }

      body.innerHTML = '';
      data.requests.forEach((r) => {
        const tr = document.createElement('tr');
        tr.innerHTML =
          '<td>' + escapeHTML(fmtDate(r.createdAt)) + '</td>' +
          '<td><strong>' + escapeHTML(r.name) + '</strong></td>' +
          '<td>' + escapeHTML(r.phone) + '</td>' +
          '<td>' + r.age + ' / ' + escapeHTML(r.gender) + '</td>' +
          '<td>' + escapeHTML(labelOf(config.userTypes, r.userType)) + '</td>' +
          '<td>' + (r.addictionCategories || []).map((c) => '<span class="tag">' + escapeHTML(labelOf(config.addictionTypes, c)) + '</span>').join('') + '</td>' +
          '<td>' + escapeHTML(r.preferredArea || '-') + '</td>' +
          '<td><button type="button" class="btn btn-outline btn-sm" data-req="' + r._id + '">View</button></td>';
        body.appendChild(tr);
      });
    } catch (err) {
      showToast(err.message, true);
    }
  }

  function renderNGOs() {
    const body = $('#ngosBody');
    $('#ngoCount').textContent = ngosCache.length;

    if (!ngosCache.length) {
      body.innerHTML = '<tr class="empty-row"><td colspan="6">No support centres yet. Add one to get started.</td></tr>';
      return;
    }

    body.innerHTML = '';
    ngosCache.forEach((n) => {
      const tr = document.createElement('tr');
      tr.innerHTML =
        '<td><strong>' + escapeHTML(n.name) + '</strong></td>' +
        '<td>' + escapeHTML(n.area || '-') + '</td>' +
        '<td>' + escapeHTML(n.phone || '-') + '</td>' +
        '<td>' + escapeHTML(labelOf(config.pricingTypes, n.pricingType)) + '</td>' +
        '<td>' + (n.verified ? '<span class="badge-on">&#10003; Verified</span>' : '<span class="badge-off">Unverified</span>') + '</td>' +
        '<td><div class="cell-actions">' +
        '<button type="button" class="btn btn-ghost btn-sm" data-verify="' + n._id + '">' + (n.verified ? 'Unverify' : 'Verify') + '</button>' +
        '<button type="button" class="btn btn-outline btn-sm" data-edit="' + n._id + '">Edit</button>' +
        '<button type="button" class="btn btn-danger btn-sm" data-delete="' + n._id + '">Delete</button>' +
        '</div></td>';
      body.appendChild(tr);
    });
  }

  // ---------- Login ----------
  $('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = $('#loginError');
    errEl.classList.remove('show');

    const btn = $('#loginBtn');
    btn.disabled = true;
    btn.textContent = 'Signing in...';

    try {
      const data = await api('/api/admin/login', {
        method: 'POST',
        body: { username: $('#username').value.trim(), password: $('#password').value }
      });
      setToken(data.token);
      $('#password').value = '';
      showDashboard();
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.add('show');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Login';
    }
  });

  $('#logoutBtn').addEventListener('click', () => {
    setToken('');
    showLogin();
  });

  // ---------- Tabs ----------
  $$('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      $$('.tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      $$('.tab-panel').forEach((p) => (p.hidden = true));
      $('#tab-' + tab.dataset.tab).hidden = false;
    });
  });

  // ---------- Requests detail modal ----------
  $('#requestsBody').addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-req]');
    if (!btn) return;
    try {
      const data = await api('/api/support-requests/' + btn.dataset.req);
      const r = data.request;

      const item = (labelText, valueText) =>
        '<div class="detail-item"><div class="label">' + labelText + '</div><div class="value">' + (valueText || '-') + '</div></div>';

      $('#reqModalBody').innerHTML =
        '<div class="detail-list">' +
        item('Submitted', escapeHTML(fmtDate(r.createdAt))) +
        item('Phone', escapeHTML(r.phone)) +
        item('Age / Gender', r.age + ' / ' + escapeHTML(r.gender)) +
        item('Helping', escapeHTML(labelOf(config.userTypes, r.userType))) +
        item('Addictions', (r.addictionCategories || []).map((c) => labelOf(config.addictionTypes, c)).join(', ')) +
        item('Other addiction', escapeHTML(r.otherAddiction)) +
        item('Duration', escapeHTML(r.duration)) +
        item('Preferred area', escapeHTML(r.preferredArea)) +
        item('Preferred service', escapeHTML(labelOf(config.serviceTypes, r.preferredService))) +
        item('Gender support', escapeHTML(r.preferredGender)) +
        item('Budget', escapeHTML(r.budgetPreference)) +
        '</div>' +
        (r.currentSituation ? '<p><strong>Current situation:</strong><br />' + escapeHTML(r.currentSituation) + '</p>' : '') +
        (r.message ? '<p><strong>Message:</strong><br />' + escapeHTML(r.message) + '</p>' : '');

      $('#reqModalTitle').textContent = 'Enquiry - ' + r.name;
      $('#reqModal').classList.add('open');
    } catch (err) {
      showToast(err.message, true);
    }
  });

  // ---------- NGO form modal ----------
  function chipGroup(container, list, name, selected) {
    container.innerHTML = '';
    list.forEach((item) => {
      const label = document.createElement('label');
      label.className = 'chip';
      const checked = (selected || []).includes(item.key) ? ' checked' : '';
      label.innerHTML =
        '<input type="checkbox" name="' + name + '" value="' + item.key + '"' + checked + ' /><span>' + escapeHTML(item.label) + '</span>';
      container.appendChild(label);
    });
  }

  function openNgoModal(ngo) {
    $('#ngoFormError').classList.remove('show');
    $('#ngoId').value = ngo ? ngo._id : '';
    $('#ngoModalTitle').textContent = ngo ? 'Edit Support Centre' : 'Add Support Centre';

    $('#fName').value = ngo ? ngo.name : '';
    $('#fShort').value = ngo ? ngo.shortDescription || '' : '';
    $('#fDesc').value = ngo ? ngo.description || '' : '';
    $('#fAddress').value = ngo ? ngo.address || '' : '';
    $('#fArea').value = ngo ? ngo.area === 'Not available' ? '' : ngo.area || '' : '';
    $('#fCity').value = ngo ? ngo.city || 'Surat' : 'Surat';
    $('#fPhone').value = ngo ? ngo.phone || '' : '';
    $('#fAltPhone').value = ngo ? ngo.alternatePhone || '' : '';
    $('#fEmail').value = ngo ? ngo.email || '' : '';
    $('#fWebsite').value = ngo ? ngo.website || '' : '';
    $('#fTimings').value = ngo ? ngo.timings === 'Not available' ? '' : ngo.timings || '' : '';
    $('#fSource').value = ngo ? ngo.source || '' : '';
    $('#fVerified').checked = ngo ? Boolean(ngo.verified) : false;
    $('#fFacility').value = ngo ? ngo.facilityType || 'not-available' : 'not-available';
    $('#fPricing').value = ngo ? ngo.pricingType || 'not-available' : 'not-available';

    chipGroup($('#fServices'), config.serviceTypes, 'fServicesList', ngo && ngo.services);
    chipGroup($('#fAddictions'), config.addictionTypes, 'fAddictionsList', ngo && ngo.addictionTypes);
    chipGroup($('#fGender'), config.genderSupport.filter((g) => g.key !== 'not-sure'), 'fGenderList', ngo && ngo.genderSupported);

    $('#ngoModal').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeNgoModal() {
    $('#ngoModal').classList.remove('open');
    document.body.style.overflow = '';
  }

  $('#addNgoBtn').addEventListener('click', () => openNgoModal(null));
  $('#ngoCancelBtn').addEventListener('click', closeNgoModal);
  $('#ngoModalClose').addEventListener('click', closeNgoModal);
  $('#ngoModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeNgoModal();
  });

  $('#ngoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = $('#ngoFormError');
    errEl.classList.remove('show');

    const id = $('#ngoId').value;
    const payload = {
      name: $('#fName').value.trim(),
      shortDescription: $('#fShort').value.trim(),
      description: $('#fDesc').value.trim(),
      address: $('#fAddress').value.trim(),
      area: $('#fArea').value.trim() || 'Not available',
      city: $('#fCity').value.trim() || 'Surat',
      phone: $('#fPhone').value.trim(),
      alternatePhone: $('#fAltPhone').value.trim(),
      email: $('#fEmail').value.trim(),
      website: $('#fWebsite').value.trim(),
      timings: $('#fTimings').value.trim() || 'Not available',
      source: $('#fSource').value.trim(),
      verified: $('#fVerified').checked,
      facilityType: $('#fFacility').value,
      pricingType: $('#fPricing').value,
      services: $$('input[name="fServicesList"]:checked').map((i) => i.value),
      addictionTypes: $$('input[name="fAddictionsList"]:checked').map((i) => i.value),
      genderSupported: $$('input[name="fGenderList"]:checked').map((i) => i.value)
    };

    if (!payload.name) {
      errEl.textContent = 'Name is required.';
      errEl.classList.add('show');
      return;
    }

    const btn = $('#ngoSaveBtn');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    try {
      if (id) {
        await api('/api/ngos/' + id, { method: 'PUT', body: payload });
        showToast('Support centre updated.');
      } else {
        await api('/api/ngos', { method: 'POST', body: payload });
        showToast('Support centre added.');
      }
      closeNgoModal();
      await refreshAll();
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.add('show');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Save Centre';
    }
  });

  // ---------- NGO table actions ----------
  $('#ngosBody').addEventListener('click', async (e) => {
    const verifyBtn = e.target.closest('[data-verify]');
    const editBtn = e.target.closest('[data-edit]');
    const deleteBtn = e.target.closest('[data-delete]');

    if (verifyBtn) {
      const ngo = ngosCache.find((n) => n._id === verifyBtn.dataset.verify);
      if (!ngo) return;
      try {
        await api('/api/ngos/' + ngo._id + '/verify', { method: 'PATCH', body: { verified: !ngo.verified } });
        showToast(ngo.verified ? 'Marked as unverified.' : 'Marked as verified.');
        await refreshAll();
      } catch (err) {
        showToast(err.message, true);
      }
    }

    if (editBtn) {
      const ngo = ngosCache.find((n) => n._id === editBtn.dataset.edit);
      if (ngo) openNgoModal(ngo);
    }

    if (deleteBtn) {
      const ngo = ngosCache.find((n) => n._id === deleteBtn.dataset.delete);
      if (!ngo) return;
      if (!confirm('Delete "' + ngo.name + '"? This cannot be undone.')) return;
      try {
        await api('/api/ngos/' + ngo._id, { method: 'DELETE' });
        showToast('Support centre deleted.');
        await refreshAll();
      } catch (err) {
        showToast(err.message, true);
      }
    }
  });

  // ---------- Request modal close ----------
  $('#reqModalClose').addEventListener('click', () => {
    $('#reqModal').classList.remove('open');
  });
  $('#reqModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) $('#reqModal').classList.remove('open');
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      $('#reqModal').classList.remove('open');
      closeNgoModal();
    }
  });

  // ---------- Init ----------
  async function init() {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      config = data.config;

      // Facility & pricing selects
      const facSel = $('#fFacility');
      config.facilityTypes.forEach((f) => {
        const opt = document.createElement('option');
        opt.value = f.key;
        opt.textContent = f.label;
        facSel.appendChild(opt);
      });
      const priceSel = $('#fPricing');
      config.pricingTypes.forEach((p) => {
        const opt = document.createElement('option');
        opt.value = p.key;
        opt.textContent = p.label;
        priceSel.appendChild(opt);
      });
      // Area suggestions
      const datalist = $('#areaList');
      config.areas.forEach((a) => {
        const opt = document.createElement('option');
        opt.value = a;
        datalist.appendChild(opt);
      });
    } catch {
      showToast('Could not load configuration. Is the server running?', true);
      return;
    }

    // Auto-login if a token exists.
    if (getToken()) {
      try {
        await api('/api/admin/me');
        showDashboard();
        return;
      } catch {
        setToken('');
      }
    }
    showLogin();
  }

  document.addEventListener('DOMContentLoaded', init);
})();