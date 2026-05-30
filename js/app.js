// ── STORAGE HELPERS ──────────────────────────────
const S = {
  get: (k, d = null) => { try { const v = localStorage.getItem('hr_' + k); return v !== null ? JSON.parse(v) : d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem('hr_' + k, JSON.stringify(v)); } catch {} }
};

// ── STATE ─────────────────────────────────────────
let theme = S.get('theme', 'dark');
let selEnergy = S.get('le', null);
let selArea = S.get('la', null);
let prefs = S.get('prefs', {
  name: '',
  useWeather: true,
  useTime: true,
  remindEnabled: false,
  remindTime: '08:00',
  defEnergy: null,
  defArea: null
});
let weatherData = null;
let currentTab = 'home';

// ── AREA SVG ICONS ─────────────────────────────────
const AREA_ICONS = {
  health: `<svg viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`,
  work: `<svg viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  learning: `<svg viewBox="0 0 24 24" fill="none"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`,
  relationships: `<svg viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="1.8"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  mindfulness: `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><line x1="9" y1="9" x2="9.01" y2="9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><line x1="15" y1="9" x2="15.01" y2="9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  creativity: `<svg viewBox="0 0 24 24" fill="none"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`,
};

// ── DEFAULT AREAS ─────────────────────────────────
const DEFAULT_AREAS = [
  { id: 'health',        label: 'Health',   icon: AREA_ICONS.health,        context: 'Physical health, fitness, exercise, nutrition and body care.' },
  { id: 'work',          label: 'Work',     icon: AREA_ICONS.work,          context: 'Professional tasks, productivity, career growth and deadlines.' },
  { id: 'learning',      label: 'Learning', icon: AREA_ICONS.learning,      context: 'Studying, reading, skill building and personal development.' },
  { id: 'relationships', label: 'Social',   icon: AREA_ICONS.relationships, context: 'Friends, family, communication and social connections.' },
  { id: 'mindfulness',   label: 'Mind',     icon: AREA_ICONS.mindfulness,   context: 'Mental health, meditation, stress relief and emotional wellbeing.' },
  { id: 'creativity',    label: 'Create',   icon: AREA_ICONS.creativity,    context: 'Creative projects, art, writing, music and self-expression.' },
];
let customAreas = S.get('customAreas', []);

// ── ICON OPTIONS (for custom area picker) ─────────
const ICON_OPTIONS = [
  `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none"><path d="M9 21h6M12 3a6 6 0 0 1 6 6c0 2.22-1.21 4.16-3 5.2V17a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-2.8A6 6 0 0 1 6 9a6 6 0 0 1 6-6z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 17c0 1.66-1.34 3-3 3s-3-1.34-3-3c0-1.07.57-2.01 1.41-2.53M16 5c.5 2-1 4-3 4-1.5 0-2.5-1-2.5-2.5 0-1 .5-1.5 1-2-2 0-4 3-4 6.5 0 4.5 3.5 7.5 6.5 7.5 3.5 0 7-2.5 7-7 0-3.5-2-5.5-4-6.5z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none"><path d="M17 8C8 10 5.9 16.17 3.82 19.82a1 1 0 0 0 1.6 1.18C7.19 18.89 13 16 19 14c.86-3.01 1-6 0-9-1 .5-1.5 1-2 3z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 22L11 14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none"><path d="M6 9H3.5a2.5 2.5 0 0 0 0 5H6M18 9h2.5a2.5 2.5 0 0 1 0 5H18M6 3h12v10a6 6 0 0 1-6 6v0a6 6 0 0 1-6-6V3zM9 21h6M12 19v2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none"><polyline points="16,18 22,12 16,6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><polyline points="8,6 2,12 8,18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none"><path d="M9 18V5l12-2v13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6" cy="18" r="3" stroke="currentColor" stroke-width="1.8"/><circle cx="18" cy="16" r="3" stroke="currentColor" stroke-width="1.8"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M3 12h18M12 3c-2 2.5-3 5.5-3 9s1 6.5 3 9M12 3c2 2.5 3 5.5 3 9s-1 6.5-3 9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="13" r="4" stroke="currentColor" stroke-width="1.8"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M12 7v5l3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
];

let selectedAreaIcon = ICON_OPTIONS[0];

const QUOTES = [
  "Small steps every day lead to big changes.",
  "You don't have to be great to start, but you have to start to be great.",
  "The secret of getting ahead is getting started.",
  "Progress, not perfection.",
  "Discipline is choosing between what you want now and what you want most.",
  "Do something today that your future self will thank you for.",
  "It's not about having time. It's about making time.",
  "Momentum builds when you show up, even imperfectly.",
  "One focused hour beats three distracted ones.",
  "The best time to start was yesterday. The next best time is now."
];

// ── THEME ──────────────────────────────────────────
function applyTheme() {
  document.documentElement.setAttribute('data-theme', theme);
}
function toggleTheme() {
  theme = theme === 'dark' ? 'light' : 'dark';
  S.set('theme', theme);
  applyTheme();
}

// ── CLOCK ──────────────────────────────────────────
function updateClock() {
  const now = new Date();
  let h = now.getHours(), m = now.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  document.getElementById('clk').textContent = `${h}:${String(m).padStart(2, '0')}`;
  document.getElementById('clk-ampm').textContent = ampm;

  const greetings = [
    { range: [5, 12], text: 'Good morning' },
    { range: [12, 17], text: 'Good afternoon' },
    { range: [17, 21], text: 'Good evening' },
    { range: [21, 24], text: 'Good night' },
    { range: [0, 5], text: 'Still up?' }
  ];
  const hr = now.getHours();
  const g = greetings.find(g => hr >= g.range[0] && hr < g.range[1]) || greetings[3];
  document.getElementById('g-txt').textContent = g.text;
}

// ── WEATHER ────────────────────────────────────────
function fetchWeather() {
  if (!prefs.useWeather) return;
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude: lat, longitude: lon } = pos.coords;
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m&temperature_unit=celsius&windspeed_unit=ms`)
      .then(r => r.json())
      .then(d => {
        const w = d.current_weather;
        weatherData = { temp: Math.round(w.temperature), code: w.weathercode, wind: Math.round(w.windspeed) };
        const icons = { 0: '☀', 1: '🌤', 2: '⛅', 3: '☁', 45: '🌫', 61: '🌧', 63: '🌧', 80: '🌦', 95: '⛈' };
        const icon = icons[w.weathercode] || '—';
        document.getElementById('wx-icon-txt').textContent = icon;
        document.getElementById('wx-temp').textContent = `${weatherData.temp}°`;
        updateSummaryCard();
      }).catch(() => {});
  }, () => {});
}

// ── TAB ROUTING ────────────────────────────────────
function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

  if (tab === 'home') { renderAreas(); updateSummaryCard(); }
  if (tab === 'habits') renderHabits();
  if (tab === 'profile') renderProfile();
}

// ── ENERGY ────────────────────────────────────────
function setEnergy(e) {
  selEnergy = e;
  S.set('le', e);
  document.querySelectorAll('.e-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.e === e);
  });
  updateGoBtn();
}

// ── AREAS ─────────────────────────────────────────
function getAllAreas() {
  return [...DEFAULT_AREAS, ...customAreas];
}

function renderAreas() {
  const grid = document.getElementById('area-grid');
  const all = getAllAreas();
  grid.innerHTML = all.map(a => `
    <div class="area-card ${selArea === a.id ? 'active' : ''}" onclick="pickArea('${a.id}')">
      ${a.neglected ? '<div class="area-neglected-dot"></div>' : ''}
      <div class="area-icon">${a.icon}</div>
      <div class="area-label">${a.label}</div>
    </div>
  `).join('');
}

function pickArea(id) {
  selArea = id;
  S.set('la', id);
  renderAreas();
  updateGoBtn();
}

function updateGoBtn() {
  const btn = document.getElementById('go-btn');
  const txt = document.getElementById('go-btn-txt');
  if (!selEnergy) { txt.textContent = 'Pick your energy first'; btn.disabled = true; }
  else if (!selArea) { txt.textContent = 'Pick a neglected area'; btn.disabled = true; }
  else { txt.textContent = 'Get my action'; btn.disabled = false; }
}

// ── ADD AREA MODAL ─────────────────────────────────
function openAddArea() {
  document.getElementById('area-name-in').value = '';
  document.getElementById('area-context-in').value = '';
  selectedAreaIcon = ICON_OPTIONS[0];
  const grid = document.getElementById('emoji-grid');
  grid.innerHTML = ICON_OPTIONS.map((svg, idx) =>
    `<div class="emoji-opt ${idx === 0 ? 'active' : ''}" onclick="pickEmoji(${idx})">${svg}</div>`
  ).join('');
  openModal('add-area-modal');
}

function pickEmoji(idx) {
  selectedAreaIcon = ICON_OPTIONS[idx];
  document.querySelectorAll('.emoji-opt').forEach((el, i) => {
    el.classList.toggle('active', i === idx);
  });
}

function saveArea() {
  const name = document.getElementById('area-name-in').value.trim();
  const ctx = document.getElementById('area-context-in').value.trim();
  if (!name) { alert('Please enter an area name.'); return; }
  if (!ctx) { alert('Please add context so the AI can give you relevant recommendations.'); return; }
  const id = 'custom_' + Date.now();
  customAreas.push({ id, label: name, icon: selectedAreaIcon, context: ctx });
  S.set('customAreas', customAreas);
  closeModal('add-area-modal');
  renderAreas();
}

// ── MODAL HELPERS ──────────────────────────────────
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

// ── QUOTE ─────────────────────────────────────────
let quoteIdx = 0;
function showQuote() {
  quoteIdx = Math.floor(Math.random() * QUOTES.length);
  document.getElementById('quote-txt').textContent = QUOTES[quoteIdx];
}

// ── SUMMARY CARD (Phase 4) ────────────────────────
function updateSummaryCard() {
  const habits = S.get('habits', []);
  const today = new Date().toISOString().slice(0, 10);
  const done = habits.filter(h => h.log && h.log.includes(today)).length;
  const bestStreak = habits.reduce((m, h) => Math.max(m, getBestStreak(h.log || [])), 0);

  document.getElementById('sum-done').textContent = done;
  document.getElementById('sum-streak').textContent = bestStreak;
  document.getElementById('sum-habits').textContent = habits.length;
}

function getBestStreak(log) {
  if (!log || !log.length) return 0;
  const sorted = [...new Set(log)].sort();
  let best = 1, cur = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]), curr = new Date(sorted[i]);
    const diff = (curr - prev) / 86400000;
    if (diff === 1) { cur++; best = Math.max(best, cur); }
    else cur = 1;
  }
  return best;
}

// ── INTENTION (Phase 4) ───────────────────────────
function saveIntention() {
  const val = document.getElementById('intention-input').value.trim();
  if (!val) return;
  const today = new Date().toISOString().slice(0, 10);
  const intentions = S.get('intentions', {});
  intentions[today] = val;
  S.set('intentions', intentions);
  document.getElementById('intention-input').value = '';
  document.getElementById('intention-input').placeholder = val;
}

function loadIntention() {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const intentions = S.get('intentions', {});
  const todayVal = intentions[today];
  const yestVal = intentions[yesterday];

  if (todayVal) {
    document.getElementById('intention-input').value = todayVal;
  }
  const yestEl = document.getElementById('intention-yesterday');
  if (yestVal) {
    yestEl.textContent = `Yesterday: "${yestVal}"`;
    yestEl.style.display = 'block';
  }
}

// ── ONBOARDING ─────────────────────────────────────
let obSlide = 0;
function obNext() {
  if (obSlide < 2) {
    document.getElementById(`ob-${obSlide}`).classList.remove('active');
    document.getElementById(`odd-${obSlide}`).classList.remove('active');
    obSlide++;
    document.getElementById(`ob-${obSlide}`).classList.add('active');
    document.getElementById(`odd-${obSlide}`).classList.add('active');
    if (obSlide === 2) document.getElementById('ob-next-btn').textContent = "Let's go";
  } else {
    obDone();
  }
}
function obDone() {
  S.set('onboarded', true);
  document.getElementById('onboard-wrap').style.display = 'none';
}

// ── INIT ──────────────────────────────────────────
(function init() {
  applyTheme();
  updateClock();
  setInterval(updateClock, 30000);
  setInterval(showQuote, 60000);
  showQuote();
  fetchWeather();

  const name = S.get('prefs', {}).name || 'Rabbit';
  const nameEl = document.getElementById('h-name-disp');
  if (nameEl) nameEl.textContent = name || 'Rabbit';

  const le = selEnergy || prefs.defEnergy;
  const la = selArea || prefs.defArea;
  if (le) setEnergy(le);
  renderAreas();
  if (la) pickArea(la);
  updateGoBtn();
  updateSummaryCard();
  loadIntention();

  if (!S.get('onboarded', false)) {
    document.getElementById('onboard-wrap').style.display = 'flex';
  } else {
    document.getElementById('onboard-wrap').style.display = 'none';
  }
})();
