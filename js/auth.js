// ── API CONFIG ────────────────────────────────────────
// Swap this URL after deploying to Railway
const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3000'
  : 'https://habit-rabit-api.up.railway.app';

// ── SESSION MANAGEMENT ───────────────────────────────
const Auth = {
  SESSION_KEY: 'hr_session',
  ACCESS_KEY:  'hr_access',
  REFRESH_KEY: 'hr_refresh',

  getSession()  {
    try { return JSON.parse(localStorage.getItem(this.SESSION_KEY)); }
    catch { return null; }
  },
  setSession(user)  { localStorage.setItem(this.SESSION_KEY, JSON.stringify(user)); },
  clearSession()    {
    localStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem(this.ACCESS_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
  },
  isLoggedIn()      { return !!this.getSession(); },
  getAccessToken()  { return localStorage.getItem(this.ACCESS_KEY); },
  getRefreshToken() { return localStorage.getItem(this.REFRESH_KEY); },
  saveTokens(access, refresh) {
    localStorage.setItem(this.ACCESS_KEY,  access);
    localStorage.setItem(this.REFRESH_KEY, refresh);
  },

  // ── POST /api/auth/signup ──────────────────────────
  async signup(name, email, password) {
    const res  = await fetch(`${API_BASE}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Signup failed.');
    this.saveTokens(data.accessToken, data.refreshToken);
    return data.user;
  },

  // ── POST /api/auth/login ───────────────────────────
  async login(email, password) {
    const res  = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed.');
    this.saveTokens(data.accessToken, data.refreshToken);
    return data.user;
  },

  // ── POST /api/auth/refresh ─────────────────────────
  async refreshAccessToken() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token.');
    const res  = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const data = await res.json();
    if (!res.ok) { this.clearSession(); throw new Error('Session expired. Please sign in again.'); }
    this.saveTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  },

  // ── POST /api/auth/logout ──────────────────────────
  async logout() {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      try {
        await fetch(`${API_BASE}/api/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
      } catch { /* best effort */ }
    }
    this.clearSession();
  },

  // ── Authenticated fetch wrapper (auto-refreshes on 401) ──
  async apiFetch(path, options = {}) {
    const go = (token) => fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });

    let res = await go(this.getAccessToken());
    if (res.status === 401) {
      try {
        const newToken = await this.refreshAccessToken();
        res = await go(newToken);
      } catch {
        window.location.href = 'login.html';
        return null;
      }
    }
    return res;
  },
};

// ── UI HELPERS ────────────────────────────────────────
function setLoading(btn, isLoading, defaultText) {
  btn.disabled = isLoading;
  btn.textContent = isLoading ? 'Please wait…' : defaultText;
}

function showError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.style.display = msg ? 'block' : 'none';
}

function clearErrors() {
  document.querySelectorAll('.auth-error').forEach(el => {
    el.textContent = '';
    el.style.display = 'none';
  });
}

function togglePassword(inputId, btnId) {
  const input = document.getElementById(inputId);
  const btn   = document.getElementById(btnId);
  if (!input || !btn) return;
  const hidden = input.type === 'password';
  input.type = hidden ? 'text' : 'password';
  btn.innerHTML = hidden
    ? `<svg viewBox="0 0 20 20" fill="none"><path d="M10 4C5 4 2 10 2 10s3 6 8 6 8-6 8-6-3-6-8-6z" stroke="currentColor" stroke-width="1.5"/><line x1="3" y1="3" x2="17" y2="17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`
    : `<svg viewBox="0 0 20 20" fill="none"><path d="M10 4C5 4 2 10 2 10s3 6 8 6 8-6 8-6-3-6-8-6z" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.5"/></svg>`;
}

// ── LOGIN HANDLER ─────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();
  clearErrors();
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const btn      = document.getElementById('login-btn');
  if (!email || !password) { showError('login-error', 'Please fill in all fields.'); return; }
  setLoading(btn, true, 'Sign in');
  try {
    const user = await Auth.login(email, password);
    Auth.setSession(user);
    window.location.href = 'index.html';
  } catch (err) {
    showError('login-error', err.message);
    setLoading(btn, false, 'Sign in');
  }
}

// ── SIGNUP HANDLER ────────────────────────────────────
async function handleSignup(e) {
  e.preventDefault();
  clearErrors();
  const name     = document.getElementById('signup-name').value.trim();
  const email    = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  const confirm  = document.getElementById('signup-confirm').value;
  const btn      = document.getElementById('signup-btn');
  if (password !== confirm) { showError('signup-error', 'Passwords do not match.'); return; }
  setLoading(btn, true, 'Create account');
  try {
    const user = await Auth.signup(name, email, password);
    Auth.setSession(user);
    window.location.href = 'index.html';
  } catch (err) {
    showError('signup-error', err.message);
    setLoading(btn, false, 'Create account');
  }
}
