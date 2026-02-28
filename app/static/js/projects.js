let projects = [];

async function loadProjects() {
  const res = await fetch('/api/projects');
  projects = await res.json();
  renderProjects();
}

function renderProjects() {
  const filterStatus = document.getElementById('filter-status').value;
  const sortCol      = document.getElementById('sort-col').value;
  const today        = new Date().toISOString().split('T')[0];

  let data = [...projects];
  if (filterStatus) data = data.filter(p => p.status === filterStatus);

  data.sort((a, b) => {
    if (sortCol === 'deadline') return a.deadline.localeCompare(b.deadline);
    if (sortCol === 'status')   return a.status.localeCompare(b.status);
    if (sortCol === 'name')     return a.name.localeCompare(b.name);
    if (sortCol === 'budget')   return b.budget - a.budget;
    return 0;
  });

  const tbody = document.getElementById('proj-body');
  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:var(--text-muted);padding:32px">No projects found</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(p => {
    const overdue = p.deadline < today && !['Completed','Cancelled'].includes(p.status);
    const deadlineHtml = overdue
      ? `<span style="color:var(--red);font-weight:600">⚠ ${formatDate(p.deadline)}</span>`
      : formatDate(p.deadline);
    return `
    <tr>
      <td><strong>${escHtml(p.name)}</strong></td>
      <td>${escHtml(p.client)}</td>
      <td><span class="badge ${statusClass(p.status)}">${p.status}</span></td>
      <td>${formatDate(p.start)}</td>
      <td>${deadlineHtml}</td>
      <td>${formatCurrency(p.budget)}</td>
      <td>${escHtml(p.lead)}</td>
      <td>
        <div class="progress-wrap">
          <div class="progress-bar"><div class="progress-fill" style="width:${p.progress}%"></div></div>
          <span class="progress-pct">${p.progress}%</span>
        </div>
      </td>
      <td>
        <button class="btn-icon edit"   onclick="editProject(${p.id})" title="Edit">✎</button>
        <button class="btn-icon delete" onclick="confirmDelete(${p.id})" title="Delete">✕</button>
      </td>
    </tr>`;
  }).join('');
}

function statusClass(s) {
  const map = {
    'In Progress':'badge-inprogress','Not Started':'badge-notstarted',
    'Completed':'badge-completed','On Hold':'badge-onhold','Cancelled':'badge-cancelled'
  };
  return map[s] || 'badge-notstarted';
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function openProjectModal(project = null) {
  document.getElementById('project-modal').style.display = 'flex';
  clearErrors('err-proj-name','err-proj-client','err-proj-lead','err-proj-start','err-proj-deadline','err-proj-budget','err-proj-progress');
  if (project) {
    document.getElementById('proj-modal-title').textContent = 'Edit Project';
    document.getElementById('proj-id').value       = project.id;
    document.getElementById('proj-name').value     = project.name;
    document.getElementById('proj-client').value   = project.client;
    document.getElementById('proj-status').value   = project.status;
    document.getElementById('proj-lead').value     = project.lead;
    document.getElementById('proj-start').value    = project.start;
    document.getElementById('proj-deadline').value = project.deadline;
    document.getElementById('proj-budget').value   = project.budget;
    document.getElementById('proj-progress').value = project.progress;
  } else {
    document.getElementById('proj-modal-title').textContent = 'New Project';
    document.getElementById('proj-id').value = '';
    ['proj-name','proj-client','proj-lead','proj-start','proj-deadline','proj-budget','proj-progress']
      .forEach(id => document.getElementById(id).value = '');
    document.getElementById('proj-status').value = 'Not Started';
    document.getElementById('proj-progress').value = 0;
  }
}

function closeProjectModal() {
  document.getElementById('project-modal').style.display = 'none';
}

function editProject(id) {
  const p = projects.find(x => x.id === id);
  if (p) openProjectModal(p);
}

async function saveProject() {
  const name     = document.getElementById('proj-name').value.trim();
  const client   = document.getElementById('proj-client').value.trim();
  const lead     = document.getElementById('proj-lead').value.trim();
  const start    = document.getElementById('proj-start').value;
  const deadline = document.getElementById('proj-deadline').value;
  const budget   = document.getElementById('proj-budget').value;
  const progress = document.getElementById('proj-progress').value;

  let valid = true;
  if (!name)     { showError('err-proj-name','Project name is required'); valid=false; }
  if (!client)   { showError('err-proj-client','Client is required'); valid=false; }
  if (!lead)     { showError('err-proj-lead','Assigned lead is required'); valid=false; }
  if (!start)    { showError('err-proj-start','Start date is required'); valid=false; }
  if (!deadline) { showError('err-proj-deadline','Deadline is required'); valid=false; }
  if (budget === '' || isNaN(budget)) { showError('err-proj-budget','Valid budget is required'); valid=false; }
  if (progress === '' || isNaN(progress) || progress < 0 || progress > 100) {
    showError('err-proj-progress','Progress must be 0–100'); valid=false;
  }
  if (!valid) return;

  const payload = {
    name, client, lead, start, deadline,
    status:   document.getElementById('proj-status').value,
    budget:   parseFloat(budget),
    progress: parseInt(progress),
  };

  const id = document.getElementById('proj-id').value;
  const method = id ? 'PUT' : 'POST';
  const url    = id ? `/api/projects/${id}` : '/api/projects';
  await fetch(url, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
  closeProjectModal();
  await loadProjects();
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
  if (!_deleteId) return;
  await fetch(`/api/projects/${_deleteId}`, { method: 'DELETE' });
  closeConfirm();
  await loadProjects();
}

document.getElementById('project-modal').addEventListener('click', e => { if (e.target === e.currentTarget) closeProjectModal(); });
document.getElementById('confirm-modal').addEventListener('click',  e => { if (e.target === e.currentTarget) closeConfirm(); });

loadProjects();