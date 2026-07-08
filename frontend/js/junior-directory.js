/* ============================================================
   Junior Directory JS — MentorBridge
   Handles: loading juniors, filters, pagination, invite modal
   ============================================================ */

let _juniorPaginationCallback = null;
window.goToJuniorPage = function (p) {
  if (_juniorPaginationCallback) _juniorPaginationCallback(p);
};

// Global invite state
let _inviteTarget = null; // { id, name, branch, year }

document.addEventListener('DOMContentLoaded', async () => {
  const user = requireAuth(['senior', 'admin']);
  if (!user) return;
  renderNavbar();
  renderSidebar(user.role);

  let page = 1;
  const LIMIT = 12;
  let filters = {};

  const grid = document.getElementById('juniors-grid');
  const totalEl = document.getElementById('total-count');
  const paginationEl = document.getElementById('pagination');
  const searchInput = document.getElementById('search-input');
  const branchFilter = document.getElementById('branch-filter');
  const skillFilter = document.getElementById('skill-filter');
  const interestFilter = document.getElementById('interest-filter');
  const yearFilter = document.getElementById('year-filter');

  /* ── Load juniors ─────────────────────────────────── */
  async function loadJuniors() {
    // Show skeletons
    grid.innerHTML = Array(6)
      .fill(0)
      .map(
        () => `
      <div class="card">
        <div style="display:flex;gap:12px;align-items:center;margin-bottom:16px">
          <div class="skeleton skeleton-avatar"></div>
          <div style="flex:1"><div class="skeleton skeleton-title" style="margin-bottom:6px"></div><div class="skeleton skeleton-text" style="width:60%"></div></div>
        </div>
        <div class="skeleton skeleton-text" style="margin-bottom:6px"></div>
        <div class="skeleton skeleton-text" style="width:80%"></div>
      </div>`
      )
      .join('');

    try {
      const params = new URLSearchParams({ page, limit: LIMIT, ...filters });
      const data = await api.get(`/users/juniors?${params}`);
      if (totalEl) totalEl.textContent = data.total || 0;

      if (!data.juniors?.length) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">🎓</div><h3>No juniors found</h3><p>Try changing your filters</p></div>`;
        if (paginationEl) paginationEl.innerHTML = '';
        return;
      }

      grid.innerHTML = data.juniors.map(renderJuniorCard).join('');
      _juniorPaginationCallback = (p) => {
        page = p;
        loadJuniors();
      };
      if (paginationEl) renderJuniorPagination(paginationEl, page, data.total, LIMIT);
    } catch (err) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">⚠️</div><h3>Failed to load</h3><p>${err.message}</p></div>`;
    }
  }

  /* ── Render a junior card ─────────────────────────── */
  function renderJuniorCard(j) {
    const skills = (j.skills || [])
      .slice(0, 4)
      .map((s) => `<span class="tag">${s}</span>`)
      .join('');
    const interests = (j.interests || [])
      .slice(0, 3)
      .map((i) => `<span class="badge badge-info">${i}</span>`)
      .join('');
    const yearLabel = j.currentYear ? `Year ${j.currentYear}` : '';

    return `
    <div class="junior-card">
      <div class="junior-card-top">
        ${
          j.profilePicture
            ? `<div class="avatar avatar-lg"><img src="http://localhost:5000${j.profilePicture}" alt="${j.name}"></div>`
            : `<div class="avatar avatar-lg">${getInitials(j.name)}</div>`
        }
        <div class="junior-info">
          <div class="junior-name">${j.name}</div>
          <div class="junior-branch">🎓 ${j.branch || 'N/A'}</div>
          ${yearLabel ? `<div class="junior-year">📅 ${yearLabel}</div>` : ''}
        </div>
      </div>
      ${j.bio ? `<p class="junior-bio">${j.bio}</p>` : ''}
      ${skills ? `<div class="junior-skills">${skills}</div>` : ''}
      ${interests ? `<div class="junior-skills">${interests}</div>` : ''}
      ${j.careerGoals ? `<div style="font-size:12px;color:var(--text-muted);font-style:italic">🎯 ${j.careerGoals.slice(0, 80)}${j.careerGoals.length > 80 ? '…' : ''}</div>` : ''}
      <div class="junior-card-footer">
        <a href="profile.html?id=${j._id}" class="btn btn-ghost btn-sm" style="padding:4px 8px">View Profile</a>
        <div style="display:flex;gap:6px">
          <a href="messages.html?userId=${j._id}" class="btn btn-ghost btn-sm" style="padding:4px 8px;color:var(--text-secondary)">✉️ Chat</a>
          <button class="btn btn-primary btn-sm" style="padding:4px 10px"
            onclick="openInviteModal('${j._id}', '${escHtml(j.name)}', '${escHtml(j.branch || '')}', '${j.currentYear || ''}')">
            🚀 Invite
          </button>
        </div>
      </div>
    </div>`;
  }

  function escHtml(str) {
    return (str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
  }

  /* ── Filters ──────────────────────────────────────── */
  let debounce;
  [searchInput, branchFilter, skillFilter, interestFilter, yearFilter].forEach((el) => {
    el?.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        filters = {};
        if (searchInput?.value) filters.search = searchInput.value;
        if (branchFilter?.value) filters.branch = branchFilter.value;
        if (skillFilter?.value) filters.skills = skillFilter.value;
        if (interestFilter?.value) filters.interest = interestFilter.value;
        if (yearFilter?.value) filters.year = yearFilter.value;
        page = 1;
        loadJuniors();
      }, 400);
    });
  });

  document.getElementById('clear-filters')?.addEventListener('click', () => {
    filters = {};
    page = 1;
    [searchInput, branchFilter, skillFilter, interestFilter, yearFilter].forEach((el) => {
      if (el) el.value = '';
    });
    loadJuniors();
  });

  loadJuniors();
});

/* ── Pagination ──────────────────────────────────────── */
function renderJuniorPagination(container, currentPage, total, limit) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html =
    '<div style="display:flex;gap:8px;justify-content:center;margin-top:20px;flex-wrap:wrap">';
  if (currentPage > 1) {
    html += `<button onclick="goToJuniorPage(${currentPage - 1})" style="padding:6px 12px;border-radius:8px;border:1px solid var(--border);background:var(--bg-elevated);color:var(--text-secondary);cursor:pointer;font-size:13px;transition:.2s">‹ Prev</button>`;
  }
  for (let i = 1; i <= totalPages; i++) {
    const isActive = i === currentPage;
    html += `<button onclick="goToJuniorPage(${i})" style="padding:6px 12px;border-radius:8px;border:1px solid ${isActive ? 'var(--primary)' : 'var(--border)'};background:${isActive ? 'var(--gradient-primary)' : 'var(--bg-elevated)'};color:${isActive ? '#fff' : 'var(--text-secondary)'};cursor:pointer;font-size:13px;font-weight:${isActive ? '700' : '400'};transition:.2s">${i}</button>`;
  }
  if (currentPage < totalPages) {
    html += `<button onclick="goToJuniorPage(${currentPage + 1})" style="padding:6px 12px;border-radius:8px;border:1px solid var(--border);background:var(--bg-elevated);color:var(--text-secondary);cursor:pointer;font-size:13px;transition:.2s">Next ›</button>`;
  }
  html += '</div>';
  container.innerHTML = html;
}

/* ── Invite Modal ────────────────────────────────────── */
function openInviteModal(id, name, branch, year) {
  _inviteTarget = { id, name, branch, year };

  const recipientEl = document.getElementById('modal-recipient');
  if (recipientEl) {
    recipientEl.innerHTML = `
      <div class="avatar avatar-sm">${getInitials(name)}</div>
      <div>
        <div class="modal-recipient-name">${name}</div>
        <div class="modal-recipient-sub">🎓 ${branch || 'N/A'} ${year ? '· Year ' + year : ''}</div>
      </div>`;
  }

  // Clear previous inputs
  ['invite-event', 'invite-role', 'invite-message'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  document.getElementById('invite-modal')?.classList.add('open');
}
window.openInviteModal = openInviteModal;

function closeModal() {
  document.getElementById('invite-modal')?.classList.remove('open');
  _inviteTarget = null;
}

// Close buttons
document.getElementById('modal-close-btn')?.addEventListener('click', closeModal);
document.getElementById('modal-cancel-btn')?.addEventListener('click', closeModal);
document.getElementById('invite-modal')?.addEventListener('click', (e) => {
  if (e.target === document.getElementById('invite-modal')) closeModal();
});

// Send invitation
document.getElementById('invite-send-btn')?.addEventListener('click', async () => {
  if (!_inviteTarget) return;

  const eventName = document.getElementById('invite-event')?.value?.trim();
  const role = document.getElementById('invite-role')?.value?.trim();
  const extra = document.getElementById('invite-message')?.value?.trim();

  if (!eventName || !role) {
    showToast('warning', 'Please fill required fields', 'Event name and role are required.');
    return;
  }

  const message = [
    `🚀 *Team Invitation — ${eventName}*`,
    ``,
    `Hi ${_inviteTarget.name}! I'm looking for a *${role}* to join my team for *${eventName}*.`,
    extra ? `\n${extra}` : '',
    ``,
    `Feel free to reply here if you're interested! 🎓`,
  ]
    .filter((l) => l !== undefined)
    .join('\n');

  const btn = document.getElementById('invite-send-btn');
  btn.disabled = true;
  btn.textContent = 'Sending...';

  try {
    await api.post(`/messages/${_inviteTarget.id}`, { content: message });
    showToast(
      'success',
      'Invitation sent! 🎉',
      `Your invite was delivered to ${_inviteTarget.name}`
    );
    closeModal();
    // Offer quick link to chat
    setTimeout(() => {
      showToast('info', 'Open chat →', `Click to chat with ${_inviteTarget.name}`);
      document.querySelectorAll('.toast-info').forEach((t) => {
        t.style.cursor = 'pointer';
        t.addEventListener('click', () => {
          window.location.href = `messages.html?userId=${_inviteTarget?.id}`;
        });
      });
    }, 500);
  } catch (err) {
    showToast('error', 'Failed to send', err.message);
  }

  btn.disabled = false;
  btn.textContent = '📨 Send Invitation';
});
