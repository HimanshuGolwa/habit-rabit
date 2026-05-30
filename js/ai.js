// ── AI RECOMMENDATIONS ───────────────────────────
const API_URL = 'https://api.anthropic.com/v1/messages';

function buildPrompt() {
  const now = new Date();
  const hour = now.getHours();
  const timeLabel = hour < 6 ? 'late night (~' + hour + 'am)' :
    hour < 12 ? 'morning (~' + hour + 'am)' :
    hour < 17 ? 'afternoon (~' + hour + 'pm)' :
    hour < 21 ? 'evening (~' + (hour - 12) + 'pm)' :
    'night (~' + (hour - 12) + 'pm)';

  // Time constraints
  let timeContext = '';
  if (hour >= 21 || hour < 5) {
    timeContext = 'It is late night/night time. ONLY recommend sleep prep, breathing exercises, journaling, stretching, or wind-down activities. NO exercise, NO intense work, NO stimulating tasks.';
  } else if (hour >= 5 && hour < 8) {
    timeContext = 'It is early morning. Recommend energizing, grounding activities: light exercise, meditation, planning, journaling, healthy breakfast prep.';
  } else if (hour >= 12 && hour < 14) {
    timeContext = 'It is midday/lunch time. Consider recommending a proper break, a short walk, or a nourishing meal before focusing.';
  }

  // Weather context
  let wxContext = '';
  if (weatherData) {
    const { temp, code } = weatherData;
    const isRainy = code >= 51 && code <= 99;
    const isHot = temp > 30;
    const isCold = temp < 5;
    if (isRainy) wxContext = 'It is raining outside. Prefer indoor activities.';
    else if (isHot) wxContext = 'It is very hot outside. Avoid intense outdoor exercise.';
    else if (isCold) wxContext = 'It is cold outside. Lean toward indoor or warm alternatives.';
    wxContext += ` Temperature is ${temp}°C.`;
  }

  // Area context
  const area = getAllAreas().find(a => a.id === selArea);
  const areaContext = area ? `Life area: ${area.label}. Context: ${area.context}` : `Life area: ${selArea}`;

  return `You are a personal action coach. Give ONE specific, actionable recommendation.

User's current state:
- Energy level: ${selEnergy}
- Time of day: ${timeLabel}
- ${areaContext}
${timeContext ? '- Time constraint: ' + timeContext : ''}
${wxContext ? '- Weather: ' + wxContext : ''}

Rules:
1. Give exactly ONE action, specific and doable right now
2. Include a suggested duration (e.g., "for 20 minutes")
3. Keep it under 60 words, conversational and warm — not robotic
4. No bullet points, just flowing text
5. Match the energy level: high=intense/ambitious, medium=focused/steady, low=gentle/restorative
6. Be time-aware: never suggest intense exercise late at night

Respond with just the recommendation text, nothing else.`;
}

async function getAIRec() {
  if (!selEnergy || !selArea) return;

  const recCard = document.getElementById('rec-card');
  const recBody = document.getElementById('rec-body');
  const recDur = document.getElementById('rec-duration');
  const timerRow = document.getElementById('rec-timer-row');

  recCard.style.display = 'block';
  recBody.innerHTML = '<div class="loading-shimmer" style="width:80%;margin-bottom:8px"></div><div class="loading-shimmer" style="width:60%"></div>';
  recDur.textContent = '';
  timerRow.style.display = 'none';

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
    const text = data.content?.[0]?.text || 'Try taking 5 deep breaths and setting a clear intention for the next hour.';

    recBody.textContent = text;

    // Extract duration if mentioned
    const durMatch = text.match(/(\d+)\s*(minute|min|hour|hr)/i);
    if (durMatch) {
      const mins = durMatch[2].toLowerCase().startsWith('h') ? parseInt(durMatch[1]) * 60 : parseInt(durMatch[1]);
      recDur.textContent = `⏱ ${durMatch[1]} ${durMatch[2]}s`;
      document.getElementById('timer-start-btn').dataset.mins = mins;
      timerRow.style.display = 'block';
    }

  } catch (err) {
    recBody.textContent = 'Take a moment to breathe and write down the one most important thing you want to accomplish in the next hour.';
    console.error('AI error:', err);
  }
}
