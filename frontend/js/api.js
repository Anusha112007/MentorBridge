/* =====================================================
   MentorBridge — Simplified API Utility (3 features only)
   ===================================================== */

/* ── Theme Initialization (run immediately to prevent flash) ── */
(function initTheme() {
  const saved = localStorage.getItem('mb_theme');
  if (saved) {
    document.documentElement.setAttribute('data-theme', saved);
  }
  // If no saved preference, default is dark (the :root defaults)
})();

const API_BASE = 'http://localhost:5000/api';

const api = {
  getToken: () => localStorage.getItem('ec_token'),
  getUser: () => {
    try {
      return JSON.parse(localStorage.getItem('ec_user'));
    } catch {
      return null;
    }
  },
  setAuth: (token, user) => {
    localStorage.setItem('ec_token', token);
    localStorage.setItem('ec_user', JSON.stringify(user));
  },
  clearAuth: () => {
    localStorage.removeItem('ec_token');
    localStorage.removeItem('ec_user');
  },
  isLoggedIn: () => !!localStorage.getItem('ec_token'),

  async request(method, path, body = null, isFormData = false) {
    const headers = {};
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (!isFormData && body) headers['Content-Type'] = 'application/json';
    const opts = { method, headers };
    if (body) opts.body = isFormData ? body : JSON.stringify(body);
    const res = await fetch(`${API_BASE}${path}`, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  },

  get: (path) => api.request('GET', path),
  post: (path, body) => api.request('POST', path, body),
  put: (path, body) => api.request('PUT', path, body),
  delete: (path) => api.request('DELETE', path),
  postForm: (path, fd) => api.request('POST', path, fd, true),
  putForm: (path, fd) => api.request('PUT', path, fd, true),
};

/* ── Toast ─────────────────────────────────────────── */
function showToast(type, title, message = '') {
  let c = document.getElementById('toast-container');
  if (!c) {
    c = document.createElement('div');
    c.id = 'toast-container';
    document.body.appendChild(c);
  }
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><div><div class="toast-title">${title}</div>${message ? `<div class="toast-message">${message}</div>` : ''}</div>`;
  c.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateX(20px)';
    t.style.transition = '.3s';
    setTimeout(() => t.remove(), 300);
  }, 4000);
}

/* ── Helpers ────────────────────────────────────────── */
function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
function renderAvatar(user, size = '') {
  if (user?.profilePicture)
    return `<div class="avatar ${size}"><img src="http://localhost:5000${user.profilePicture}" alt="${user.name}"></div>`;
  return `<div class="avatar ${size}">${getInitials(user?.name)}</div>`;
}
function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/* ── Auth guard ────────────────────────────────────── */
function requireAuth(allowedRoles = []) {
  if (!api.isLoggedIn()) {
    window.location.href = '/login.html';
    return null;
  }
  const user = api.getUser();
  if (allowedRoles.length && !allowedRoles.includes(user?.role)) {
    window.location.href = '/login.html';
    return null;
  }
  return user;
}

/* ── Navbar ─────────────────────────────────────────── */
function renderNavbar(_activePage = '') {
  const user = api.getUser();
  const isLoggedIn = api.isLoggedIn();
  const dashLink = 'dashboard.html';

  const navLinks = isLoggedIn
    ? `
    <a href="doubts.html" class="nav-link">❓ Doubts</a>
    <a href="resources.html" class="nav-link">📚 Resources</a>
    <a href="messages.html" class="nav-link">✉️ Messages</a>
  `
    : `
    <a href="index.html" class="nav-link">Home</a>
  `;

  const actions = isLoggedIn
    ? `
    <div class="dropdown" id="user-dropdown">
      <a class="nav-avatar-btn" onclick="document.getElementById('user-dropdown').classList.toggle('open')">
        ${renderAvatar(user, 'avatar-sm')}
        <span class="nav-user-name">${user?.name?.split(' ')[0] || 'User'}</span>
        <span style="color:var(--text-muted);font-size:.7rem">▼</span>
      </a>
      <div class="dropdown-menu">
        <a href="dashboard.html" class="dropdown-item">🏠 Dashboard</a>
        <a href="edit-profile.html" class="dropdown-item">✏️ Edit Profile</a>
        <div class="dropdown-divider"></div>
        <button class="dropdown-item danger" onclick="logout()">🚪 Logout</button>
      </div>
    </div>
  `
    : `
    <a href="login.html" class="btn btn-secondary btn-sm">Sign In</a>
    <a href="login.html#register" class="btn btn-primary btn-sm">Register</a>
  `;

  const navbar = document.getElementById('navbar');
  if (navbar) {
    navbar.innerHTML = `
      <div class="navbar-inner">
        <a href="${isLoggedIn ? dashLink : 'index.html'}" class="navbar-brand">
          <div class="brand-logo">🎓</div>
          <span class="brand-name">MentorBridge</span>
        </a>
        <nav class="navbar-links">${navLinks}</nav>
        <div class="navbar-actions">
          <button class="theme-toggle" id="theme-toggle" onclick="toggleTheme()" title="Toggle light/dark mode" aria-label="Toggle theme">
            <div class="theme-toggle-track">
              <span class="theme-toggle-icon sun">☀️</span>
              <span class="theme-toggle-icon moon">🌙</span>
            </div>
            <div class="theme-toggle-knob"></div>
          </button>
          ${actions}
        </div>
        <button class="navbar-hamburger" onclick="toggleMobile()"><span></span><span></span><span></span></button>
      </div>
      <div class="mobile-menu" id="mobile-menu">
        ${navLinks}
        ${
          isLoggedIn
            ? `<a href="dashboard.html" class="btn btn-primary btn-sm btn-full" style="margin-top:8px">Dashboard</a>`
            : `<a href="login.html" class="btn btn-primary btn-sm btn-full" style="margin-top:8px">Sign In</a>`
        }
      </div>
    `;
    setActiveNavLink();
    document.addEventListener('click', (e) => {
      const dd = document.getElementById('user-dropdown');
      if (dd && !dd.contains(e.target)) dd.classList.remove('open');
    });
  }
}

/* ── Sidebar ─────────────────────────────────────────── */
function renderSidebar(role) {
  const el = document.getElementById('sidebar');
  if (!el) return;
  const user = api.getUser();

  const roleLinks =
    role === 'senior'
      ? `<a href="junior-directory.html" class="sidebar-link"><span class="link-icon">🎓</span>Find Juniors</a>`
      : role === 'junior'
        ? `<a href="senior-directory.html" class="sidebar-link"><span class="link-icon">🔍</span>Find Mentors</a>`
        : `<a href="senior-directory.html" class="sidebar-link"><span class="link-icon">🔍</span>Find Mentors</a>
       <a href="junior-directory.html" class="sidebar-link"><span class="link-icon">🎓</span>Find Juniors</a>`;

  el.innerHTML = `
    <div class="sidebar-section">
      <div style="display:flex;align-items:center;gap:12px;padding:4px 12px 16px;border-bottom:1px solid var(--border-subtle);margin-bottom:12px">
        ${renderAvatar(user, 'avatar-sm')}
        <div>
          <div style="font-size:13px;font-weight:600;color:var(--text-primary)">${user?.name || 'User'}</div>
          <div style="font-size:11px;color:var(--text-muted);text-transform:capitalize">${user?.role || ''}</div>
        </div>
      </div>
      <a href="dashboard.html"  class="sidebar-link"><span class="link-icon">🏠</span>Dashboard</a>
      <div class="sidebar-divider"></div>
      ${roleLinks}
      <div class="sidebar-divider"></div>
      <a href="doubts.html"     class="sidebar-link"><span class="link-icon">❓</span>Doubts</a>
      <a href="resources.html"  class="sidebar-link"><span class="link-icon">📚</span>Resources</a>
      <a href="subject-guidance.html" class="sidebar-link"><span class="link-icon">📖</span>Subject Guidance</a>
      <a href="messages.html"   class="sidebar-link"><span class="link-icon">✉️</span>Messages</a>
      <div class="sidebar-divider"></div>
      <a href="edit-profile.html" class="sidebar-link"><span class="link-icon">✏️</span>Edit Profile</a>
      <button class="sidebar-link" onclick="logout()" style="color:var(--error)"><span class="link-icon">🚪</span>Logout</button>
    </div>
  `;
  setActiveNavLink();
}

function setActiveNavLink() {
  const page = window.location.pathname.split('/').pop();
  document.querySelectorAll('.nav-link, .sidebar-link').forEach((link) => {
    const href = link.getAttribute('href');
    if (href && href !== '#' && page && page === href.split('/').pop())
      link.classList.add('active');
  });
}

function toggleMobile() {
  document.getElementById('mobile-menu')?.classList.toggle('open');
}
function logout() {
  api.clearAuth();
  window.location.href = 'index.html';
}

/* ── Theme Toggle ─────────────────────────────────── */
function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  const next = current === 'light' ? 'dark' : 'light';
  html.setAttribute('data-theme', next);
  localStorage.setItem('mb_theme', next);
}
window.addEventListener('scroll', () => {
  const nb = document.querySelector('.navbar');
  if (nb) nb.classList.toggle('scrolled', window.scrollY > 20);
});

/* ── Message Notification Polling ──────────────────── */
(function startMessageNotifications() {
  if (!api.isLoggedIn()) return;
  const currentPage = window.location.pathname.split('/').pop();

  // Track seen message IDs to avoid duplicate toasts
  let lastSeenMessageIds = new Set();
  let initialized = false;

  async function pollForNewMessages() {
    if (!api.isLoggedIn()) return;
    try {
      const data = await api.get('/messages/conversations');
      const convs = data.conversations || [];

      if (!initialized) {
        // On first load, just record existing message IDs — don't notify
        convs.forEach((c) => {
          if (c._id) lastSeenMessageIds.add(c._id);
        });
        initialized = true;
        return;
      }

      const me = api.getUser();
      let totalUnread = 0;

      convs.forEach((c) => {
        const lastMsg = c.lastMessage || c;
        if (!lastMsg || !lastMsg._id) return;

        // Count unread (message sent by someone else, not read)
        const isFromOther = lastMsg.sender?._id !== me?._id && lastMsg.sender !== me?._id;
        if (isFromOther && !lastMsg.read) totalUnread++;

        // New message not seen before
        if (!lastSeenMessageIds.has(lastMsg._id)) {
          lastSeenMessageIds.add(lastMsg._id);

          // Only notify if sent by someone else AND we're not on the messages page
          if (isFromOther && currentPage !== 'messages.html') {
            const senderName = lastMsg.sender?.name || 'Someone';
            const preview = lastMsg.content ? lastMsg.content.slice(0, 50) : '📎 Attachment';
            showMessageNotification(senderName, preview, lastMsg.sender?._id || lastMsg.sender);
          }
        }
      });

      // Update unread badge on navbar Messages link
      updateMessageBadge(totalUnread);
    } catch (_e) {
      /* silent fail — polling errors are non-critical */
    }
  }

  function showMessageNotification(senderName, preview, senderId) {
    let c = document.getElementById('toast-container');
    if (!c) {
      c = document.createElement('div');
      c.id = 'toast-container';
      document.body.appendChild(c);
    }

    const t = document.createElement('div');
    t.className = 'toast toast-info';
    t.style.cssText = 'cursor:pointer;min-width:280px';
    t.innerHTML = `
      <span class="toast-icon">✉️</span>
      <div style="flex:1">
        <div class="toast-title">New message from ${senderName}</div>
        <div class="toast-message" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px">${preview}</div>
      </div>
      <span style="font-size:11px;color:var(--text-muted);margin-left:8px">View →</span>
    `;
    t.addEventListener('click', () => {
      window.location.href = `messages.html${senderId ? '?userId=' + senderId : ''}`;
    });
    c.appendChild(t);

    // Play subtle sound if browser allows
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.value = 0.1;
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      setTimeout(() => osc.stop(), 350);
    } catch (_e) { /* AudioContext may be blocked by browser autoplay policy — ignore */ }

    // Auto-dismiss after 6 seconds
    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transform = 'translateX(20px)';
      t.style.transition = '.3s';
      setTimeout(() => t.remove(), 300);
    }, 6000);
  }

  const originalTitle = document.title;

  function updateMessageBadge(count) {
    // Remove existing badges first
    document.querySelectorAll('.msg-badge').forEach((b) => b.remove());
    
    if (count <= 0) {
      document.title = originalTitle;
      return;
    }

    // Update document tab title with notification count prefix
    document.title = `(${count}) ${originalTitle}`;

    // Add badge to Messages links in navbar and sidebar as a superscript
    document.querySelectorAll('a[href="messages.html"]').forEach((link) => {
      const badge = document.createElement('sup');
      badge.className = 'msg-badge';
      badge.textContent = count;
      badge.style.cssText = `
        background: #ef4444;
        color: #fff;
        border-radius: 50%;
        font-size: 8px;
        font-weight: 800;
        padding: 2px 5px;
        margin-left: 2px;
        vertical-align: super;
      `;
      link.appendChild(badge);
    });
  }

  // Start polling after 3 seconds (let page load first), then every 8 seconds
  setTimeout(() => {
    pollForNewMessages();
    setInterval(pollForNewMessages, 8000);
  }, 3000);
})();
