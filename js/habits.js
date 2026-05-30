// ── HABITS ────────────────────────────────────────
let habits = S.get('habits', []);
let detailHabitId = null;
let currentDetailTab = 'month';
let selectedHabitArea = null;

function saveHabits() { S.set('habits', habits); }

// ── RENDER HABIT LIST ──────────────────────────────
function renderHabits() {
  const el = document.getElementById('habit-list');
  if (!habits.length) {
    el.innerHTML = '<div style="text-align:center;color:var(--t3);padding:48px 0;font-size:14px;">No habits yet. Add your first one.</div>';
    return;
  }

  const today = new Date();
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(d.getDate() - 6 + i);
    return d.toISOString().slice(0, 10);
  });
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const todayStr = today.toISOString().slice(0, 10);

  el.innerHTML = habits.map(h => {
    const streak = getCurrentStreak(h.log || []);
    const area = h.areaId ? getAllAreas().find(a => a.id === h.areaId) : null;
    return `
    <div class="habit-card" id="hcard-${h.id}">
      <div class="habit-card-top" onclick="openHabitDetail('${h.id}')">
        <div>
          <div class="habit-name">${h.icon || ''} ${h.name}</div>
          ${area ? `<div class="habit-area-badge"><span class="hab-area-icon">${area.icon}</span>${area.label}</div>` : ''}
        </div>
        ${streak > 1 ? `<div class="habit-streak">${streak} day streak</div>` : ''}
      </div>
      <div class="habit-week">
        ${week.map((d, i) => `
          <div class="week-dot ${(h.log || []).includes(d) ? 'done' : ''}"
               onclick="event.stopPropagation();toggleDay('${h.id}','${d}')"
               title="${d}">${dayLabels[i]}</div>
        `).join('')}
      </div>
      <div class="habit-actions">
        <button class="h-action-btn done-btn"
          onclick="event.stopPropagation();toggleDay('${h.id}','${todayStr}')">
          ${(h.log || []).includes(todayStr) ? '✓ Done today' : 'Mark done'}
        </button>
        <button class="h-action-btn"
          onclick="event.stopPropagation();openHabitDetail('${h.id}')">
          Details
        </button>
        <button class="h-action-btn del-btn"
          onclick="event.stopPropagation();deleteHabit('${h.id}')">
          Delete
        </button>
      </div>
    </div>`;
  }).join('');
}

// ── STREAK HELPERS ─────────────────────────────────
function getCurrentStreak(log) {
  if (!log || !log.length) return 0;
  const sorted = [...new Set(log)].sort().reverse();
  const today = new Date().toISOString().slice(0, 10);
  if (sorted[0] !== today) return 0;
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]), curr = new Date(sorted[i]);
    if ((prev - curr) / 86400000 === 1) streak++;
    else break;
  }
  return streak;
}

function getBestStreakForHabit(log) {
  return getBestStreak(log || []);
}

// ── TOGGLE DAY ────────────────────────────────────
function toggleDay(id, date) {
  const h = habits.find(h => h.id === id);
  if (!h) return;
  h.log = h.log || [];
  if (h.log.includes(date)) h.log = h.log.filter(d => d !== date);
  else h.log.push(date);
  saveHabits();
  renderHabits();
  updateSummaryCard();
  if (detailHabitId === id) renderDetailBody();
}

// ── DELETE HABIT ──────────────────────────────────
function deleteHabit(id) {
  if (!confirm('Delete this habit?')) return;
  habits = habits.filter(h => h.id !== id);
  saveHabits();
  renderHabits();
  updateSummaryCard();
}

// ── ADD HABIT ─────────────────────────────────────
function openAddHabit() {
  document.getElementById('habit-name-in').value = '';
  document.getElementById('habit-emoji-in').value = '';
  selectedHabitArea = null;

  // Render area pills
  const scroll = document.getElementById('habit-area-scroll');
  const areas = getAllAreas();
  scroll.innerHTML = areas.map(a => `
    <button class="habit-area-pill" data-aid="${a.id}" onclick="pickHabitArea('${a.id}')">
      <span class="hab-area-icon">${a.icon}</span>
      ${a.label}
    </button>
  `).join('');

  openModal('add-habit-modal');
}

function pickHabitArea(id) {
  selectedHabitArea = selectedHabitArea === id ? null : id;
  document.querySelectorAll('.habit-area-pill').forEach(p => {
    p.classList.toggle('active', p.dataset.aid === selectedHabitArea);
  });
}

function saveHabit() {
  const name = document.getElementById('habit-name-in').value.trim();
  if (!name) { alert('Please enter a habit name.'); return; }
  const icon = document.getElementById('habit-emoji-in').value.trim() || '';
  habits.push({
    id: 'h_' + Date.now(),
    name,
    icon,
    areaId: selectedHabitArea || null,
    log: []
  });
  saveHabits();
  closeModal('add-habit-modal');
  renderHabits();
  updateSummaryCard();
}

// ── HABIT DETAIL SHEET ────────────────────────────
function openHabitDetail(id) {
  detailHabitId = id;
  currentDetailTab = 'month';
  const h = habits.find(h => h.id === id);
  if (!h) return;

  document.getElementById('detail-title').textContent = `${h.icon || ''} ${h.name}`;

  const log = h.log || [];
  const cur = getCurrentStreak(log);
  const best = getBestStreakForHabit(log);
  const thisMonth = log.filter(d => d.startsWith(new Date().toISOString().slice(0, 7))).length;
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const rate = Math.round((thisMonth / daysInMonth) * 100);

  document.getElementById('detail-stats').innerHTML = `
    <div class="dstat"><div class="dstat-val">${cur}</div><div class="dstat-lbl">Current streak</div></div>
    <div class="dstat"><div class="dstat-val">${best}</div><div class="dstat-lbl">Best streak</div></div>
    <div class="dstat"><div class="dstat-val">${thisMonth}</div><div class="dstat-lbl">This month</div></div>
    <div class="dstat"><div class="dstat-val">${rate}%</div><div class="dstat-lbl">Completion</div></div>
  `;

  document.querySelectorAll('.dtab').forEach(t => t.classList.toggle('active', t.dataset.dtab === 'month'));
  renderDetailBody();
  openModal('habit-detail-modal');
}

function switchDetailTab(tab) {
  currentDetailTab = tab;
  document.querySelectorAll('.dtab').forEach(t => t.classList.toggle('active', t.dataset.dtab === tab));
  renderDetailBody();
}

function renderDetailBody() {
  const h = habits.find(h => h.id === detailHabitId);
  if (!h) return;
  const body = document.getElementById('detail-body');
  const log = h.log || [];

  if (currentDetailTab === 'month') body.innerHTML = renderMonthCal(log);
  else if (currentDetailTab === 'year') body.innerHTML = renderYearGrid(log);
  else body.innerHTML = renderNotes(h);
}

// ── MONTH CALENDAR ────────────────────────────────
function renderMonthCal(log) {
  const now = new Date();
  const year = now.getFullYear(), month = now.getMonth();
  const todayStr = now.toISOString().slice(0, 10);
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = now.toLocaleString('default', { month: 'long' });

  let html = `<div class="cal-month-label">${monthName} ${year}</div>`;
  html += '<div class="cal-header-row">';
  ['S','M','T','W','T','F','S'].forEach(d => {
    html += `<div class="cal-header-cell">${d}</div>`;
  });
  html += '</div><div class="cal-grid">';
  for (let i = 0; i < firstDay; i++) html += '<div class="cal-cell"></div>';
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const done = log.includes(ds);
    const today = ds === todayStr;
    html += `<div class="cal-cell ${done ? 'done' : ''} ${today ? 'today' : ''}">${d}</div>`;
  }
  return html + '</div>';
}

// ── YEAR GRID ─────────────────────────────────────
function renderYearGrid(log) {
  const today = new Date();
  const cells = [];
  for (let i = 363; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const ds = d.toISOString().slice(0, 10);
    const done = log.includes(ds);
    cells.push(`<div class="year-cell ${done ? 'done' : ''}" title="${ds}"></div>`);
  }
  return `<div class="year-grid">${cells.join('')}</div>`;
}

// ── NOTES ─────────────────────────────────────────
function renderNotes(h) {
  const notes = S.get('notes_' + h.id, []);
  const todayStr = new Date().toISOString().slice(0, 10);

  const energyBadge = (e) => {
    if (!e) return '';
    return `<span class="energy-badge energy-${e}">${e}</span>`;
  };

  const formatNoteDate = (ts) => {
    const d = new Date(ts);
    const ds = d.toISOString().slice(0, 10);
    if (ds === todayStr) return 'Today';
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (ds === yesterday) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const noteItems = [...notes].reverse().map(n => `
    <div class="note-item">
      <div class="note-meta">
        <span class="note-date">${formatNoteDate(n.ts)}</span>
        ${energyBadge(n.energy)}
      </div>
      <div class="note-text">${n.text}</div>
    </div>
  `).join('');

  // Show current energy label in the input row
  const curEnergy = typeof selEnergy !== 'undefined' && selEnergy
    ? `<span class="note-energy-tag energy-${selEnergy}">Logging as: ${selEnergy}</span>`
    : '';

  return `
    <div class="note-add-row">
      <div class="note-input-wrap">
        ${curEnergy}
        <div style="display:flex;gap:8px;align-items:center;">
          <input class="note-input" id="note-in-${h.id}" type="text" placeholder="Add a note for today…" maxlength="200"/>
          <button class="note-save-btn" onclick="saveNote('${h.id}')">Save</button>
        </div>
      </div>
    </div>
    ${noteItems || '<div class="notes-empty">No notes yet. Add one above.</div>'}
  `;
}

function saveNote(id) {
  const input = document.getElementById('note-in-' + id);
  const text = input.value.trim();
  if (!text) return;
  const notes = S.get('notes_' + id, []);
  const energy = typeof selEnergy !== 'undefined' ? selEnergy : null;
  notes.push({ ts: Date.now(), text, energy });
  S.set('notes_' + id, notes);
  input.value = '';
  renderDetailBody();
}
