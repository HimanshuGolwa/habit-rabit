// ── SESSION MANAGEMENT ───────────────────────────
// Drop-in ready for a real backend — swap the TODO functions with API calls.
const Auth = {
  KEY: 'hr_session',

  getSession() {
    try { return JSON.parse(localStorage.getItem(this.KEY)); }
    catch { return null; }
  },

  setSession(user) {
    localStorage.setItem(this.KEY, JSON.stringify({ ...user, loginAt: Date.now() }));
  },

  clearSession() {
    localStorage.removeItem(this.KEY);
  },

  isLoggedIn() {
    return !!this.getSession();
  },

  // ── TODO: replace with POST /api/auth/login ───
  async login(email, password) {
    await delay(700);
    if (!email || !password) throw new Error('Enter your email and password.');
    if (!isValidEmail(email)) throw new Error('Enter a valid email address.');
    if (password.length < 6) throw new Error('Password must be at least 6 characters.');
    // Simulated success — backend will return a real user object + token
    return { uid: 'local_' + Date.now(), name: email.split('@')[0], email };
  },

  // ── TODO: replace with POST /api/auth/signup ──
  async signup(name, email, password) {
    await delay(700);
    if (!name || name.trim().length < 2) throw new Error('Name must be at least 2 characters.');
    if (!isValidEmail(email)) throw new Error('Enter a valid email address.');
    if (password.length < 8) throw new Error('Password must be at least 8 characters.');
    return { uid: 'local_' + Date.now(), name: name.trim(), email };
  },
};

// ── HELPERS ──────────────────────────────────────
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

// ── UI HELPERS ────────────────────────────────────
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
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  btn.innerHTML = isHidden
    ? `<svg viewBox="0 0 20 20" fill="none"><path d="M10 4C5 4 2 10 2 10s3 6 8 6 8-6 8-6-3-6-8-6z" stroke="currentColor" stroke-width="1.5"/><line x1="3" y1="3" x2="17" y2="17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`
    : `<svg viewBox="0 0 20 20" fill="none"><path d="M10 4C5 4 2 10 2 10s3 6 8 6 8-6 8-6-3-6-8-6z" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.5"/></svg>`;
}

// ── LOGIN HANDLER ─────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();
  clearErrors();
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const btn      = document.getElementById('login-btn');

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

// ── SIGNUP HANDLER ────────────────────────────────
async function handleSignup(e) {
  e.preventDefault();
  clearErrors();

  const name     = document.getElementById('signup-name').value.trim();
  const email    = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  const confirm  = document.getElementById('signup-confirm').value;
  const btn      = document.getElementById('signup-btn');

  if (password !== confirm) {
    showError('signup-error', 'Passwords do not match.');
    return;
  }

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
