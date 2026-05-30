// ── FOCUS TIMER ───────────────────────────────────
let timerInterval = null;
let timerTotal = 0;
let timerLeft = 0;
let timerRunning = false;
const CIRCUMFERENCE = 2 * Math.PI * 95; // r=95

function startTimer() {
  const btn = document.getElementById('timer-start-btn');
  const mins = parseInt(btn.dataset.mins || 25);
  timerTotal = mins * 60;
  timerLeft = timerTotal;

  const rec = document.getElementById('rec-body').textContent;
  document.getElementById('timer-task-label').textContent = rec.length > 100 ? rec.slice(0, 100) + '…' : rec;

  // Add gradient def to SVG
  const svg = document.querySelector('.timer-ring');
  if (!svg.querySelector('#timer-grad')) {
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `<linearGradient id="timer-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#a78bfa"/>
      <stop offset="100%" stop-color="#60a5fa"/>
    </linearGradient>`;
    svg.prepend(defs);
  }

  document.getElementById('timer-overlay').style.display = 'flex';
  timerRunning = true;
  updateTimerDisplay();
  timerInterval = setInterval(tickTimer, 1000);
}

function tickTimer() {
  if (!timerRunning) return;
  timerLeft--;
  updateTimerDisplay();
  if (timerLeft <= 0) {
    clearInterval(timerInterval);
    timerRunning = false;
    onTimerComplete();
  }
}

function updateTimerDisplay() {
  const m = Math.floor(timerLeft / 60);
  const s = timerLeft % 60;
  document.getElementById('timer-time-disp').textContent = `${m}:${String(s).padStart(2, '0')}`;

  const prog = document.getElementById('ring-prog');
  const ratio = timerTotal > 0 ? timerLeft / timerTotal : 1;
  prog.style.strokeDashoffset = CIRCUMFERENCE * (1 - ratio);
  prog.style.strokeDasharray = CIRCUMFERENCE;
}

function pauseTimer() {
  timerRunning = !timerRunning;
  const icon = document.getElementById('tc-pause-icon');
  if (timerRunning) {
    timerInterval = setInterval(tickTimer, 1000);
    icon.innerHTML = '<rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor"/><rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor"/>';
  } else {
    clearInterval(timerInterval);
    icon.innerHTML = '<path d="M8 5l11 7-11 7V5z" fill="currentColor"/>';
  }
}

function resetTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  timerLeft = timerTotal;
  updateTimerDisplay();
  const icon = document.getElementById('tc-pause-icon');
  icon.innerHTML = '<rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor"/><rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor"/>';
  timerRunning = true;
  timerInterval = setInterval(tickTimer, 1000);
}

function closeTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  document.getElementById('timer-overlay').style.display = 'none';
}

function onTimerComplete() {
  if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  document.getElementById('timer-time-disp').textContent = 'Done!';
  setTimeout(() => closeTimer(), 2000);
}
