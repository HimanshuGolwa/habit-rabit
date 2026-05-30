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

// ── PROMPT ────────────────────────────────────────
function buildPrompt() {
  const now = new Date();
  const hour = now.getHours();
  const timeLabel = hour < 6 ? `late night (~${hour}am)` :
    hour < 12 ? `morning (~${hour}am)` :
    hour < 17 ? `afternoon (~${hour}pm)` :
    hour < 21 ? `evening (~${hour - 12}pm)` :
    `night (~${hour - 12}pm)`;

  let timeContext = '';
  if (hour >= 21 || hour < 5) {
    timeContext = 'It is late night. ONLY recommend sleep prep, breathing, journaling, gentle stretching. NO intense work or exercise.';
  } else if (hour >= 5 && hour < 8) {
    timeContext = 'It is early morning. Recommend energizing, grounding activities.';
  } else if (hour >= 12 && hour < 14) {
    timeContext = 'It is midday — consider a proper break or short walk.';
  }

  let wxContext = '';
  if (weatherData) {
    const { temp, code } = weatherData;
    if (code >= 51 && code <= 99) wxContext = 'Raining outside — prefer indoor activities.';
    else if (temp > 30) wxContext = 'Very hot outside — avoid intense outdoor exercise.';
    else if (temp < 5) wxContext = 'Cold outside — lean toward indoor alternatives.';
    if (wxContext) wxContext += ` Temperature: ${temp}°C.`;
  }

  const area = getAllAreas().find(a => a.id === selArea);
  const areaContext = area ? `Neglected area: ${area.label}. Context: ${area.context}` : `Area: ${selArea}`;

  const energyDesc = {
    depleted: 'completely drained — recommend only the most gentle 5-minute micro-action',
    low: 'low energy — easy wins under 15 minutes',
    medium: 'moderate energy — focused 20–30 minute effort',
    high: 'high energy — ambitious 30–60 minute challenge'
  };

  return `You are a personal action coach. Give ONE main recommendation plus THREE distinct alternatives.

User state:
- Energy: ${selEnergy} (${energyDesc[selEnergy] || selEnergy})
- Time: ${timeLabel}
- ${areaContext}
${timeContext ? `- Constraint: ${timeContext}` : ''}
${wxContext ? `- Weather: ${wxContext}` : ''}

Rules:
1. Main rec: specific, doable NOW, under 60 words, warm/conversational, MUST include a duration ("for X minutes")
2. 3 alternatives: each different from the main and from each other, varying durations
3. For depleted energy: max 5 min, ultra-gentle only
4. For low energy: max 15 min
5. No bullet points — flowing text for main and alt texts
6. No intense exercise late at night

Return ONLY a valid JSON object — no markdown, no backticks, no explanation:
{
  "main": {
    "text": "full recommendation text with duration mentioned",
    "minutes": <integer>
  },
  "alternatives": [
    {"label": "3-5 word title", "text": "full alternative text (under 50 words) with duration", "minutes": <integer>},
    {"label": "3-5 word title", "text": "full alternative text (under 50 words) with duration", "minutes": <integer>},
    {"label": "3-5 word title", "text": "full alternative text (under 50 words) with duration", "minutes": <integer>}
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
        max_tokens: 1200,
        messages: [{ role: 'user', content: buildPrompt() }]
      })
    });

    const data = await response.json();
    const rawText = (data.content?.[0]?.text || '').trim();

    let parsed;
    try {
      // Strip markdown fences if the model wraps with ```json
      const clean = rawText.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
      parsed = JSON.parse(clean);
    } catch {
      // Fallback: treat entire text as the main recommendation
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
    const fallback = getFallback();
    recBody.textContent = fallback;
    applyTimerValues(ENERGY_DEFAULTS[selEnergy] || 25);
    actionBar.style.display = 'flex';
    console.error('AI error:', err);
  }
}

// ── APPLY TIMER VALUES ────────────────────────────
function applyTimerValues(mins) {
  document.getElementById('rec-time-txt').textContent = formatMins(mins);
  document.getElementById('timer-start-btn').dataset.mins = mins;
  // Sync preset highlights
  document.querySelectorAll('.preset-btn').forEach(b => {
    b.classList.toggle('active', parseInt(b.dataset.m) === mins);
  });
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

  // Close presets if open
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
  // Don't auto-close so user can see what they picked
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
