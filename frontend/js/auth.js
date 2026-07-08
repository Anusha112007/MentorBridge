/* Auth page JS */
document.addEventListener('DOMContentLoaded', () => {
  if (api.isLoggedIn()) {
    const user = api.getUser();
    if (user?.role === 'junior') location.href = 'dashboard-junior.html';
    else if (user?.role === 'senior') location.href = 'dashboard-senior.html';
    else location.href = 'dashboard-admin.html';
    return;
  }

  // Tab switching
  const loginTab = document.getElementById('login-tab');
  const registerTab = document.getElementById('register-tab');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  function showTab(tab) {
    if (tab === 'login') {
      loginTab.classList.add('active');
      registerTab.classList.remove('active');
      loginForm.classList.add('active');
      registerForm.classList.remove('active');
    } else {
      registerTab.classList.add('active');
      loginTab.classList.remove('active');
      registerForm.classList.add('active');
      loginForm.classList.remove('active');
    }
  }

  loginTab?.addEventListener('click', () => showTab('login'));
  registerTab?.addEventListener('click', () => showTab('register'));

  // Check URL hash
  if (window.location.hash === '#register') showTab('register');

  // Role selection
  let selectedRole = 'junior';
  document.querySelectorAll('.role-card').forEach((card) => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.role-card').forEach((c) => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedRole = card.dataset.role;
    });
  });
  document.querySelector('.role-card[data-role="junior"]')?.classList.add('selected');

  // Password toggle
  document.querySelectorAll('.pw-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = btn.previousElementSibling;
      if (!input) return;
      input.type = input.type === 'password' ? 'text' : 'password';
      btn.textContent = input.type === 'password' ? '👁️' : '🙈';
    });
  });

  // Login
  document.getElementById('login-submit')?.addEventListener('click', async () => {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('login-submit');
    if (!email || !password) {
      showToast('warning', 'Fill in all fields');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Signing in...';
    try {
      const data = await api.post('/auth/login', { email, password });
      api.setAuth(data.token, data.user);
      showToast('success', 'Welcome back!', `Logged in as ${data.user.name}`);
      setTimeout(() => {
        if (data.user.role === 'junior') location.href = 'dashboard-junior.html';
        else if (data.user.role === 'senior') location.href = 'dashboard-senior.html';
        else location.href = 'dashboard-admin.html';
      }, 800);
    } catch (err) {
      showToast('error', 'Login failed', err.message);
      btn.disabled = false;
      btn.textContent = 'Sign In';
    }
  });

  // Register
  document.getElementById('register-submit')?.addEventListener('click', async () => {
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const branch = document.getElementById('reg-branch').value.trim();
    const year = document.getElementById('reg-year')?.value;
    const btn = document.getElementById('register-submit');

    if (!name || !email || !password || !branch) {
      showToast('warning', 'Fill all required fields');
      return;
    }
    if (password.length < 6) {
      showToast('warning', 'Password must be at least 6 characters');
      return;
    }

    const body = { name, email, password, role: selectedRole, branch };
    if (selectedRole === 'junior') body.currentYear = Number(year) || 1;
    if (selectedRole === 'senior') body.graduationYear = Number(year) || new Date().getFullYear();

    btn.disabled = true;
    btn.textContent = 'Creating account...';
    try {
      const data = await api.post('/auth/register', body);
      api.setAuth(data.token, data.user);
      showToast('success', 'Account created!', `Welcome, ${data.user.name}!`);
      setTimeout(() => {
        if (data.user.role === 'junior') location.href = 'dashboard-junior.html';
        else if (data.user.role === 'senior') location.href = 'dashboard-senior.html';
        else location.href = 'dashboard-admin.html';
      }, 800);
    } catch (err) {
      showToast('error', 'Registration failed', err.message);
      btn.disabled = false;
      btn.textContent = 'Create Account';
    }
  });

  // Enter key support
  document.getElementById('login-password')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('login-submit')?.click();
  });
  document.getElementById('reg-password')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('register-submit')?.click();
  });
});
