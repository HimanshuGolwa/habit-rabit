// ── AI RECOMMENDATIONS ───────────────────────────
const API_URL = 'https://api.anthropic.com/v1/messages';

// Default timer durations per energy level (in minutes)
const ENERGY_DEFAULTS = { depleted: 5, low: 10, medium: 25, high: 45 };

function buildPrompt() {
  const now = new Date();
  const hour = now.getHours();
  const timeLabel = hour < 6 ? 'late night (~' + hour + 'am)' :
    hour < 12 ? 'morning (~' + hour + 'am)' :
    hour < 17 ? 'afternoon (~' + hour + 'pm)' :
    hour < 21 ? 'evening (~' + (hour - 12) + 'pm)' :
    'night (~' + (hour - 12) + 'pm)';

  let timeContext = '';
  if (hour >= 21 || hour < 5) {
    timeContext = 'It is late night. ONLY recommend sleep prep, breathing exercises, journaling, stretching, or wind-down activities. NO exercise, NO intense work.';
  } else if (hour >= 5 && hour < 8) {
    timeContext = 'It is early morning. Recommend energizing, grounding activities: light exercise, meditation, planning, journaling.';
  } else if (hour >= 12 && hour < 14) {
    timeContext = 'It is midday. Consider a proper break, a short walk, or a nourishing meal before focusing.';
  }

  let wxContext = '';
  if (weatherData) {
    const { temp, code } = weatherData;
    const isRainy = code >= 51 && code <= 99;
    const isHot = temp > 30;
    const isCold = temp < 5;
    if (isRainy) wxContext = 'It is raining outside. Prefer indoor activities.';
    else if (isHot) wxContext = 'It is very hot outside. Avoid intense outdoor exercise.';
    else if (isCold) wxContext = 'It is cold outside. Lean toward indoor alternatives.';
    wxContext += ` Temperature is ${temp}°C.`;
  }

  const area = getAllAreas().find(a => a.id === selArea);
  const areaContext = area ? `Neglected area: ${area.label}. Context: ${area.context}` : `Area: ${selArea}`;

  const energyDesc = {
    depleted: 'completely drained, barely functioning — recommend only the most gentle, 5-minute restorative micro-actions',
    low: 'low energy — recommend gentle, easy wins that take under 15 minutes and don\'t require much effort',
    medium: 'moderate energy — recommend focused tasks, 20–30 minutes of steady effort',
    high: 'high energy — recommend ambitious, challenging actions up to 45–60 minutes'
  };

  return `You are a personal action coach. Give ONE specific, actionable recommendation.

User's current state:
- Energy level: ${selEnergy} (${energyDesc[selEnergy] || selEnergy})
- Time of day: ${timeLabel}
- ${areaContext}
${timeContext ? '- Time constraint: ' + timeContext : ''}
${wxContext ? '- Weather: ' + wxContext : ''}

Rules:
1. Give exactly ONE action, specific and doable right now
2. You MUST include a specific duration in the text (e.g., "for 5 minutes", "for 20 minutes", "for 30 minutes")
3. For depleted energy: max 5 minutes, ultra-gentle (breathe, stretch, sip water, rest)
4. For low energy: 5–15 minutes, easy and restorative
5. For medium energy: 20–30 minutes, focused work
6. For high energy: 30–60 minutes, ambitious effort
7. Keep it under 60 words, warm and conversational — not robotic
8. No bullet points, flowing text only
9. Never suggest intense exercise late at night

Respond with just the recommendation text, nothing else.`;
}

async function getAIRec() {
  if (!selEnergy || !selArea) return;

  const recCard = document.getElementById('rec-card');
  const recBody = document.getElementById('rec-body');
  const actionBar = document.getElementById('rec-action-bar');
  const timeTxt = document.getElementById('rec-time-txt');

  recCard.style.display = 'block';
  recBody.innerHTML = '<div class="loading-shimmer" style="width:85%;margin-bottom:8px"></div><div class="loading-shimmer" style="width:65%;margin-bottom:8px"></div><div class="loading-shimmer" style="width:50%"></div>';
  actionBar.style.display = 'none';

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: buildPrompt() }]
      })
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || getFallback();

    recBody.textContent = text;

    // Extract duration — default to energy-level baseline if AI didn't include one
    const durMatch = text.match(/(\d+)[\s-]*(minute|min|hour|hr)/i);
    let mins = ENERGY_DEFAULTS[selEnergy] || 25;
    let label = `${mins} min`;

    if (durMatch) {
      mins = durMatch[2].toLowerCase().startsWith('h')
        ? parseInt(durMatch[1]) * 60
        : parseInt(durMatch[1]);
      label = durMatch[2].toLowerCase().startsWith('h')
        ? `${durMatch[1]} hr`
        : `${durMatch[1]} min`;
    }

    timeTxt.textContent = label;
    document.getElementById('timer-start-btn').dataset.mins = mins;
    actionBar.style.display = 'flex';

  } catch (err) {
    recBody.textContent = getFallback();
    const defaultMins = ENERGY_DEFAULTS[selEnergy] || 25;
    timeTxt.textContent = `${defaultMins} min`;
    document.getElementById('timer-start-btn').dataset.mins = defaultMins;
    actionBar.style.display = 'flex';
    console.error('AI error:', err);
  }
}

function getFallback() {
  const fallbacks = {
    depleted: 'Take 5 minutes to lie down, close your eyes, and breathe slowly. Your only job right now is to rest — everything else can wait.',
    low: 'Spend 10 minutes tidying one small space near you. A clear environment is the gentlest way to clear your head when energy is low.',
    medium: 'Spend 25 minutes on the single most important task in this area. Set a timer, close distractions, and commit to just starting.',
    high: 'Channel this energy into 40 minutes of your most ambitious task in this area. Push a little further than feels comfortable — this is your peak window.'
  };
  return fallbacks[selEnergy] || 'Take a moment to breathe and write down the one most important thing you want to accomplish in the next 25 minutes.';
}
