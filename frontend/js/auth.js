/* Auth page JS */
document.addEventListener('DOMContentLoaded', () => {
  // If already logged in, redirect
  if (api.isLoggedIn()) {
    const user = api.getUser();
    if (user?.role === 'junior' || user?.role === 'senior') location.href = 'dashboard.html';
    else location.href = 'dashboard-admin.html';
    return;
  }

  // ── Login Submit ──
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
        if (data.user.role === 'junior' || data.user.role === 'senior')
          location.href = 'dashboard.html';
        else location.href = 'dashboard-admin.html';
      }, 800);
    } catch (err) {
      showToast('error', 'Login failed', err.message);
      btn.disabled = false;
      btn.textContent = 'Sign In';
    }
  });

  // Enter key on login password
  document.getElementById('login-password')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('login-submit')?.click();
  });

  // ── Register Submit ──
  document.getElementById('register-submit')?.addEventListener('click', async () => {
    // selectedRole is set by the inline script in login.html via window.selectedRole
    const role =
      window.selectedRole || document.querySelector('.role-hero-card.selected')?.dataset.role;
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const branch = document.getElementById('reg-branch').value.trim();
    const year = document.getElementById('reg-year')?.value;
    const btn = document.getElementById('register-submit');

    if (!role) {
      showToast('warning', 'Please select your role first');
      return;
    }
    if (!name || !email || !password || !branch) {
      showToast('warning', 'Fill all required fields');
      return;
    }
    if (password.length < 6) {
      showToast('warning', 'Password must be at least 6 characters');
      return;
    }

    const body = { name, email, password, role, branch };
    if (role === 'junior') {
      body.currentYear = Number(year) || 1;
    }
    if (role === 'senior') {
      const yearVal = Number(year) || 0;
      if (yearVal >= 2 && yearVal <= 4) {
        body.currentYear = yearVal;
      } else {
        body.graduationYear = yearVal || new Date().getFullYear();
      }
    }

    btn.disabled = true;
    btn.textContent = 'Creating account...';
    try {
      const data = await api.post('/auth/register', body);
      api.setAuth(data.token, data.user);
      showToast('success', 'Account created!', `Welcome, ${data.user.name}!`);
      setTimeout(() => {
        if (data.user.role === 'junior' || data.user.role === 'senior')
          location.href = 'dashboard.html';
        else location.href = 'dashboard-admin.html';
      }, 800);
    } catch (err) {
      showToast('error', 'Registration failed', err.message);
      btn.disabled = false;
      btn.textContent = 'Create Account 🎉';
    }
  });

  // Enter key on reg password
  document.getElementById('reg-password')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('register-submit')?.click();
  });
});
