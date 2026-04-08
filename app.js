/* ═══════════════════════════════════════════
   TeamForge — Application Logic
   ═══════════════════════════════════════════ */

// ── Auth Guard ──
const SESSION_KEY = 'a100263_user';
let currentUser = null;

(function checkAuth() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) { window.location.replace('login.html'); return; }
    currentUser = JSON.parse(raw);
    if (!currentUser || !currentUser.name || !currentUser.role) {
      window.location.replace('login.html');
      return;
    }
  } catch {
    window.location.replace('login.html');
    return;
  }
})();

// ── Permissions (Delegated Access) ──
const PERMS_KEY = 'a100263_permissions';

function loadPerms() {
  try { return JSON.parse(localStorage.getItem(PERMS_KEY)) || {}; }
  catch { return {}; }
}

function savePerms(perms) {
  localStorage.setItem(PERMS_KEY, JSON.stringify(perms));
}

// Returns true if the logged-in user is allowed to assign tasks
function hasTaskAssignPermission() {
  if (!currentUser) return false;
  if (currentUser.role === 'captain') return true;
  const granted = loadPerms().taskAssignment || [];
  return granted.some(g => g.toLowerCase() === currentUser.name.toLowerCase());
}

// ── Team Members Data ──

const TEAM_MEMBERS = [
  { id: 1, name: 'Tamil Amuthan', role: 'Captain', color: 'linear-gradient(135deg, #a855f7, #7c3aed)', isCaptain: true, avatar: 'images/tamil-amuthan.png' },
  { id: 2, name: 'Kamalesh', role: 'Vice Captain', color: 'linear-gradient(135deg, #3b82f6, #2563eb)', avatar: 'images/kamalesh.jpg' },
  { id: 3, name: 'Hajira Banu', role: 'Strategist', color: 'linear-gradient(135deg, #10b981, #059669)', avatar: 'images/hajira-banu.jpg' },
  { id: 4, name: 'Abi Varshini', role: 'Manager', color: 'linear-gradient(135deg, #f59e0b, #d97706)', avatar: 'images/abi-varshini.jpg' },
  { id: 5, name: 'Ashif Ahmed', role: 'Member', color: 'linear-gradient(135deg, #ef4444, #dc2626)', avatar: 'images/ashif-ahmed.jpg' },
  { id: 6, name: 'Sudharshan', role: 'Member', color: 'linear-gradient(135deg, #06b6d4, #0891b2)', avatar: 'images/sudharshan.png' },
  { id: 7, name: 'Harivarthan', role: 'Member', color: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', avatar: 'images/harivarthan.png' },
  { id: 8, name: 'Pranesh', role: 'Member', color: 'linear-gradient(135deg, #ec4899, #db2777)', avatar: 'images/pranesh.jpg' },
  { id: 9, name: 'Sanjeev', role: 'Member', color: 'linear-gradient(135deg, #14b8a6, #0d9488)', avatar: 'images/sanjeev.png' },
  { id: 10, name: 'Archana', role: 'Member', color: 'linear-gradient(135deg, #f97316, #ea580c)', avatar: 'images/archana.png' },
  { id: 11, name: 'Abishek', role: 'Member', color: 'linear-gradient(135deg, #6366f1, #4f46e5)', avatar: 'images/abishek.png' },
  { id: 12, name: 'Rashmika P', role: 'Member', color: 'linear-gradient(135deg, #e879f9, #c026d3)', avatar: 'images/rashmika-p.jpg' },
  { id: 13, name: 'Tejasri K', role: 'Member', color: 'linear-gradient(135deg, #fb923c, #ea580c)', avatar: 'images/tejasri-k.jpg' },
  { id: 14, name: 'Srinithi S', role: 'Member', color: 'linear-gradient(135deg, #38bdf8, #0284c7)', avatar: 'images/srinithi-s.jpg' },
];

// ── State ──
let state = loadState();

function defaultState() {
  return { tasks: [], submissions: [], activities: [], captainMessages: [] };
}

function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem('teamforge_state'));
    return s || defaultState();
  } catch { return defaultState(); }
}

function saveState() {
  localStorage.setItem('teamforge_state', JSON.stringify(state));
}

// ── Helpers ──
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getMember(id) { return TEAM_MEMBERS.find(m => m.id === Number(id)); }
function getInitials(name) { return name.split(' ').map(w => w[0]).join('').toUpperCase(); }
function avatarHtml(member, sizeClass) {
  if (member.avatar) {
    return `<div class="avatar ${sizeClass}" style="background-image:url('${member.avatar}');background-size:cover;background-position:center;background-repeat:no-repeat;"></div>`;
  }
  return `<div class="avatar ${sizeClass}" style="background:${member.color}">${getInitials(member.name)}</div>`;
}

// ── Navigation ──
const navItems = document.querySelectorAll('.nav-item');
const sections = document.querySelectorAll('.content-section');

const pageTitles = {
  dashboard: ['Dashboard', 'Overview of your team\'s progress'],
  tasks: ['Task Management', 'Create and manage team tasks'],
  feed: ['Submission Feed', 'Live feed of completed work'],
  team: ['Team Members', 'All 14 team members at a glance'],
  captain: ['Captain\'s Deck', 'Team leadership & broadcasts'],
  activity: ['Notifications', 'Recent activity & updates'],
};

function switchSection(sectionId) {
  sections.forEach(s => s.classList.remove('active'));
  navItems.forEach(n => n.classList.remove('active'));
  document.getElementById(`section-${sectionId}`).classList.add('active');
  document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');
  const [title, subtitle] = pageTitles[sectionId];
  document.getElementById('page-title').textContent = title;
  document.getElementById('page-subtitle').textContent = subtitle;
}

navItems.forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    switchSection(item.dataset.section);
    if (window.innerWidth <= 768) document.getElementById('sidebar').classList.remove('open');
  });
});

// ── Mobile Menu ──
document.getElementById('menu-toggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

// ── Populate Selects ──
function populateSelects() {
  const selects = [document.getElementById('task-member'), document.getElementById('submit-member')];
  selects.forEach(sel => {
    const first = sel.querySelector('option');
    sel.innerHTML = '';
    sel.appendChild(first);
    TEAM_MEMBERS.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = `${m.name} — ${m.role}`;
      sel.appendChild(opt);
    });
  });
}

// ── Render Dashboard ──
function renderDashboard() {
  const total = state.tasks.length;
  const completed = state.tasks.filter(t => t.completed).length;
  const pending = total - completed;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  document.getElementById('dash-assigned-count').textContent = total;
  document.getElementById('dash-completed-count').textContent = completed;
  document.getElementById('dash-pending-count').textContent = pending;
  document.getElementById('dash-completion-pct').textContent = pct + '%';

  // Progress ring
  const circumference = 2 * Math.PI * 68;
  const offset = circumference - (pct / 100) * circumference;
  document.getElementById('progress-ring-fill').style.strokeDashoffset = offset;
  document.getElementById('progress-pct-text').textContent = pct + '%';

  // Progress bars
  document.getElementById('pb-assigned').textContent = total;
  document.getElementById('pb-completed').textContent = completed;
  document.getElementById('pb-pending').textContent = pending;
  const max = Math.max(total, 1);
  document.getElementById('pb-assigned-fill').style.width = '100%';
  document.getElementById('pb-completed-fill').style.width = (completed / max * 100) + '%';
  document.getElementById('pb-pending-fill').style.width = (pending / max * 100) + '%';

  // Captain stats
  document.getElementById('captain-tasks-assigned').textContent = total;
  document.getElementById('captain-tasks-completed').textContent = completed;

  renderDashboardActivity();
  renderTeamAvatars();
}

function renderDashboardActivity() {
  const list = document.getElementById('dashboard-activity-list');
  if (state.activities.length === 0) {
    list.innerHTML = `<div class="empty-state small"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg><p>No activity yet</p></div>`;
    return;
  }
  list.innerHTML = state.activities.slice(0, 8).map(a => {
    const iconClass = a.type === 'assigned' ? 'assigned' : a.type === 'completed' ? 'completed' : 'broadcast';
    const icon = a.type === 'completed'
      ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>'
      : a.type === 'assigned'
        ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'
        : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
    return `
      <div class="activity-item">
        <div class="activity-icon ${iconClass}">${icon}</div>
        <div class="activity-body">
          <div class="activity-text">${a.text}</div>
          <span class="activity-time">${timeAgo(a.time)}</span>
        </div>
      </div>`;
  }).join('');
}

function renderTeamAvatars() {
  const row = document.getElementById('team-avatars-row');
  row.innerHTML = TEAM_MEMBERS.map(m => {
    const completed = state.tasks.filter(t => t.memberId === m.id && t.completed).length;
    const hasActive = state.tasks.some(t => t.memberId === m.id && !t.completed);
    const statusClass = hasActive ? 'active' : completed > 0 ? 'active' : 'idle';
    return `
      <div class="team-avatar-item" onclick="switchSection('team')">
        <div style="position:relative">
          ${avatarHtml(m, 'avatar-md')}
          <div class="team-avatar-status ${statusClass}"></div>
        </div>
        <span class="team-avatar-name">${m.name.split(' ')[0]}</span>
      </div>`;
  }).join('');
}

// ── Render Tasks ──
let currentFilter = 'all';

function renderTasks() {
  const list = document.getElementById('task-list');
  let tasks = [...state.tasks].reverse();
  if (currentFilter === 'pending') tasks = tasks.filter(t => !t.completed);
  if (currentFilter === 'completed') tasks = tasks.filter(t => t.completed);

  if (tasks.length === 0) {
    list.innerHTML = `<div class="empty-state"><svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg><h4>No tasks found</h4><p>${currentFilter === 'all' ? 'Create your first task using the form' : 'No ' + currentFilter + ' tasks'}</p></div>`;
    return;
  }

  list.innerHTML = tasks.map(t => {
    const member = getMember(t.memberId);
    const deadlineStr = formatDate(t.deadline);
    const isOverdue = !t.completed && new Date(t.deadline) < new Date();
    return `
      <div class="task-item ${t.completed ? 'completed' : ''}">
        <div class="task-item-header">
          <span class="task-item-title ${t.completed ? 'done' : ''}">${escHtml(t.title)}</span>
          <span class="task-item-priority ${t.priority}">${t.priority}</span>
        </div>
        <div class="task-item-desc">${escHtml(t.description)}</div>
        <div class="task-item-meta">
          <div class="task-meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            ${member ? member.name : 'Unknown'}
          </div>
          <div class="task-meta-item" style="${isOverdue ? 'color:var(--accent-red)' : ''}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            ${deadlineStr}${isOverdue ? ' (Overdue)' : ''}
          </div>
          <div class="task-meta-item">
            ${t.completed
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Completed'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="var(--accent-amber)" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Pending'}
          </div>
        </div>
        ${!t.completed ? `
          <div class="task-item-actions">
            <button class="btn btn-sm btn-outline" onclick="openSubmitModal('${t.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Submit Work
            </button>
          </div>` : ''}
      </div>`;
  }).join('');
}

// Filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});

// ── Create Task ──
document.getElementById('create-task-form').addEventListener('submit', e => {
  e.preventDefault();
  const title = document.getElementById('task-title').value.trim();
  const description = document.getElementById('task-desc').value.trim();
  const memberId = Number(document.getElementById('task-member').value);
  const deadline = document.getElementById('task-deadline').value;
  const priority = document.querySelector('input[name="priority"]:checked').value;

  if (!title || !description || !memberId || !deadline) return;

  const task = { id: genId(), title, description, memberId, deadline, priority, completed: false, createdAt: new Date().toISOString() };
  state.tasks.push(task);

  const member = getMember(memberId);
  addActivity('assigned', `<strong>Captain</strong> assigned "<strong>${escHtml(title)}</strong>" to <strong>${member.name}</strong>`);

  saveState();
  renderAll();
  e.target.reset();
  showToast('success', `Task assigned to ${member.name}`);
});

// ── Submission ──
function openSubmitModal(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;
  document.getElementById('submit-task-id').value = taskId;
  document.getElementById('modal-task-title').textContent = `Task: ${task.title}`;

  // Pre-select the assigned member
  document.getElementById('submit-member').value = task.memberId;

  document.getElementById('submission-modal').classList.add('show');
}

document.getElementById('modal-close').addEventListener('click', () => {
  document.getElementById('submission-modal').classList.remove('show');
});

document.getElementById('submission-modal').addEventListener('click', e => {
  if (e.target === document.getElementById('submission-modal')) {
    document.getElementById('submission-modal').classList.remove('show');
  }
});

// Toggle submission type fields
document.querySelectorAll('input[name="sub-type"]').forEach(radio => {
  radio.addEventListener('change', () => {
    document.getElementById('sub-text-group').classList.toggle('hidden', radio.value !== 'text');
    document.getElementById('sub-link-group').classList.toggle('hidden', radio.value !== 'link');
    document.getElementById('sub-file-group').classList.toggle('hidden', radio.value !== 'file');
  });
});

document.getElementById('submission-form').addEventListener('submit', e => {
  e.preventDefault();
  const taskId = document.getElementById('submit-task-id').value;
  const memberId = Number(document.getElementById('submit-member').value);
  const subType = document.querySelector('input[name="sub-type"]:checked').value;
  let content = '';
  if (subType === 'text') content = document.getElementById('sub-text').value.trim();
  else if (subType === 'link') content = document.getElementById('sub-link').value.trim();
  else content = document.getElementById('sub-file').value.trim();

  if (!memberId || !content) return;

  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;
  task.completed = true;

  const member = getMember(memberId);
  const submission = {
    id: genId(),
    taskId,
    taskTitle: task.title,
    memberId,
    memberName: member.name,
    type: subType,
    content,
    time: new Date().toISOString(),
  };
  state.submissions.unshift(submission);
  addActivity('completed', `<strong>${member.name}</strong> completed "<strong>${escHtml(task.title)}</strong>"`);

  saveState();
  renderAll();
  document.getElementById('submission-modal').classList.remove('show');
  e.target.reset();
  document.getElementById('sub-text-group').classList.remove('hidden');
  document.getElementById('sub-link-group').classList.add('hidden');
  document.getElementById('sub-file-group').classList.add('hidden');
  showToast('success', `${member.name} submitted work for "${task.title}"`);
});

// ── Feed ──
function renderFeed() {
  const list = document.getElementById('feed-list');
  if (state.submissions.length === 0) {
    list.innerHTML = `<div class="empty-state"><svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><h4>No submissions yet</h4><p>Submissions will appear here as members complete tasks</p></div>`;
    return;
  }

  list.innerHTML = state.submissions.map(s => {
    const member = getMember(s.memberId);
    let contentHtml = '';
    if (s.type === 'text') contentHtml = escHtml(s.content);
    else if (s.type === 'link') contentHtml = `<a href="${escHtml(s.content)}" target="_blank">${escHtml(s.content)}</a>`;
    else contentHtml = `📎 ${escHtml(s.content)}`;

    const badgeClass = s.type === 'text' ? 'text-badge' : s.type === 'link' ? 'link-badge' : 'file-badge';
    return `
      <div class="feed-item">
        <div class="feed-item-header">
          ${member ? avatarHtml(member, 'avatar-md') : '<div class="avatar avatar-md" style="background:var(--gradient-primary)">?</div>'}
          <div class="feed-item-info">
            <div class="feed-item-name">${s.memberName}</div>
            <div class="feed-item-time">${timeAgo(s.time)}</div>
          </div>
          <span class="feed-item-task-badge">${escHtml(s.taskTitle)}</span>
        </div>
        <div class="feed-item-content">${contentHtml}</div>
        <div class="feed-item-footer">
          <span class="feed-badge ${badgeClass}">${s.type.charAt(0).toUpperCase() + s.type.slice(1)} Submission</span>
          <span style="font-size:0.75rem;color:var(--text-muted)">${formatDate(s.time)}</span>
        </div>
      </div>`;
  }).join('');
}

// ── Team Members ──
function renderTeam() {
  const grid = document.getElementById('team-grid');
  grid.innerHTML = TEAM_MEMBERS.map(m => {
    const assigned = state.tasks.filter(t => t.memberId === m.id).length;
    const completed = state.tasks.filter(t => t.memberId === m.id && t.completed).length;
    const hasActive = state.tasks.some(t => t.memberId === m.id && !t.completed);
    const statusText = hasActive ? 'Active' : completed > 0 ? 'Active' : 'Idle';
    const statusClass = statusText === 'Active' ? 'active' : 'idle';

    return `
      <div class="member-card ${m.isCaptain ? 'captain-card' : ''}">
        ${m.isCaptain ? '<div class="captain-badge-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>' : ''}
        ${avatarHtml(m, 'avatar-lg')}
        <div class="member-card-name">${m.name}</div>
        <div class="member-card-role">${m.role}</div>
        <div class="member-card-stats">
          <div class="member-stat-item">
            <span class="member-stat-value">${assigned}</span>
            <span class="member-stat-label">Assigned</span>
          </div>
          <div class="member-stat-item">
            <span class="member-stat-value">${completed}</span>
            <span class="member-stat-label">Completed</span>
          </div>
        </div>
        <span class="member-status-badge ${statusClass}">${statusText}</span>
      </div>`;
  }).join('');
}

// ── Captain Messages ──
document.getElementById('captain-message-form').addEventListener('submit', e => {
  e.preventDefault();
  const msg = document.getElementById('captain-message-input').value.trim();
  if (!msg) return;
  state.captainMessages.unshift({ id: genId(), text: msg, time: new Date().toISOString() });
  addActivity('broadcast', `<strong>Captain</strong> posted a broadcast message`);
  saveState();
  renderCaptainMessages();
  renderDashboard();
  renderActivityFull();
  document.getElementById('captain-message-input').value = '';
  showToast('info', 'Broadcast sent to team');
});

function renderCaptainMessages() {
  const list = document.getElementById('captain-messages-list');
  if (state.captainMessages.length === 0) {
    list.innerHTML = '<div class="empty-state small"><p>No broadcasts yet</p></div>';
    return;
  }
  list.innerHTML = state.captainMessages.map(m => `
    <div class="captain-msg-item">
      <div class="captain-msg-text">${escHtml(m.text)}</div>
      <div class="captain-msg-time">${timeAgo(m.time)}</div>
    </div>
  `).join('');
}

// ── Activity / Notifications ──
function addActivity(type, text) {
  state.activities.unshift({ id: genId(), type, text, time: new Date().toISOString() });
  updateActivityBadge();
}

function updateActivityBadge() {
  const badge = document.getElementById('activity-badge');
  const count = state.activities.length;
  badge.textContent = count > 99 ? '99+' : count;
  badge.classList.toggle('show', count > 0);
  document.getElementById('notification-dot').classList.toggle('show', count > 0);
}

function renderActivityFull() {
  const list = document.getElementById('activity-full-list');
  if (state.activities.length === 0) {
    list.innerHTML = `<div class="empty-state"><svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg><h4>All caught up!</h4><p>Notifications will appear as tasks are assigned and completed</p></div>`;
    return;
  }
  list.innerHTML = state.activities.map(a => {
    const iconClass = a.type === 'assigned' ? 'assigned' : a.type === 'completed' ? 'completed' : 'broadcast';
    const icon = a.type === 'completed'
      ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>'
      : a.type === 'assigned'
        ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'
        : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
    return `
      <div class="activity-item">
        <div class="activity-icon ${iconClass}">${icon}</div>
        <div class="activity-body">
          <div class="activity-text">${a.text}</div>
          <span class="activity-time">${timeAgo(a.time)}</span>
        </div>
      </div>`;
  }).join('');
}

// Notification bell → jump to activity
document.getElementById('notification-btn').addEventListener('click', () => switchSection('activity'));

// ── Search ──
document.getElementById('search-input').addEventListener('input', e => {
  const q = e.target.value.toLowerCase();
  if (!q) { renderTasks(); return; }
  switchSection('tasks');
  const list = document.getElementById('task-list');
  const filtered = [...state.tasks].reverse().filter(t =>
    t.title.toLowerCase().includes(q) ||
    t.description.toLowerCase().includes(q) ||
    (getMember(t.memberId)?.name || '').toLowerCase().includes(q)
  );
  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty-state"><h4>No matching tasks</h4></div>`;
    return;
  }
  // Re-render with filtered (reuse render logic inline for simplicity by temporarily swapping)
  const origTasks = state.tasks;
  state.tasks = filtered;
  currentFilter = 'all';
  renderTasks();
  state.tasks = origTasks;
});

// ── Toast ──
function showToast(type, message) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icon = type === 'success'
    ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>'
    : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
  toast.innerHTML = `<div class="toast-icon">${icon}</div><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('leaving');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ── Escape HTML ──
function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ── Role-Based UI ──
function applyRoleUI() {
  const isCapt   = currentUser.role === 'captain';
  const canAssign = hasTaskAssignPermission(); // captain OR delegated member

  // ─ Sidebar: populate logged-in user info ─
  const member = TEAM_MEMBERS.find(m => m.name.toLowerCase() === currentUser.name.toLowerCase());
  const avatarEl = document.getElementById('sidebar-avatar');
  const nameEl   = document.getElementById('sidebar-user-name');
  const roleEl   = document.getElementById('sidebar-user-role');

  if (member) {
    if (member.avatar) {
      avatarEl.style.backgroundImage = `url('${member.avatar}')`;
      avatarEl.style.backgroundSize   = 'cover';
      avatarEl.style.backgroundPosition = 'center';
      avatarEl.textContent = '';
    } else {
      avatarEl.style.background = member.color;
      avatarEl.textContent = getInitials(member.name);
    }
    nameEl.textContent = member.name.split(' ')[0];
    // Show a \u2022 Delegated badge on role if they have delegated access but are not captain
    roleEl.textContent = member.role + (canAssign && !isCapt ? ' · Delegate' : '');
  } else {
    if (currentUser.picture) {
      avatarEl.style.backgroundImage = `url('${currentUser.picture}')`;
      avatarEl.style.backgroundSize = 'cover';
      avatarEl.style.backgroundPosition = 'center';
      avatarEl.textContent = '';
    }
    nameEl.textContent = currentUser.name.split(' ')[0];
    roleEl.textContent = isCapt ? 'Captain' : 'Member';
  }

  // ─ Tasks section: show captain layout if user can assign, member layout otherwise ─
  document.getElementById('captain-tasks-layout').style.display = canAssign ? '' : 'none';
  document.getElementById('member-tasks-layout').style.display  = canAssign ? 'none' : 'grid';

  // ─ Captain-only nav: only the actual captain sees the Captain tab ─
  const captainNavItem = document.getElementById('nav-captain');
  if (!isCapt) {
    captainNavItem.style.display = 'none';
  }

  // ─ Page title for Tasks ─
  if (canAssign) {
    pageTitles.tasks = ['Task Management', isCapt ? 'Create and manage team tasks' : 'Assign tasks on captain\'s behalf'];
  } else {
    pageTitles.tasks = ['My Tasks', 'Tasks assigned to you by the captain'];
  }

  // ─ Delegate card ─ only visible to captain ─
  document.getElementById('delegate-card').style.display = isCapt ? '' : 'none';
}

// ── Member Tasks Render ──
let memberCurrentFilter = 'all';

function renderMemberTasks() {
  if (!currentUser || currentUser.role === 'captain') return;

  // Find which team member matches the logged-in user
  const me = TEAM_MEMBERS.find(m => m.name.toLowerCase() === currentUser.name.toLowerCase());
  const myId = me ? me.id : null;

  const list = document.getElementById('member-task-list');
  let tasks = [...state.tasks].filter(t => t.memberId === myId).reverse();

  if (memberCurrentFilter === 'pending')   tasks = tasks.filter(t => !t.completed);
  if (memberCurrentFilter === 'completed') tasks = tasks.filter(t =>  t.completed);

  if (tasks.length === 0) {
    const msg = myId === null
      ? 'Your account name does not match any team member.'
      : memberCurrentFilter === 'all'
        ? 'No tasks assigned to you yet'
        : `No ${memberCurrentFilter} tasks`;
    list.innerHTML = `<div class="empty-state"><svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg><h4>${msg}</h4><p>Your captain will assign tasks to you soon</p></div>`;
    return;
  }

  list.innerHTML = tasks.map(t => {
    const deadlineStr = formatDate(t.deadline);
    const isOverdue = !t.completed && new Date(t.deadline) < new Date();
    return `
      <div class="task-item ${t.completed ? 'completed' : ''}">
        <div class="task-item-header">
          <span class="task-item-title ${t.completed ? 'done' : ''}">${escHtml(t.title)}</span>
          <span class="task-item-priority ${t.priority}">${t.priority}</span>
        </div>
        <div class="task-item-desc">${escHtml(t.description)}</div>
        <div class="task-item-meta">
          <div class="task-meta-item" style="${isOverdue ? 'color:var(--accent-red)' : ''}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            ${deadlineStr}${isOverdue ? ' (Overdue)' : ''}
          </div>
          <div class="task-meta-item">
            ${t.completed
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Completed'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="var(--accent-amber)" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Pending'}
          </div>
        </div>
        ${!t.completed ? `
          <div class="task-item-actions">
            <button class="btn btn-sm btn-outline" onclick="openSubmitModal('${t.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Submit Work
            </button>
          </div>` : ''}
      </div>`;
  }).join('');
}

// ── Member filter buttons ──
document.querySelectorAll('.member-filter').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.member-filter').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    memberCurrentFilter = btn.dataset.filter;
    renderMemberTasks();
  });
});

// ── Logout ──
document.getElementById('logout-btn').addEventListener('click', () => {
  // Use Firebase signOut if available, otherwise fallback
  if (window.signOutApp) {
    window.signOutApp();
  } else {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.replace('login.html');
  }
});

// ── Delegate Access Panel ──
function renderDelegatePanel() {
  if (!currentUser || currentUser.role !== 'captain') return;

  const perms   = loadPerms();
  const granted = perms.taskAssignment || [];

  // All non-captain members are eligible
  const eligible = TEAM_MEMBERS.filter(m => !m.isCaptain);
  const grantedCount = eligible.filter(m => granted.includes(m.name)).length;

  // Update counter badge
  const countEl = document.getElementById('delegate-granted-count');
  countEl.innerHTML = grantedCount > 0
    ? `<span class="delegate-count-badge">${grantedCount} member${grantedCount > 1 ? 's' : ''} with access</span>`
    : `<span class="delegate-count-none">No access delegated</span>`;

  const list = document.getElementById('delegate-members-list');
  list.innerHTML = eligible.map(m => {
    const isGranted = granted.includes(m.name);
    const avatarStr = m.avatar
      ? `<div class="avatar avatar-sm" style="background-image:url('${m.avatar}');background-size:cover;background-position:center;"></div>`
      : `<div class="avatar avatar-sm" style="background:${m.color}">${getInitials(m.name)}</div>`;
    return `
      <div class="delegate-row ${isGranted ? 'delegate-row-granted' : ''}" id="drow-${m.id}">
        <div class="delegate-row-info">
          ${avatarStr}
          <div class="delegate-row-text">
            <span class="delegate-row-name">${m.name}</span>
            <span class="delegate-row-role">${m.role}</span>
          </div>
          ${isGranted ? '<span class="delegate-active-badge"><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polyline points="20 6 9 17 4 12"/></svg> Can Assign</span>' : ''}
        </div>
        <label class="toggle-switch" title="${isGranted ? 'Revoke task assignment access' : 'Grant task assignment access'}">
          <input type="checkbox" class="delegate-toggle" data-member="${escHtml(m.name)}" ${isGranted ? 'checked' : ''} />
          <span class="toggle-track">
            <span class="toggle-thumb"></span>
          </span>
        </label>
      </div>`;
  }).join('');

  // Wire up toggles (re-bind every render)
  list.querySelectorAll('.delegate-toggle').forEach(toggle => {
    toggle.addEventListener('change', () => {
      const memberName = toggle.dataset.member;
      const p = loadPerms();
      let g = p.taskAssignment || [];

      if (toggle.checked) {
        if (!g.includes(memberName)) g.push(memberName);
        showToast('success', `✓ Task assignment access granted to ${memberName}`);
        addActivity('broadcast', `<strong>Captain</strong> granted task assignment access to <strong>${memberName}</strong>`);
      } else {
        g = g.filter(n => n !== memberName);
        showToast('info', `Access revoked for ${memberName}`);
        addActivity('broadcast', `<strong>Captain</strong> revoked task assignment access from <strong>${memberName}</strong>`);
      }

      p.taskAssignment = g;
      savePerms(p);
      saveState();
      renderDelegatePanel();       // refresh badges
      renderActivityFull();
      updateActivityBadge();
    });
  });
}

// ── Render All ──
function renderAll() {
  renderDashboard();
  renderTasks();
  renderFeed();
  renderTeam();
  renderCaptainMessages();
  renderActivityFull();
  updateActivityBadge();
  renderMemberTasks();
  renderDelegatePanel();
}

// ── Init ──
applyRoleUI();
populateSelects();
renderAll();

// Set min date for deadline to today
const today = new Date().toISOString().split('T')[0];
document.getElementById('task-deadline').setAttribute('min', today);
