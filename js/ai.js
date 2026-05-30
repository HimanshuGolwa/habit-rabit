// ── RECOMMENDATIONS ──────────────────────────────────────────────────────────
// Primary engine: local pool of 500 context-aware recommendations (rec-pool.js)
// Next phase: replace getLocalRec() with a live Claude API call,
//             keeping applyTimerValues(), renderAlternatives(), selectAlt() as-is.

const ENERGY_DEFAULTS = { depleted: 5, low: 10, medium: 25, high: 45 };
let currentAlts = [];

// ── FORMAT HELPERS ────────────────────────────────────────────────────────────
function formatMins(mins) {
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h} hr`;
  }
  return `${mins} min`;
}

// ── TIME SLOT ─────────────────────────────────────────────────────────────────
function getTimeSlot(hour) {
  if (hour >= 22 || hour < 5) return 'LN';
  if (hour < 8)               return 'EM';
  if (hour < 12)              return 'MO';
  if (hour < 14)              return 'MD';
  if (hour < 17)              return 'AF';
  if (hour < 20)              return 'EV';
  return 'NI';
}

// ── WEATHER CONDITION ─────────────────────────────────────────────────────────
function getWeatherCond() {
  if (!weatherData) return 'any';
  const { temp, code } = weatherData;
  if (code >= 51) return 'in';
  if (temp > 30)  return 'in';
  if (temp < 5)   return 'in';
  return 'out';
}

// ── SMART PRESET LOGIC ────────────────────────────────────────────────────────
const SNAP_POINTS = [1, 2, 3, 5, 7, 10, 12, 15, 20, 25, 30, 40, 45, 50, 60, 75, 90, 120];

function snapToNice(n) {
  return SNAP_POINTS.reduce((a, b) => Math.abs(b - n) < Math.abs(a - n) ? b : a);
}

function getSmartPresets(recMins) {
  let lower  = snapToNice(Math.max(1, Math.round(recMins * 0.5)));
  let higher = snapToNice(Math.round(recMins * 1.8));
  if (lower  === recMins) lower  = snapToNice(recMins * 0.4);
  if (higher === recMins) higher = snapToNice(recMins * 2.2);
  if (lower  === recMins) lower  = Math.max(1, recMins - 5);
  if (higher === recMins) higher = recMins + 10;
  return [lower, recMins, higher];
}

function buildTimerPresets(recMins) {
  const row = document.getElementById('preset-row');
  if (!row) return;
  const [lower, exact, higher] = getSmartPresets(recMins);
  row.innerHTML = [
    { m: lower,  label: formatMins(lower),  tag: 'Shorter',     isRec: false },
    { m: exact,  label: formatMins(exact),  tag: 'Recommended', isRec: true  },
    { m: higher, label: formatMins(higher), tag: 'Longer',      isRec: false },
  ].map(p => `
    <button class="preset-btn ${p.isRec ? 'preset-rec' : ''}"
            data-m="${p.m}" onclick="setPresetTimer(${p.m})">
      <span class="preset-time">${p.label}</span>
      <span class="preset-tag">${p.tag}</span>
    </button>
  `).join('');
}

// ── APPLY TIMER VALUES ────────────────────────────────────────────────────────
function applyTimerValues(mins) {
  document.getElementById('rec-time-txt').textContent = formatMins(mins);
  document.getElementById('timer-start-btn').dataset.mins = mins;
  buildTimerPresets(mins);
  document.querySelectorAll('.preset-btn').forEach(b => {
    b.classList.toggle('active', parseInt(b.dataset.m) === mins);
  });
}

// ── LOCAL REC SELECTION ───────────────────────────────────────────────────────
// Progressive relaxation: start from the most specific match and widen until we
// have enough variety (>= MIN_POOL). The order of relaxation differs by time of
// day — at night, time-of-day is safety-critical (never suggest a midnight
// workout), so we drop the AREA before the TIME. During the day, the user's
// chosen area matters more, so we drop the TIME before the AREA.
const MIN_POOL = 4;

function getLocalRec() {
  const hour = new Date().getHours();
  const slot = getTimeSlot(hour);
  const wx   = getWeatherCond();
  const timeIsCritical = (slot === 'LN' || slot === 'NI'); // late night / night

  const f = (fn) => REC_POOL.filter(fn);

  // Candidate pools, most-specific first
  const exact   = f(r => r.e === selEnergy && r.a === selArea && r.t.includes(slot) && (r.w === 'any' || r.w === wx));
  const noWx    = f(r => r.e === selEnergy && r.a === selArea && r.t.includes(slot));
  const byTime  = f(r => r.e === selEnergy && r.t.includes(slot));   // any area, KEEP time
  const byArea  = f(r => r.e === selEnergy && r.a === selArea);      // any time, KEEP area
  const byEnergy= f(r => r.e === selEnergy);

  // Order the fallback chain based on what matters most right now
  const chain = timeIsCritical
    ? [exact, noWx, byTime, byEnergy]   // night: protect time-of-day
    : [exact, noWx, byArea, byEnergy];  // day: protect chosen area

  let pool = chain.find(p => p.length >= MIN_POOL)
          || chain.reverse().find(p => p.length > 0)
          || REC_POOL;

  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const main     = shuffled[0];
  const alts     = shuffled.slice(1, 4);

  return {
    main:         { text: main.text, minutes: main.mins },
    alternatives: alts.map(r => ({ label: r.label, text: r.text, minutes: r.mins })),
  };
}

// ── MAIN REC FLOW ─────────────────────────────────────────────────────────────
async function getAIRec() {
  if (!selEnergy || !selArea) return;

  const recCard   = document.getElementById('rec-card');
  const recBody   = document.getElementById('rec-body');
  const actionBar = document.getElementById('rec-action-bar');
  const altsEl    = document.getElementById('rec-alts');
  const presets   = document.getElementById('timer-presets');

  recCard.style.display = 'block';
  recBody.innerHTML =
    '<div class="loading-shimmer" style="width:88%;margin-bottom:8px"></div>' +
    '<div class="loading-shimmer" style="width:68%;margin-bottom:8px"></div>' +
    '<div class="loading-shimmer" style="width:52%"></div>';
  actionBar.style.display = 'none';
  altsEl.style.display    = 'none';
  presets.style.display   = 'none';
  currentAlts             = [];

  await new Promise(r => setTimeout(r, 350)); // shimmer feels intentional

  const result = getLocalRec();
  recBody.textContent = result.main.text;
  applyTimerValues(result.main.minutes);
  actionBar.style.display = 'flex';

  currentAlts = result.alternatives;
  renderAlternatives();
}

// ── ALTERNATIVES ──────────────────────────────────────────────────────────────
function renderAlternatives() {
  const altsEl   = document.getElementById('rec-alts');
  const altsList = document.getElementById('rec-alts-list');
  if (!currentAlts.length) { altsEl.style.display = 'none'; return; }

  altsList.innerHTML = currentAlts.map((alt, idx) => `
    <div class="rec-alt-card" id="rec-alt-${idx}" onclick="selectAlt(${idx})">
      <div class="alt-card-label">${alt.label}</div>
      <div class="alt-card-time">${formatMins(alt.minutes)}</div>
    </div>
  `).join('');
  altsEl.style.display = 'block';
}

function selectAlt(idx) {
  const alt = currentAlts[idx];
  if (!alt) return;
  document.getElementById('rec-body').textContent = alt.text;
  applyTimerValues(alt.minutes);
  document.querySelectorAll('.rec-alt-card').forEach((el, i) => {
    el.classList.toggle('active', i === idx);
  });
  document.getElementById('timer-presets').style.display = 'none';
}

// ── TIMER EDIT ────────────────────────────────────────────────────────────────
function toggleTimerEdit() {
  const p = document.getElementById('timer-presets');
  p.style.display = p.style.display === 'none' ? 'flex' : 'none';
}

function setPresetTimer(mins) {
  applyTimerValues(mins);
  document.getElementById('custom-mins-in').value = '';
}

function setCustomTimer() {
  const val = parseInt(document.getElementById('custom-mins-in').value);
  if (val >= 1 && val <= 180) {
    applyTimerValues(val);
    document.getElementById('timer-presets').style.display = 'none';
  }
}
