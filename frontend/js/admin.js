/* Admin Dashboard JS */
document.addEventListener('DOMContentLoaded', async () => {
  const user = requireAuth(['admin']);
  if (!user) return;
  renderNavbar();
  renderSidebar(user.role);

  loadStats();
  loadUsers();

  document.querySelectorAll('.admin-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach((t) => t.classList.remove('active'));
      document.querySelectorAll('.admin-section').forEach((s) => s.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`section-${tab.dataset.section}`)?.classList.add('active');
      if (tab.dataset.section === 'users') loadUsers();
      if (tab.dataset.section === 'reported') loadReported();
    });
  });

  async function loadStats() {
    try {
      const data = await api.get('/admin/stats');
      const s = data.stats;
      document.getElementById('stat-users').textContent = s.users || 0;
      document.getElementById('stat-seniors').textContent = s.seniors || 0;
      document.getElementById('stat-juniors').textContent = s.juniors || 0;
      document.getElementById('stat-questions').textContent = s.questions || 0;
      document.getElementById('stat-placements').textContent = s.placements || 0;
      document.getElementById('stat-resources').textContent = s.resources || 0;
      document.getElementById('stat-mentorships').textContent = s.activeMentorships || 0;
    } catch (err) {
      console.error(err);
    }
  }

  let userPage = 1,
    roleFilter = '',
    searchFilter = '';

  async function loadUsers() {
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted)">Loading...</td></tr>`;
    try {
      const params = new URLSearchParams({ page: userPage, limit: 20 });
      if (roleFilter) params.set('role', roleFilter);
      if (searchFilter) params.set('search', searchFilter);
      const data = await api.get(`/admin/users?${params}`);
      const users = data.users || [];
      if (!users.length) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted)">No users found</td></tr>`;
        return;
      }
      tbody.innerHTML = users
        .map(
          (u) => `
        <tr>
          <td><div class="user-cell">
            ${renderAvatar(u, 'avatar-sm')}
            <div><div class="user-name">${u.name}</div><div class="user-email">${u.email}</div></div>
          </div></td>
          <td><span class="badge badge-${u.role === 'senior' ? 'secondary' : u.role === 'admin' ? 'error' : 'info'}">${u.role}</span></td>
          <td>${u.branch || '-'}</td>
          <td><span class="badge ${u.isVerified ? 'badge-success' : 'badge-warning'}">${u.isVerified ? '✅ Verified' : '⏳ Pending'}</span></td>
          <td><span class="badge ${u.isActive ? 'badge-success' : 'badge-error'}">${u.isActive ? 'Active' : 'Inactive'}</span></td>
          <td><div class="action-btns">
            ${!u.isVerified ? `<button class="btn btn-success btn-sm" onclick="verifyUser('${u._id}')">Verify</button>` : ''}
            <button class="btn btn-secondary btn-sm" onclick="toggleUser('${u._id}', ${u.isActive})">${u.isActive ? 'Deactivate' : 'Activate'}</button>
            <button class="btn btn-danger btn-sm" onclick="deleteUser('${u._id}', '${u.name}')">Delete</button>
          </div></td>
        </tr>`
        )
        .join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--error)">${err.message}</td></tr>`;
    }
  }

  async function loadReported() {
    const container = document.getElementById('reported-container');
    if (!container) return;
    container.innerHTML = `<div class="empty-state"><div class="animate-spin" style="font-size:2rem">⏳</div></div>`;
    try {
      const data = await api.get('/admin/reported');
      const r = data.reported;
      const totalReported =
        r.questions.length +
        r.answers.length +
        r.placements.length +
        r.internships.length +
        r.resources.length;
      if (!totalReported) {
        container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">✅</div><h3>All Clear!</h3><p>No reported content at the moment.</p></div>`;
        return;
      }
      let html = '';
      [
        ...r.questions.map((i) => ({ ...i, _type: 'question', label: i.title })),
        ...r.placements.map((i) => ({
          ...i,
          _type: 'placement',
          label: `${i.company} Placement by ${i.author?.name}`,
        })),
        ...r.resources.map((i) => ({ ...i, _type: 'resource', label: i.title })),
      ].forEach((item) => {
        html += `<div class="card" style="margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;gap:16px">
          <div>
            <span class="badge badge-error" style="margin-bottom:6px">${item._type}</span>
            <div style="font-weight:600;font-size:14px">${item.label}</div>
            <div style="font-size:12px;color:var(--text-muted)">By: ${item.author?.name || item.uploadedBy?.name}</div>
          </div>
          <button class="btn btn-danger btn-sm" onclick="deleteContent('${item._type}', '${item._id}')">🗑️ Remove</button>
        </div>`;
      });
      container.innerHTML = html;
    } catch (err) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><h3>${err.message}</h3></div>`;
    }
  }

  async function verifyUser(id) {
    try {
      await api.put(`/admin/users/${id}/verify`, {});
      showToast('success', 'User verified ✅');
      loadUsers();
      loadStats();
    } catch (err) {
      showToast('error', 'Failed', err.message);
    }
  }
  window.verifyUser = verifyUser;

  async function toggleUser(id, isActive) {
    try {
      await api.put(`/admin/users/${id}/toggle`, {});
      showToast('info', isActive ? 'User deactivated' : 'User activated');
      loadUsers();
    } catch (err) {
      showToast('error', 'Failed', err.message);
    }
  }
  window.toggleUser = toggleUser;

  async function deleteUser(id, name) {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${id}`);
      showToast('success', 'User deleted');
      loadUsers();
      loadStats();
    } catch (err) {
      showToast('error', 'Failed', err.message);
    }
  }
  window.deleteUser = deleteUser;

  async function deleteContent(type, id) {
    if (!confirm('Remove this content?')) return;
    try {
      await api.delete(`/admin/content/${type}/${id}`);
      showToast('success', 'Content removed');
      loadReported();
    } catch (err) {
      showToast('error', 'Failed', err.message);
    }
  }
  window.deleteContent = deleteContent;

  // Filters
  document.getElementById('role-filter')?.addEventListener('change', (e) => {
    roleFilter = e.target.value;
    userPage = 1;
    loadUsers();
  });
  let debounce;
  document.getElementById('user-search')?.addEventListener('input', (e) => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      searchFilter = e.target.value;
      userPage = 1;
      loadUsers();
    }, 400);
  });
});
