/* Directory JS */
let _paginationCallback = null; // global registry for pagination handler
window.goToPage = function (p) {
  if (_paginationCallback) _paginationCallback(p);
};

document.addEventListener('DOMContentLoaded', async () => {
  const user = requireAuth();
  if (!user) return;
  renderNavbar();
  renderSidebar(user.role);

  let page = 1;
  const limit = 12;
  let filters = {};

  const grid = document.getElementById('seniors-grid');
  const totalEl = document.getElementById('total-count');
  const paginationEl = document.getElementById('pagination');
  const searchInput = document.getElementById('search-input');
  const branchFilter = document.getElementById('branch-filter');
  const skillFilter = document.getElementById('skill-filter');
  const domainFilter = document.getElementById('domain-filter');
  const companyFilter = document.getElementById('company-filter');

  async function loadSeniors() {
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
      const params = new URLSearchParams({ page, limit, ...filters });
      const data = await api.get(`/users/seniors?${params}`);
      if (totalEl) totalEl.textContent = data.total || 0;
      if (!data.seniors?.length) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">🔍</div><h3>No seniors found</h3><p>Try changing your filters</p></div>`;
        if (paginationEl) paginationEl.innerHTML = '';
        return;
      }
      grid.innerHTML = data.seniors.map(renderSeniorCard).join('');
      _paginationCallback = (p) => {
        page = p;
        loadSeniors();
      };
      if (paginationEl) renderPagination(paginationEl, page, data.total, limit);
    } catch (err) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">⚠️</div><h3>Failed to load</h3><p>${err.message}</p></div>`;
    }
  }

  function renderSeniorCard(s) {
    const skills = (s.skills || [])
      .slice(0, 4)
      .map((sk) => `<span class="tag">${sk}</span>`)
      .join('');
    const expertise = (s.areasOfExpertise || [])
      .slice(0, 2)
      .map((e) => `<span class="badge badge-secondary">${e}</span>`)
      .join('');
    const avail = s.availabilityStatus;
    return `
    <div class="senior-card">
      <div class="senior-card-top">
        ${s.profilePicture ? `<div class="avatar avatar-lg"><img src="http://localhost:5000${s.profilePicture}"></div>` : `<div class="avatar avatar-lg">${getInitials(s.name)}</div>`}
        <div class="senior-info">
          <div class="senior-name">${s.name}</div>
          <div class="senior-branch">🎓 ${s.branch || 'N/A'} · ${s.graduationYear ? `Batch of ${s.graduationYear}` : ''}</div>
          ${s.placementCompany ? `<div class="senior-company">🏢 ${s.placementCompany}</div>` : ''}
        </div>
        <div class="availability-badge" title="${avail ? 'Available for mentorship' : 'Currently busy'}">
          <span class="availability-dot ${avail ? '' : 'busy'}"></span>
        </div>
      </div>
      ${s.bio ? `<p class="senior-bio">${s.bio}</p>` : ''}
      <div class="senior-skills">${skills}</div>
      ${expertise ? `<div class="skills-row">${expertise}</div>` : ''}
      <div class="senior-card-footer" style="display:flex; gap:6px; flex-wrap:wrap; justify-content:space-between">
        <a href="profile.html?id=${s._id}" class="btn btn-ghost btn-sm" style="padding:4px 8px">View Profile</a>
        ${
          user.role === 'junior'
            ? `
          <a href="messages.html?userId=${s._id}" class="btn btn-ghost btn-sm" style="color:var(--text-secondary); padding:4px 8px">✉️ Message</a>
          <button class="btn btn-primary btn-sm" onclick="sendRequest('${s._id}', '${s.name}')" style="padding:4px 10px">🤝 Request</button>
        `
            : ''
        }
      </div>
    </div>`;
  }

  async function sendRequest(seniorId, name) {
    const msg = prompt(`Send mentorship request to ${name}?\n\nAdd a message (optional):`);
    if (msg === null) return;
    try {
      await api.post('/mentorship/request', { seniorId, message: msg, goals: '' });
      showToast('success', 'Request sent!', `Your request to ${name} has been sent`);
    } catch (err) {
      showToast('error', 'Failed to send', err.message);
    }
  }
  window.sendRequest = sendRequest;

  // Filter events
  let debounce;
  [searchInput, branchFilter, skillFilter, domainFilter, companyFilter].forEach((el) => {
    el?.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        filters = {};
        if (searchInput?.value) filters.search = searchInput.value;
        if (branchFilter?.value) filters.branch = branchFilter.value;
        if (skillFilter?.value) filters.skills = skillFilter.value;
        if (domainFilter?.value) filters.domain = domainFilter.value;
        if (companyFilter?.value) filters.company = companyFilter.value;
        page = 1;
        loadSeniors();
      }, 400);
    });
  });

  document.getElementById('clear-filters')?.addEventListener('click', () => {
    filters = {};
    page = 1;
    [searchInput, branchFilter, skillFilter, domainFilter, companyFilter].forEach((el) => {
      if (el) el.value = '';
    });
    loadSeniors();
  });

  loadSeniors();
});

function renderPagination(container, currentPage, total, limit) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html =
    '<div style="display:flex;gap:8px;justify-content:center;margin-top:20px;flex-wrap:wrap">';
  if (currentPage > 1) {
    html += `<button onclick="goToPage(${currentPage - 1})" style="padding:6px 12px;border-radius:8px;border:1px solid var(--border);background:var(--bg-elevated);color:var(--text-secondary);cursor:pointer;font-size:13px;transition:.2s">‹ Prev</button>`;
  }
  for (let i = 1; i <= totalPages; i++) {
    const isActive = i === currentPage;
    html += `<button onclick="goToPage(${i})" style="padding:6px 12px;border-radius:8px;border:1px solid ${isActive ? 'var(--primary)' : 'var(--border)'};background:${isActive ? 'var(--gradient-primary)' : 'var(--bg-elevated)'};color:${isActive ? '#fff' : 'var(--text-secondary)'};cursor:pointer;font-size:13px;font-weight:${isActive ? '700' : '400'};transition:.2s">${i}</button>`;
  }
  if (currentPage < totalPages) {
    html += `<button onclick="goToPage(${currentPage + 1})" style="padding:6px 12px;border-radius:8px;border:1px solid var(--border);background:var(--bg-elevated);color:var(--text-secondary);cursor:pointer;font-size:13px;transition:.2s">Next ›</button>`;
  }
  html += '</div>';
  container.innerHTML = html;
}
