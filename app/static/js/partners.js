let partners = [];

async function loadPartners() {
  const res = await fetch('/api/partners');
  partners = await res.json();
  populateCountryFilter();
  renderPartners();
}

function populateCountryFilter() {
  const sel = document.getElementById('filter-country');
  const countries = [...new Set(partners.map(p => p.country))].sort();
  sel.innerHTML = '<option value="">All Countries</option>' + countries.map(c => `<option>${c}</option>`).join('');
}

function renderPartners() {
  const search  = document.getElementById('search-input').value.toLowerCase();
  const typeF   = document.getElementById('filter-type').value;
  const countryF= document.getElementById('filter-country').value;

  let data = partners.filter(p => {
    const matchSearch = !search || p.company.toLowerCase().includes(search) || p.capabilities.toLowerCase().includes(search);
    const matchType   = !typeF   || p.type === typeF;
    const matchCountry= !countryF|| p.country === countryF;
    return matchSearch && matchType && matchCountry;
  });

  const tbody = document.getElementById('part-body');
  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;color:var(--text-muted);padding:32px">No entries found</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(p => `
    <tr>
      <td><strong>${escHtml(p.company)}</strong></td>
      <td>${escHtml(p.contact)}</td>
      <td><a href="mailto:${escHtml(p.email)}" style="color:var(--accent)">${escHtml(p.email)}</a></td>
      <td>${escHtml(p.phone)}</td>
      <td>${escHtml(p.country)}</td>
      <td><span class="badge badge-${p.type.toLowerCase()}">${p.type}</span></td>
      <td style="max-width:200px;white-space:normal">${escHtml(p.capabilities)}</td>
      <td>${escHtml(p.lead_time)}</td>
      <td style="max-width:160px;white-space:normal;color:var(--text-muted);font-size:13px">${escHtml(p.notes)}</td>
      <td>
        <button class="btn-icon edit"   onclick="editPartner(${p.id})" title="Edit">✎</button>
        <button class="btn-icon delete" onclick="confirmDelete(${p.id})" title="Delete">✕</button>
      </td>
    </tr>`).join('');
}

function escHtml(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function openPartnerModal(partner = null) {
  document.getElementById('partner-modal').style.display = 'flex';
  clearErrors('err-part-company','err-part-contact','err-part-email','err-part-country','err-part-capabilities');
  if (partner) {
    document.getElementById('part-modal-title').textContent = 'Edit Entry';
    document.getElementById('part-id').value           = partner.id;
    document.getElementById('part-company').value      = partner.company;
    document.getElementById('part-contact').value      = partner.contact;
    document.getElementById('part-email').value        = partner.email;
    document.getElementById('part-phone').value        = partner.phone;
    document.getElementById('part-country').value      = partner.country;
    document.getElementById('part-type').value         = partner.type;
    document.getElementById('part-capabilities').value = partner.capabilities;
    document.getElementById('part-leadtime').value     = partner.lead_time;
    document.getElementById('part-notes').value        = partner.notes;
  } else {
    document.getElementById('part-modal-title').textContent = 'New Partner / Supplier';
    document.getElementById('part-id').value = '';
    ['part-company','part-contact','part-email','part-phone','part-country','part-capabilities','part-leadtime','part-notes']
      .forEach(id => document.getElementById(id).value = '');
    document.getElementById('part-type').value = 'Partner';
  }
}

function closePartnerModal() {
  document.getElementById('partner-modal').style.display = 'none';
}

function editPartner(id) {
  const p = partners.find(x => x.id === id);
  if (p) openPartnerModal(p);
}

async function savePartner() {
  const company      = document.getElementById('part-company').value.trim();
  const contact      = document.getElementById('part-contact').value.trim();
  const email        = document.getElementById('part-email').value.trim();
  const country      = document.getElementById('part-country').value.trim();
  const capabilities = document.getElementById('part-capabilities').value.trim();

  let valid = true;
  if (!company)      { showError('err-part-company','Company name is required'); valid=false; }
  if (!contact)      { showError('err-part-contact','Contact person is required'); valid=false; }
  if (!email)        { showError('err-part-email','Email is required'); valid=false; }
  if (!country)      { showError('err-part-country','Country is required'); valid=false; }
  if (!capabilities) { showError('err-part-capabilities','Capabilities are required'); valid=false; }
  if (!valid) return;

  const payload = {
    company, contact, email, country, capabilities,
    phone:     document.getElementById('part-phone').value.trim(),
    type:      document.getElementById('part-type').value,
    lead_time: document.getElementById('part-leadtime').value.trim(),
    notes:     document.getElementById('part-notes').value.trim(),
  };

  const id     = document.getElementById('part-id').value;
  const method = id ? 'PUT' : 'POST';
  const url    = id ? `/api/partners/${id}` : '/api/partners';
  await fetch(url, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
  closePartnerModal();
  await loadPartners();
}

let _deleteId = null;

function confirmDelete(id) {
  _deleteId = id;
  document.getElementById('confirm-modal').style.display = 'flex';
  document.getElementById('confirm-delete-btn').onclick = doDelete;
}

function closeConfirm() {
  document.getElementById('confirm-modal').style.display = 'none';
  _deleteId = null;
}

async function doDelete() {
  await fetch(`/api/partners/${_deleteId}`, { method:'DELETE' });
  closeConfirm();
  await loadPartners();
}

document.getElementById('partner-modal').addEventListener('click', e => { if (e.target === e.currentTarget) closePartnerModal(); });
document.getElementById('confirm-modal').addEventListener('click',  e => { if (e.target === e.currentTarget) closeConfirm(); });

loadPartners();