/* Mentorship JS */
document.addEventListener('DOMContentLoaded', async () => {
  const user = requireAuth();
  if (!user) return;
  renderNavbar();
  renderSidebar(user.role);

  const container = document.getElementById('requests-container');
  const tabs = document.querySelectorAll('.req-tab');

  async function loadRequests() {
    if (!container) return;
    container.innerHTML = `<div class="empty-state"><div class="animate-spin" style="font-size:2rem">⏳</div></div>`;
    try {
      const data = await api.get('/mentorship/my-requests');
      const requests = data.requests || [];
      const active = document.querySelector('.req-tab.active')?.dataset.status || 'all';
      const filtered = active === 'all' ? requests : requests.filter((r) => r.status === active);

      // Update counts
      document.getElementById('count-all').textContent = requests.length;
      document.getElementById('count-pending').textContent = requests.filter(
        (r) => r.status === 'pending'
      ).length;
      document.getElementById('count-accepted').textContent = requests.filter(
        (r) => r.status === 'accepted'
      ).length;

      if (!filtered.length) {
        container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🤝</div><h3>No requests found</h3><p>${user.role === 'junior' ? 'Find a senior and send a mentorship request!' : 'No mentorship requests yet.'}</p></div>`;
        return;
      }
      container.innerHTML = filtered.map((r) => renderRequestCard(r, user.role)).join('');
    } catch (err) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><h3>${err.message}</h3></div>`;
    }
  }

  function renderRequestCard(r, role) {
    const other = role === 'junior' ? r.senior : r.junior;
    const statusBadge = {
      pending: 'badge-warning',
      accepted: 'badge-success',
      rejected: 'badge-error',
    };
    const statusIcon = { pending: '⏳', accepted: '✅', rejected: '❌' };
    const actionBtns =
      role === 'senior' && r.status === 'pending'
        ? `
      <button class="btn btn-success btn-sm" onclick="respond('${r._id}', 'accept')">✅ Accept</button>
      <button class="btn btn-danger btn-sm" onclick="respond('${r._id}', 'reject')">❌ Decline</button>
    `
        : r.status === 'accepted'
          ? `<a href="messages.html?userId=${other?._id}" class="btn btn-primary btn-sm">✉️ Message</a>`
          : '';

    return `
    <div class="request-card card" style="margin-bottom:16px">
      <div style="display:flex;align-items:flex-start;gap:16px;flex:1">
        ${renderAvatar(other, 'avatar-lg')}
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <span class="request-name">${other?.name || 'Unknown'}</span>
            <span class="badge ${statusBadge[r.status]}">${statusIcon[r.status]} ${r.status}</span>
          </div>
          <div class="request-meta">${other?.branch || ''} ${other?.role === 'senior' ? '· ' + (other?.placementCompany || '') : '· Year ' + (other?.currentYear || '')}</div>
          ${r.message ? `<div class="request-message">"${r.message}"</div>` : ''}
          <div class="text-muted text-xs" style="margin-top:8px">${timeAgo(r.createdAt)}</div>
        </div>
        <div style="display:flex;gap:8px;flex-direction:column;align-items:flex-end">
          <a href="profile.html?id=${other?._id}" class="btn btn-secondary btn-sm">View Profile</a>
          ${actionBtns}
          ${role === 'junior' && r.status === 'pending' ? `<button class="btn btn-danger btn-sm" onclick="withdrawRequest('${r._id}')">Withdraw</button>` : ''}
        </div>
      </div>
    </div>`;
  }

  async function respond(id, action) {
    try {
      await api.put(`/mentorship/${id}/${action}`, {});
      showToast('success', action === 'accept' ? 'Request accepted! 🎉' : 'Request declined');
      loadRequests();
    } catch (err) {
      showToast('error', 'Failed', err.message);
    }
  }
  window.respond = respond;

  async function withdrawRequest(id) {
    if (!confirm('Withdraw this mentorship request?')) return;
    try {
      await api.delete(`/mentorship/${id}`);
      showToast('info', 'Request withdrawn');
      loadRequests();
    } catch (err) {
      showToast('error', 'Failed', err.message);
    }
  }
  window.withdrawRequest = withdrawRequest;

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      loadRequests();
    });
  });

  loadRequests();
});
