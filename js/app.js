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

// Default areas
const DEFAULT_AREAS = [
  { id: 'health', label: 'Health', icon: '🫀', context: 'Physical health, fitness, exercise, nutrition and body care.' },
  { id: 'work', label: 'Work', icon: '💼', context: 'Professional tasks, productivity, career growth and deadlines.' },
  { id: 'learning', label: 'Learning', icon: '📖', context: 'Studying, reading, skill building and personal development.' },
  { id: 'relationships', label: 'Social', icon: '🤝', context: 'Friends, family, communication and social connections.' },
  { id: 'mindfulness', label: 'Mind', icon: '🧘', context: 'Mental health, meditation, stress relief and emotional wellbeing.' },
  { id: 'creativity', label: 'Create', icon: '🎨', context: 'Creative projects, art, writing, music and self-expression.' },
];
let customAreas = S.get('customAreas', []);
let selectedAreaEmoji = '✨';

const EMOJI_OPTIONS = ['✨','🎯','💡','🔥','⚡','🌱','🏆','🧠','💻','🎵','📝','🌍','💪','🛠️','🎮'];

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
        const icons = { 0: '☀️', 1: '🌤', 2: '⛅', 3: '☁️', 45: '🌫', 61: '🌧', 63: '🌧', 80: '🌦', 95: '⛈' };
        const icon = icons[w.weathercode] || '🌡';
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
      <div>${a.label}</div>
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
  if (!selEnergy) { txt.textContent = 'Pick energy level first'; btn.disabled = true; }
  else if (!selArea) { txt.textContent = 'Pick a life area'; btn.disabled = true; }
  else { txt.textContent = 'Get my action'; btn.disabled = false; }
}

// ── ADD AREA MODAL ─────────────────────────────────
function openAddArea() {
  document.getElementById('area-name-in').value = '';
  document.getElementById('area-context-in').value = '';
  selectedAreaEmoji = '✨';
  const grid = document.getElementById('emoji-grid');
  grid.innerHTML = EMOJI_OPTIONS.map(e =>
    `<div class="emoji-opt ${e === selectedAreaEmoji ? 'active' : ''}" onclick="pickEmoji('${e}')">${e}</div>`
  ).join('');
  openModal('add-area-modal');
}

function pickEmoji(e) {
  selectedAreaEmoji = e;
  document.querySelectorAll('.emoji-opt').forEach(el => {
    el.classList.toggle('active', el.textContent === e);
  });
}

function saveArea() {
  const name = document.getElementById('area-name-in').value.trim();
  const ctx = document.getElementById('area-context-in').value.trim();
  if (!name) { alert('Please enter an area name.'); return; }
  if (!ctx) { alert('Please add context so the AI can give you relevant recommendations.'); return; }
  const id = 'custom_' + Date.now();
  customAreas.push({ id, label: name, icon: selectedAreaEmoji, context: ctx });
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

  // Apply name
  const name = S.get('prefs', {}).name || 'Rabbit';
  const nameEl = document.getElementById('h-name-disp');
  if (nameEl) nameEl.textContent = name || 'Rabbit';

  // Restore selections
  const le = selEnergy || prefs.defEnergy;
  const la = selArea || prefs.defArea;
  if (le) setEnergy(le);
  renderAreas();
  if (la) pickArea(la);
  updateGoBtn();
  updateSummaryCard();
  loadIntention();

  // Onboarding
  if (!S.get('onboarded', false)) {
    document.getElementById('onboard-wrap').style.display = 'flex';
  } else {
    document.getElementById('onboard-wrap').style.display = 'none';
  }
})();
