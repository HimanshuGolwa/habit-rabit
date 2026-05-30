// ── PROFILE TAB ───────────────────────────────────
function renderProfile() {
  const el = document.getElementById('profile-content');
  const habits = S.get('habits', []);
  const bestStreak = habits.reduce((m, h) => Math.max(m, getBestStreak(h.log || [])), 0);
  const totalDays = new Set(habits.flatMap(h => h.log || [])).size;

  el.innerHTML = `
    <div style="padding-bottom:16px;">

      <!-- Stats -->
      <div class="prof-section">
        <div class="prof-section-title">Your stats</div>
        <div class="prof-stat-row">
          <div class="prof-stat"><div class="prof-stat-val">${habits.length}</div><div class="prof-stat-lbl">Habits</div></div>
          <div class="prof-stat"><div class="prof-stat-val">${bestStreak}</div><div class="prof-stat-lbl">Best streak</div></div>
          <div class="prof-stat"><div class="prof-stat-val">${totalDays}</div><div class="prof-stat-lbl">Days active</div></div>
        </div>
      </div>

      <!-- Name -->
      <div class="prof-section">
        <div class="prof-section-title">Your name</div>
        <input class="prof-input" id="prof-name-in" type="text" placeholder="What should we call you?" maxlength="20" value="${prefs.name || ''}"/>
        <button class="prof-save-btn" onclick="saveName()">Save name</button>
      </div>

      <!-- Preferences -->
      <div class="prof-section">
        <div class="prof-section-title">Preferences</div>
        <div class="prof-row">
          <div>
            <div class="prof-row-lbl">Use weather data</div>
            <div class="prof-row-sub">Tailor recommendations to current conditions</div>
          </div>
          <button class="toggle ${prefs.useWeather ? 'on' : ''}" id="wx-toggle" onclick="togglePref('useWeather', 'wx-toggle')"></button>
        </div>
        <div class="prof-row">
          <div>
            <div class="prof-row-lbl">Time-aware recommendations</div>
            <div class="prof-row-sub">Avoid intense tasks late at night</div>
          </div>
          <button class="toggle ${prefs.useTime ? 'on' : ''}" id="time-toggle" onclick="togglePref('useTime', 'time-toggle')"></button>
        </div>
        <div class="prof-row">
          <div>
            <div class="prof-row-lbl">Daily reminder</div>
            <div class="prof-row-sub" id="reminder-sub">${prefs.remindEnabled ? 'Daily at ' + (prefs.remindTime || '08:00') : 'Off'}</div>
          </div>
          <button class="toggle ${prefs.remindEnabled ? 'on' : ''}" id="remind-toggle" onclick="toggleReminder()"></button>
        </div>
        <div id="remind-time-row" style="display:${prefs.remindEnabled ? 'flex' : 'none'};padding:10px 0;align-items:center;gap:12px;">
          <input type="time" id="remind-time-in" class="prof-input" style="width:auto;margin:0;" value="${prefs.remindTime || '08:00'}" onchange="saveReminderTime(this.value)"/>
        </div>
      </div>

      <!-- Theme -->
      <div class="prof-section">
        <div class="prof-section-title">Appearance</div>
        <div class="prof-row">
          <div class="prof-row-lbl">Dark mode</div>
          <button class="toggle ${theme === 'dark' ? 'on' : ''}" id="theme-toggle" onclick="toggleTheme();this.classList.toggle('on')"></button>
        </div>
      </div>

      <!-- Data -->
      <div class="prof-section">
        <div class="prof-section-title">Data</div>
        <div class="prof-row" style="border:none;">
          <button class="prof-save-btn" onclick="exportData()" style="margin:0;">Export JSON</button>
          <button class="prof-danger-btn" onclick="clearData()" style="margin:0;">Clear all data</button>
        </div>
      </div>

      <!-- About -->
      <div class="prof-section">
        <div class="prof-section-title">About</div>
        <div class="prof-version">Habit Rabit · Phase 1–4 · v4.0</div>
        <div class="prof-version" style="margin-top:4px;">The best thing you can do, right now.</div>
      </div>

      <!-- Login placeholder -->
      <div class="prof-section" style="opacity:0.5;">
        <div class="prof-section-title">Account (coming soon)</div>
        <div class="prof-row" style="border:none;">
          <div class="prof-row-lbl">Sign in to sync your data across devices</div>
        </div>
        <button class="prof-save-btn" disabled style="opacity:0.5;width:100%;cursor:not-allowed;">Sign in with Google</button>
      </div>
    </div>
  `;
}

function saveName() {
  const name = document.getElementById('prof-name-in').value.trim();
  prefs.name = name;
  S.set('prefs', prefs);
  const el = document.getElementById('h-name-disp');
  if (el) el.textContent = name || 'Rabbit';
}

function togglePref(key, btnId) {
  prefs[key] = !prefs[key];
  S.set('prefs', prefs);
  document.getElementById(btnId).classList.toggle('on', prefs[key]);
}

function toggleReminder() {
  prefs.remindEnabled = !prefs.remindEnabled;
  S.set('prefs', prefs);
  document.getElementById('remind-toggle').classList.toggle('on', prefs.remindEnabled);
  document.getElementById('remind-time-row').style.display = prefs.remindEnabled ? 'flex' : 'none';
  document.getElementById('reminder-sub').textContent = prefs.remindEnabled
    ? 'Daily at ' + (prefs.remindTime || '08:00') : 'Off';

  if (prefs.remindEnabled && 'Notification' in window) {
    Notification.requestPermission();
  }
}

function saveReminderTime(val) {
  prefs.remindTime = val;
  S.set('prefs', prefs);
  document.getElementById('reminder-sub').textContent = 'Daily at ' + val;
}

function exportData() {
  const data = {
    habits: S.get('habits', []),
    customAreas: S.get('customAreas', []),
    prefs: S.get('prefs', {}),
    intentions: S.get('intentions', {}),
    exportedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'habit-rabit-backup.json';
  a.click(); URL.revokeObjectURL(url);
}

function clearData() {
  if (!confirm('Clear ALL data? This cannot be undone.')) return;
  localStorage.clear();
  location.reload();
}
