// ── AI RECOMMENDATIONS ───────────────────────────
const API_URL = 'https://api.anthropic.com/v1/messages';
const ENERGY_DEFAULTS = { depleted: 5, low: 10, medium: 25, high: 45 };

let currentAlts = [];

// ── FORMAT HELPERS ────────────────────────────────
function formatMins(mins) {
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h} hr`;
  }
  return `${mins} min`;
}

// ── SMART PRESET LOGIC ────────────────────────────
const SNAP_POINTS = [1, 2, 3, 5, 7, 10, 12, 15, 20, 25, 30, 40, 45, 50, 60, 75, 90, 120];

function snapToNice(n) {
  return SNAP_POINTS.reduce((a, b) => Math.abs(b - n) < Math.abs(a - n) ? b : a);
}

function getSmartPresets(recMins) {
  let lower = snapToNice(Math.max(1, Math.round(recMins * 0.5)));
  let higher = snapToNice(Math.round(recMins * 1.8));

  // Ensure no collision with the rec time
  if (lower === recMins) lower = snapToNice(recMins * 0.4);
  if (higher === recMins) higher = snapToNice(recMins * 2.2);
  // Last resort: simple arithmetic offsets
  if (lower === recMins) lower = Math.max(1, recMins - 5);
  if (higher === recMins) higher = recMins + 10;

  return [lower, recMins, higher];
}

function buildTimerPresets(recMins) {
  const row = document.getElementById('preset-row');
  if (!row) return;
  const [lower, exact, higher] = getSmartPresets(recMins);

  row.innerHTML = [
    { m: lower,  label: formatMins(lower),  tag: 'Shorter',       isRec: false },
    { m: exact,  label: formatMins(exact),  tag: 'Recommended',   isRec: true  },
    { m: higher, label: formatMins(higher), tag: 'Longer',        isRec: false },
  ].map(p => `
    <button class="preset-btn ${p.isRec ? 'preset-rec' : ''}"
            data-m="${p.m}" onclick="setPresetTimer(${p.m})">
      <span class="preset-time">${p.label}</span>
      <span class="preset-tag">${p.tag}</span>
    </button>
  `).join('');
}

// ── APPLY TIMER VALUES ────────────────────────────
function applyTimerValues(mins) {
  document.getElementById('rec-time-txt').textContent = formatMins(mins);
  document.getElementById('timer-start-btn').dataset.mins = mins;
  buildTimerPresets(mins);
  // Highlight the active preset button
  document.querySelectorAll('.preset-btn').forEach(b => {
    b.classList.toggle('active', parseInt(b.dataset.m) === mins);
  });
}

// ── RICH CONTEXT BUILDER ──────────────────────────
function buildContext() {
  const now = new Date();
  const hour = now.getHours();
  const day = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][now.getDay()];
  const isWeekend = now.getDay() === 0 || now.getDay() === 6;
  const month = now.getMonth(); // 0-11

  // Precise time-of-day label
  const timeSlot =
    hour < 5  ? 'late night'       :
    hour < 7  ? 'early morning'    :
    hour < 10 ? 'morning'          :
    hour < 12 ? 'mid-morning'      :
    hour < 14 ? 'midday'           :
    hour < 17 ? 'afternoon'        :
    hour < 19 ? 'early evening'    :
    hour < 21 ? 'evening'          : 'night';

  // Time constraint rules
  let timeConstraint = '';
  if (hour >= 22 || hour < 5) {
    timeConstraint = 'VERY LATE — only sleep-prep, breathwork, or journaling. Absolutely no stimulating work or exercise.';
  } else if (hour >= 5 && hour < 7) {
    timeConstraint = 'Early morning window — ideal for movement, meditation, planning, or a nourishing breakfast.';
  } else if (hour >= 12 && hour < 13) {
    timeConstraint = 'Midday break — prioritise a real meal, a short walk, or eyes-off-screen rest before the afternoon.';
  } else if (hour >= 20) {
    timeConstraint = 'Wind-down time — avoid anything that spikes cortisol. Prefer reading, light stretching, or journaling.';
  }

  // Day context
  const dayCtx = isWeekend
    ? `It is ${day} — a weekend. The user may have more unstructured time; personal projects, rest, and social activities fit well.`
    : `It is ${day} — a weekday. Structure, focus blocks, and career/learning tasks resonate more on weekdays.`;

  // Season
  const season = month >= 2 && month <= 4 ? 'spring' :
                 month >= 5 && month <= 7 ? 'summer' :
                 month >= 8 && month <= 10 ? 'autumn' : 'winter';

  // Weather context
  let wxCtx = '';
  if (weatherData) {
    const { temp, code } = weatherData;
    const isRainy  = code >= 51 && code <= 99;
    const isCloudy = code >= 1  && code <= 3;
    const isClear  = code === 0;
    const isHot    = temp > 30;
    const isWarm   = temp >= 18 && temp <= 30;
    const isCool   = temp >= 8  && temp < 18;
    const isCold   = temp < 8;

    if (isRainy)        wxCtx = `Raining outside (${temp}°C). Lean into indoor, cosy activities.`;
    else if (isHot)     wxCtx = `Very hot outside (${temp}°C). Avoid outdoor exertion; hydration matters.`;
    else if (isCold)    wxCtx = `Cold outside (${temp}°C). Warm, indoor activities are more appealing.`;
    else if (isClear && isWarm) wxCtx = `Clear and pleasant (${temp}°C). Outdoor options are genuinely attractive right now.`;
    else if (isCool)    wxCtx = `Cool and ${isCloudy ? 'overcast' : 'clear'} (${temp}°C).`;
    else                wxCtx = `${temp}°C outside.`;
  }

  // Energy descriptions
  const energyDesc = {
    depleted: 'completely drained — micro-actions only (≤5 min), nothing cognitively or physically demanding',
    low:      'low energy — gentle, achievable tasks (5–15 min); wins that cost little but still count',
    medium:   'moderate energy — focused, intentional effort (20–30 min); the user can sustain real concentration',
    high:     'high, sharp energy — ambitious, challenging work (30–60 min); this is a peak window',
  };

  const area = getAllAreas().find(a => a.id === selArea);
  const areaCtx = area
    ? `Neglected area: ${area.label}. Context: ${area.context}`
    : `Area: ${selArea}`;

  return { timeSlot, hour, timeConstraint, dayCtx, season, wxCtx, energyDesc, areaCtx };
}

// ── PROMPT ────────────────────────────────────────
function buildPrompt() {
  const { timeSlot, hour, timeConstraint, dayCtx, season, wxCtx, energyDesc, areaCtx } = buildContext();

  return `You are a sharp, warm personal action coach with a knack for the perfect recommendation at the perfect moment.

User snapshot:
- Energy: ${selEnergy} (${energyDesc[selEnergy] || selEnergy})
- Time: ${timeSlot} (hour ${hour})
- ${dayCtx}
- Season: ${season}
- ${areaCtx}
${timeConstraint ? `- Time rule: ${timeConstraint}` : ''}
${wxCtx ? `- Weather: ${wxCtx}` : ''}

Craft ONE main recommendation + THREE distinct alternatives.

Main recommendation rules:
1. Specific, actionable, doable right now
2. MUST mention a duration ("for X minutes" or "for X hours")
3. Under 65 words, warm and conversational — no jargon or bullet points
4. Respect energy and time constraints strictly
5. Use the weather, day, and season to make it feel alive and contextual

Three alternatives — make them genuinely different:
- alt[0]: a QUICK option — fastest way to make progress (few minutes)
- alt[1]: a DIFFERENT approach — different modality or angle than the main
- alt[2]: a DEEPER option — more time or effort for when the user wants more

Each alt: 3–5 word label + full description (≤50 words) + specific duration.

Return ONLY a valid JSON object — no markdown, no backticks, no commentary:
{
  "main": {
    "text": "full recommendation with duration",
    "minutes": <integer>
  },
  "alternatives": [
    {"label": "3-5 word title", "text": "full alt text with duration (≤50 words)", "minutes": <integer>},
    {"label": "3-5 word title", "text": "full alt text with duration (≤50 words)", "minutes": <integer>},
    {"label": "3-5 word title", "text": "full alt text with duration (≤50 words)", "minutes": <integer>}
  ]
}`;
}

// ── FETCH RECOMMENDATION ──────────────────────────
async function getAIRec() {
  if (!selEnergy || !selArea) return;

  const recCard   = document.getElementById('rec-card');
  const recBody   = document.getElementById('rec-body');
  const actionBar = document.getElementById('rec-action-bar');
  const altsEl    = document.getElementById('rec-alts');
  const presets   = document.getElementById('timer-presets');

  recCard.style.display = 'block';
  recBody.innerHTML = '<div class="loading-shimmer" style="width:88%;margin-bottom:8px"></div><div class="loading-shimmer" style="width:68%;margin-bottom:8px"></div><div class="loading-shimmer" style="width:52%"></div>';
  actionBar.style.display = 'none';
  altsEl.style.display = 'none';
  presets.style.display = 'none';
  currentAlts = [];

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1600,
        messages: [{ role: 'user', content: buildPrompt() }]
      })
    });

    const data = await response.json();
    const rawText = (data.content?.[0]?.text || '').trim();

    let parsed;
    try {
      const clean = rawText.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
      parsed = JSON.parse(clean);
    } catch {
      parsed = {
        main: { text: rawText || getFallback(), minutes: ENERGY_DEFAULTS[selEnergy] || 25 },
        alternatives: []
      };
    }

    const mainText = parsed.main?.text || getFallback();
    const mainMins = parsed.main?.minutes || ENERGY_DEFAULTS[selEnergy] || 25;

    recBody.textContent = mainText;
    applyTimerValues(mainMins);
    actionBar.style.display = 'flex';

    currentAlts = Array.isArray(parsed.alternatives) ? parsed.alternatives : [];
    renderAlternatives();

  } catch (err) {
    recBody.textContent = getFallback();
    applyTimerValues(ENERGY_DEFAULTS[selEnergy] || 25);
    actionBar.style.display = 'flex';
    console.error('AI error:', err);
  }
}

// ── ALTERNATIVES ──────────────────────────────────
function renderAlternatives() {
  const altsEl   = document.getElementById('rec-alts');
  const altsList = document.getElementById('rec-alts-list');
  if (!currentAlts.length) { altsEl.style.display = 'none'; return; }

  altsList.innerHTML = currentAlts.map((alt, idx) => `
    <div class="rec-alt-card" id="rec-alt-${idx}" onclick="selectAlt(${idx})">
      <div class="alt-card-label">${alt.label || 'Alternative'}</div>
      <div class="alt-card-time">${formatMins(alt.minutes || ENERGY_DEFAULTS[selEnergy] || 25)}</div>
    </div>
  `).join('');

  altsEl.style.display = 'block';
}

function selectAlt(idx) {
  const alt = currentAlts[idx];
  if (!alt) return;
  document.getElementById('rec-body').textContent = alt.text || alt.label;
  applyTimerValues(alt.minutes || ENERGY_DEFAULTS[selEnergy] || 25);
  document.querySelectorAll('.rec-alt-card').forEach((el, i) => {
    el.classList.toggle('active', i === idx);
  });
  document.getElementById('timer-presets').style.display = 'none';
}

// ── TIMER EDIT ────────────────────────────────────
function toggleTimerEdit() {
  const presets = document.getElementById('timer-presets');
  presets.style.display = presets.style.display === 'none' ? 'flex' : 'none';
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

// ── FALLBACKS ─────────────────────────────────────
function getFallback() {
  const fb = {
    depleted: 'Take 5 minutes to lie down, close your eyes, and breathe slowly. Your only job right now is to rest.',
    low: 'Spend 10 minutes tidying one small space near you. A clear environment helps clear your head when energy is low.',
    medium: 'Spend 25 minutes on the single most important task in this area. Set a timer, close distractions, and just start.',
    high: 'Channel this energy into 40 minutes of your most ambitious task right now. Push a little further than feels comfortable.'
  };
  return fb[selEnergy] || 'Take 25 minutes and write down the one thing you most want to accomplish today — then start on it.';
}
