let tasks = [];
let projectNames = [];
let draggingId = null;

async function loadTasks() {
  const [tr, pr] = await Promise.all([fetch('/api/tasks'), fetch('/api/projects/names')]);
  tasks        = await tr.json();
  projectNames = await pr.json();
  populateProjectDropdown();
  renderBoard();
}

function populateProjectDropdown() {
  const sel = document.getElementById('task-project');
  sel.innerHTML = '<option value="">— None —</option>' + projectNames.map(n => `<option>${n}</option>`).join('');
}

function renderBoard() {
  const today = new Date().toISOString().split('T')[0];
  const cols  = { 'To Do': 'todo', 'In Progress': 'ip', 'Done': 'done' };

  Object.keys(cols).forEach(col => {
    const colTasks = tasks.filter(t => t.column === col);
    const containerId = `cards-${cols[col]}`;
    document.getElementById(containerId).innerHTML = colTasks.map(t => taskCardHtml(t, today)).join('');
    document.getElementById(`count-${cols[col]}`).textContent = colTasks.length;
  });
}

function taskCardHtml(t, today) {
  const overdue   = t.due < today && t.column !== 'Done';
  const priClass  = t.priority.toLowerCase();
  const dueLabel  = overdue ? `⚠ ${formatDate(t.due)}` : formatDate(t.due);
  const dueClass  = overdue ? 'task-due overdue' : 'task-due';
  const projTag   = t.project ? `<span class="task-project-tag">${escHtml(t.project)}</span>` : '';

  return `
  <div class="task-card priority-${priClass}" draggable="true"
    ondragstart="dragStart(event,${t.id})" id="task-card-${t.id}">
    <div class="task-title-row">
      <span class="task-title">${escHtml(t.title)}</span>
      <div class="task-actions">
        <button class="btn-icon edit"   onclick="editTask(${t.id})" title="Edit">✎</button>
        <button class="btn-icon delete" onclick="confirmDelete(${t.id})" title="Delete">✕</button>
      </div>
    </div>
    ${t.description ? `<div class="task-desc">${escHtml(t.description)}</div>` : ''}
    <div class="task-meta">
      <span class="priority-badge ${priClass}">${t.priority}</span>
      <span class="${dueClass}">${dueLabel}</span>
      <span class="task-assignee">👤 ${escHtml(t.assignee)}</span>
      ${projTag}
    </div>
  </div>`;
}

function escHtml(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function dragStart(event, id) {
  draggingId = id;
  event.dataTransfer.effectAllowed = 'move';
}

function allowDrop(event) {
  event.preventDefault();
  event.currentTarget.classList.add('drag-over');
}

async function dropTask(event, newColumn) {
  event.preventDefault();
  event.currentTarget.classList.remove('drag-over');
  if (!draggingId) return;
  const task = tasks.find(t => t.id === draggingId);
  if (!task || task.column === newColumn) return;
  await fetch(`/api/tasks/${draggingId}`, {
    method: 'PUT',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({...task, column: newColumn})
  });
  draggingId = null;
  await loadTasks();
}

document.querySelectorAll('.kanban-col').forEach(col => {
  col.addEventListener('dragleave', () => col.classList.remove('drag-over'));
});

function openTaskModal(task = null) {
  document.getElementById('task-modal').style.display = 'flex';
  clearErrors('err-task-title','err-task-assignee','err-task-due');
  if (task) {
    document.getElementById('task-modal-title').textContent = 'Edit Task';
    document.getElementById('task-id').value        = task.id;
    document.getElementById('task-title').value     = task.title;
    document.getElementById('task-desc').value      = task.description || '';
    document.getElementById('task-assignee').value  = task.assignee;
    document.getElementById('task-priority').value  = task.priority;
    document.getElementById('task-due').value       = task.due;
    document.getElementById('task-column').value    = task.column;
    document.getElementById('task-project').value   = task.project || '';
  } else {
    document.getElementById('task-modal-title').textContent = 'New Task';
    document.getElementById('task-id').value = '';
    ['task-title','task-desc','task-assignee','task-due'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('task-priority').value = 'Medium';
    document.getElementById('task-column').value   = 'To Do';
    document.getElementById('task-project').value  = '';
  }
}

function closeTaskModal() {
  document.getElementById('task-modal').style.display = 'none';
}

function editTask(id) {
  const t = tasks.find(x => x.id === id);
  if (t) openTaskModal(t);
}

async function saveTask() {
  const title    = document.getElementById('task-title').value.trim();
  const assignee = document.getElementById('task-assignee').value.trim();
  const due      = document.getElementById('task-due').value;

  let valid = true;
  if (!title)    { showError('err-task-title','Task title is required'); valid=false; }
  if (!assignee) { showError('err-task-assignee','Assignee is required'); valid=false; }
  if (!due)      { showError('err-task-due','Due date is required'); valid=false; }
  if (!valid) return;

  const id = document.getElementById('task-id').value;
  const payload = {
    title, assignee, due,
    description: document.getElementById('task-desc').value.trim(),
    priority:    document.getElementById('task-priority').value,
    column:      document.getElementById('task-column').value,
    project:     document.getElementById('task-project').value,
  };

  const method = id ? 'PUT' : 'POST';
  const url    = id ? `/api/tasks/${id}` : '/api/tasks';
  await fetch(url, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
  closeTaskModal();
  await loadTasks();
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
  await fetch(`/api/tasks/${_deleteId}`, { method: 'DELETE' });
  closeConfirm();
  await loadTasks();
}

document.getElementById('task-modal').addEventListener('click',   e => { if (e.target === e.currentTarget) closeTaskModal(); });
document.getElementById('confirm-modal').addEventListener('click', e => { if (e.target === e.currentTarget) closeConfirm(); });

loadTasks();