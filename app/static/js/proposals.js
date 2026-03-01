let proposals = [];

async function loadProposals() {
  const res = await fetch('/api/proposals');
  proposals = await res.json();
  renderProposals();
}

function renderProposals() {
  const filterStatus = document.getElementById('filter-status').value;
  const sortCol      = document.getElementById('sort-col').value;
  const today        = new Date().toISOString().split('T')[0];

  let data = [...proposals];
  if (filterStatus) data = data.filter(p => p.status === filterStatus);
  data.sort((a, b) => {
    if (sortCol === 'deadline') return a.deadline.localeCompare(b.deadline);
    if (sortCol === 'value')    return b.value - a.value;
    if (sortCol === 'status')   return a.status.localeCompare(b.status);
    return 0;
  });

  const tbody = document.getElementById('prop-body');
  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--text-secondary);padding:32px">No proposals found</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(p => {
    const overdue = p.deadline < today && ['Drafting','Internal Review'].includes(p.status);
    const deadlineHtml = overdue
      ? `<span style="color:var(--red);font-weight:600">⚠ ${formatDate(p.deadline)}</span>`
      : formatDate(p.deadline);
    const docHtml = p.doc_link
      ? `<a href="${escHtml(p.doc_link)}" target="_blank" style="color:var(--accent);font-size:13px">View Doc ↗</a>`
      : '<span style="color:var(--text-muted)">—</span>';
    return `
    <tr>
      <td><strong>${escHtml(p.title)}</strong></td>
      <td>${escHtml(p.client)}</td>
      <td>${deadlineHtml}</td>
      <td><span class="badge ${propStatusClass(p.status)}">${p.status}</span></td>
      <td>${escHtml(p.author)}</td>
      <td>${formatCurrency(p.value)}</td>
      <td>${docHtml}</td>
      <td>
        <button class="btn-icon edit"   onclick="editProposal(${p.id})" title="Edit">✎</button>
        <button class="btn-icon delete" onclick="confirmDelete(${p.id})" title="Delete">✕</button>
      </td>
    </tr>`;
  }).join('');
}

function propStatusClass(s) {
  const map = {
    'Drafting':        'badge-notstarted',
    'Internal Review': 'badge-onhold',
    'Submitted':       'badge-inprogress',
    'Won':             'badge-completed',
    'Lost':            'badge-cancelled',
  };
  return map[s] || 'badge-notstarted';
}

function escHtml(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function openProposalModal(proposal = null) {
  document.getElementById('proposal-modal').style.display = 'flex';
  clearErrors('err-prop-title','err-prop-client','err-prop-author','err-prop-deadline','err-prop-value');
  if (proposal) {
    document.getElementById('prop-modal-title').textContent = 'Edit Proposal';
    document.getElementById('prop-id').value       = proposal.id;
    document.getElementById('prop-title').value    = proposal.title;
    document.getElementById('prop-client').value   = proposal.client;
    document.getElementById('prop-author').value   = proposal.author;
    document.getElementById('prop-deadline').value = proposal.deadline;
    document.getElementById('prop-status').value   = proposal.status;
    document.getElementById('prop-value').value    = proposal.value;
    document.getElementById('prop-doc').value      = proposal.doc_link || '';
  } else {
    document.getElementById('prop-modal-title').textContent = 'New Proposal';
    document.getElementById('prop-id').value = '';
    ['prop-title','prop-client','prop-author','prop-deadline','prop-value','prop-doc']
      .forEach(id => document.getElementById(id).value = '');
    document.getElementById('prop-status').value = 'Drafting';
  }
}

function closeProposalModal() {
  document.getElementById('proposal-modal').style.display = 'none';
}

function editProposal(id) {
  const p = proposals.find(x => x.id === id);
  if (p) openProposalModal(p);
}

async function saveProposal() {
  const title    = document.getElementById('prop-title').value.trim();
  const client   = document.getElementById('prop-client').value.trim();
  const author   = document.getElementById('prop-author').value.trim();
  const deadline = document.getElementById('prop-deadline').value;
  const value    = document.getElementById('prop-value').value;

  let valid = true;
  if (!title)    { showError('err-prop-title','Title is required'); valid=false; }
  if (!client)   { showError('err-prop-client','Client is required'); valid=false; }
  if (!author)   { showError('err-prop-author','Author is required'); valid=false; }
  if (!deadline) { showError('err-prop-deadline','Deadline is required'); valid=false; }
  if (value === '' || isNaN(value)) { showError('err-prop-value','Valid value is required'); valid=false; }
  if (!valid) return;

  const payload = {
    title, client, author, deadline,
    status:   document.getElementById('prop-status').value,
    value:    parseFloat(value),
    doc_link: document.getElementById('prop-doc').value.trim(),
  };

  const id     = document.getElementById('prop-id').value;
  const method = id ? 'PUT' : 'POST';
  const url    = id ? `/api/proposals/${id}` : '/api/proposals';
  await fetch(url, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
  closeProposalModal();
  await loadProposals();
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
  await fetch(`/api/proposals/${_deleteId}`, { method: 'DELETE' });
  closeConfirm();
  await loadProposals();
}

document.getElementById('proposal-modal').addEventListener('click', e => { if (e.target === e.currentTarget) closeProposalModal(); });
document.getElementById('confirm-modal').addEventListener('click',  e => { if (e.target === e.currentTarget) closeConfirm(); });

loadProposals();