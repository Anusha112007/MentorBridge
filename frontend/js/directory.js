/* Directory JS */
let _paginationCallback = null;
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
  const clearBtn = document.getElementById('clear-filters');

  async function loadSeniors() {
    if (!grid) return;
    grid.innerHTML = Array(6)
      .fill(0)
      .map(
        () => `
      <div class="skeleton-card">
        <div style="display:flex;gap:12px;align-items:center;">
          <div class="skeleton-anim skeleton-avatar"></div>
          <div style="flex:1">
            <div class="skeleton-anim skeleton-line" style="width:70%; margin-bottom:8px"></div>
            <div class="skeleton-anim skeleton-line short"></div>
          </div>
        </div>
        <div class="skeleton-anim skeleton-line" style="margin-top:12px"></div>
        <div class="skeleton-anim skeleton-line" style="width:90%"></div>
        <div style="display:flex;gap:8px;margin-top:12px">
          <div class="skeleton-anim skeleton-line tiny"></div>
          <div class="skeleton-anim skeleton-line tiny"></div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:auto">
          <div class="skeleton-anim skeleton-line" style="width:40%;height:32px;border-radius:8px"></div>
          <div class="skeleton-anim skeleton-line" style="width:40%;height:32px;border-radius:8px"></div>
        </div>
      </div>`
      )
      .join('');

    try {
      const params = new URLSearchParams({ page, limit, ...filters });
      const data = await api.get(`/users/seniors?${params}`);

      if (totalEl) totalEl.textContent = data.total || 0;

      if (!data.seniors || data.seniors.length === 0) {
        grid.innerHTML = `
          <div class="empty-state" style="grid-column:1/-1; padding: 40px 20px; text-align: center;">
            <div class="empty-state-icon" style="font-size: 3rem; margin-bottom: 16px;">🔍</div>
            <h3 style="font-size: 18px; font-weight: 700; color: var(--text-primary);">No mentors match your search criteria</h3>
            <p style="color: var(--text-muted); font-size: 13.5px; margin: 8px 0 20px;">Try searching for a different skill or clearing active filters.</p>
            <button class="btn btn-primary btn-sm" id="reset-empty-btn">Clear All Filters</button>
          </div>
        `;
        document.getElementById('reset-empty-btn')?.addEventListener('click', clearAllFilters);
        if (paginationEl) paginationEl.innerHTML = '';
        return;
      }

      grid.innerHTML = data.seniors.map(renderSeniorCard).join('');

      data.seniors.forEach((s) => {
        document
          .getElementById(`view-profile-${s._id}`)
          ?.addEventListener('click', () => openMentorModal(s._id));
        document
          .getElementById(`req-mentorship-${s._id}`)
          ?.addEventListener('click', () => sendRequest(s._id, s.name));
      });

      _paginationCallback = (p) => {
        page = p;
        loadSeniors();
      };
      if (paginationEl) renderPagination(paginationEl, page, data.total, limit);
    } catch (err) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">⚠️</div><h3>Failed to load mentors</h3><p>${err.message}</p></div>`;
    }
  }

  function renderSeniorCard(s) {
    const skills = (s.skills || [])
      .slice(0, 3)
      .map((sk) => `<span class="tag" style="font-size:11px;padding:3px 8px">${sk}</span>`)
      .join('');
    const expertise = (s.areasOfExpertise || [])
      .slice(0, 2)
      .map((e) => `<span class="badge badge-secondary" style="font-size:11px">${e}</span>`)
      .join('');

    const avail = s.availabilityStatus !== false;
    const initials = getInitials(s.name);

    const academicYear = s.currentYear
      ? `Year ${s.currentYear} Student`
      : s.graduationYear
        ? `Batch of ${s.graduationYear}`
        : 'Senior CSE';

    return `
    <div class="senior-card" style="display:flex; flex-direction:column; justify-content:space-between">
      <div>
        <div class="senior-card-top" style="align-items:flex-start">
          ${s.profilePicture ? `<div class="avatar avatar-lg"><img src="http://localhost:5000${s.profilePicture}"></div>` : `<div class="avatar avatar-lg" style="background:var(--gradient-primary);color:#fff;font-weight:700">${initials}</div>`}
          <div class="senior-info" style="margin-left: 12px">
            <div class="senior-name" style="font-size: 15px">${s.name}</div>
            <div class="senior-branch" style="font-size: 12px; color:var(--text-muted); margin-top:2px">🎓 ${academicYear}</div>
            ${s.placementCompany ? `<div class="senior-company" style="font-size: 12px; font-weight:600; color:var(--primary-light)">🏢 Placed at ${s.placementCompany}</div>` : ''}
          </div>
        </div>
        
        <div class="card-rating-mentees">
          <span class="avail-status-tag ${avail ? 'available' : 'busy'}">${avail ? 'Available for Mentorship' : 'Busy'}</span>
        </div>
        
        ${s.bio ? `<p class="senior-bio" style="font-size:13px; line-height:1.5; color:var(--text-secondary); margin-bottom:12px">${s.bio}</p>` : ''}
      </div>
      
      <div>
        <div class="senior-skills" style="margin-bottom:8px">${skills}</div>
        ${expertise ? `<div class="skills-row" style="margin-bottom:12px">${expertise}</div>` : ''}
        
        <div class="senior-card-footer" style="padding-top:12px; border-top:1px solid var(--border-subtle); display:flex; gap:6px; flex-wrap:wrap; justify-content:space-between">
          <button id="view-profile-${s._id}" class="btn btn-ghost btn-sm" style="flex:1; justify-content:center">View Profile</button>
          ${
            user.role === 'junior'
              ? `<button id="req-mentorship-${s._id}" class="btn btn-primary btn-sm" style="flex:1; justify-content:center; gap:4px">🤝 Connect</button>`
              : ''
          }
        </div>
      </div>
    </div>`;
  }

  async function openMentorModal(id) {
    const modal = document.getElementById('mentor-detail-modal');
    const modalBody = document.getElementById('mentor-modal-body');
    if (!modal || !modalBody) return;

    modalBody.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-muted);font-size:14px"><div class="animate-spin" style="font-size:1.8rem;margin-bottom:10px">⏳</div>Loading profile spotlight...</div>`;
    modal.classList.add('active');

    try {
      const data = await api.get(`/users/${id}`);
      const m = data.user;

      const initials = getInitials(m.name);
      const avail = m.availabilityStatus !== false;
      const academicYear = m.currentYear
        ? `Year ${m.currentYear} CSE Student`
        : m.graduationYear
          ? `CSE Batch of ${m.graduationYear}`
          : 'Senior Mentor';

      const githubUrl = m.github || '';
      const linkedinUrl = m.linkedin || '';
      const leetcodeUrl = m.leetcode || '';

      const skillsHtml = (m.skills || []).map((s) => `<span class="tag">${s}</span>`).join('');
      const expertisesHtml = (m.areasOfExpertise || [])
        .map((e) => `<span class="badge badge-secondary">${e}</span>`)
        .join('');
      const focusHtml = (m.areasOfMentorship || [])
        .map(
          (f) =>
            `<span class="badge badge-info" style="background:rgba(99,102,241,0.15);color:var(--primary-light)">🎯 ${f}</span>`
        )
        .join('');

      const projectsHtml = (m.projects || [])
        .map(
          (p) => `
        <div style="background:var(--bg-elevated);border:1px solid var(--border-subtle);border-radius:12px;padding:12px 16px;margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <h5 style="font-size:13.5px;font-weight:700;color:var(--text-primary);margin:0">${p.title}</h5>
            ${p.link ? `<a href="${p.link}" target="_blank" style="font-size:11px;color:var(--primary-light);text-decoration:none">🔗 Code Repo</a>` : ''}
          </div>
          <p style="font-size:12px;color:var(--text-secondary);margin:6px 0 0;line-height:1.5">${p.description}</p>
        </div>
      `
        )
        .join('');

      const certsHtml = (m.certifications || [])
        .map(
          (c) => `
        <div style="display:flex;align-items:center;justify-content:space-between;background:var(--bg-elevated);border-radius:10px;padding:10px 14px;border:1px solid var(--border-subtle);margin-bottom:8px">
          <div>
            <div style="font-size:13px;font-weight:700;color:var(--text-primary)">🏆 ${c.name}</div>
            <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">Issued by ${c.issuer}</div>
          </div>
        </div>
      `
        )
        .join('');

      const reviewsHtml = (m.reviews || [])
        .map(
          (r) => `
        <div class="review-item-modal">
          <div class="review-item-header">
            <span class="review-item-author">${r.reviewerName}</span>
          </div>
          <p class="review-item-text">"${r.comment}"</p>
        </div>
      `
        )
        .join('');

      modalBody.innerHTML = `
        <div class="mentor-profile-header">
          ${m.profilePicture ? `<img src="http://localhost:5000${m.profilePicture}" alt="${m.name}">` : `<div class="mentor-modal-initials">${initials}</div>`}
          <div class="mentor-profile-info">
            <h2 class="mentor-profile-name" style="margin:0">${m.name}</h2>
            <div class="mentor-profile-meta" style="margin-top:4px">🎓 ${academicYear}</div>
            ${m.placementCompany ? `<div style="font-size:13px;color:var(--success);font-weight:700;margin-top:4px">🏢 Placed at ${m.placementCompany}</div>` : ''}
            
            <div style="display:flex;align-items:center;gap:12px;margin-top:10px;flex-wrap:wrap">
              <span class="avail-status-tag ${avail ? 'available' : 'busy'}">${avail ? '🟢 Available for Mentorship' : '🔴 Busy'}</span>
            </div>

            <!-- Coding Profiles Badges -->
            <div class="coding-profiles-container" style="margin-top:12px">
              ${linkedinUrl ? `<a href="${linkedinUrl}" target="_blank" class="coding-badge linkedin">LinkedIn</a>` : ''}
              ${githubUrl ? `<a href="${githubUrl}" target="_blank" class="coding-badge github">GitHub</a>` : ''}
              ${leetcodeUrl ? `<a href="${leetcodeUrl}" target="_blank" class="coding-badge leetcode">LeetCode</a>` : ''}
            </div>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:16px">
          <!-- Bio -->
          ${
            m.bio
              ? `
            <div>
              <div class="section-title-modal">💡 About Me</div>
              <p style="font-size:13.5px;line-height:1.6;color:var(--text-secondary);margin:0">${m.bio}</p>
            </div>
          `
              : ''
          }

          <!-- Skills & Mentorship -->
          <div>
            <div class="section-title-modal">🛠️ Skills & Mentorship Focus</div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px">${skillsHtml || '<span style="color:var(--text-muted);font-size:12px">None specified</span>'}</div>
            ${
              expertisesHtml || focusHtml
                ? `
              <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px">
                ${expertisesHtml}
                ${focusHtml}
              </div>
            `
                : ''
            }
          </div>

          <!-- Projects -->
          <div>
            <div class="section-title-modal">💻 Featured Projects</div>
            <div style="display:flex;flex-direction:column;gap:6px">${projectsHtml || '<div style="color:var(--text-muted);font-size:12.5px">No projects listed yet.</div>'}</div>
          </div>

          <!-- Certifications -->
          <div>
            <div class="section-title-modal">📜 Certifications</div>
            <div style="display:flex;flex-direction:column;gap:6px">${certsHtml || '<div style="color:var(--text-muted);font-size:12.5px">No certifications listed yet.</div>'}</div>
          </div>

          <!-- Reviews -->
          <div>
            <div class="section-title-modal">💬 Student Testimonials</div>
            <div class="reviews-list">${reviewsHtml || '<div style="color:var(--text-muted);font-size:12.5px">No student reviews yet.</div>'}</div>
          </div>
        </div>

        <!-- Footer Modal Buttons -->
        <div style="display:flex;gap:12px;margin-top:28px;border-top:1px solid var(--border-subtle);padding-top:20px;justify-content:flex-end">
          <button class="btn btn-secondary" onclick="document.getElementById('mentor-detail-modal').classList.remove('active')">Close</button>
          ${
            user.role === 'junior'
              ? `<button class="btn btn-primary" onclick="sendRequestFromModal('${m._id}', '${m.name}')">🤝 Request Mentorship</button>`
              : ''
          }
        </div>
      `;

      window.sendRequestFromModal = (sid, sname) => {
        modal.classList.remove('active');
        sendRequest(sid, sname);
      };
    } catch (err) {
      modalBody.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><h3>Failed to load mentor spotlight</h3><p>${err.message}</p></div>`;
    }
  }

  async function sendRequest(seniorId, name) {
    const msg = prompt(`Send mentorship request to ${name}?\n\nAdd a message for ${name}:`);
    if (msg === null) return;
    try {
      await api.post('/mentorship/request', { seniorId, message: msg, goals: '' });
      showToast(
        'success',
        'Mentorship request sent!',
        `Your request has been delivered to ${name}`
      );
    } catch (err) {
      showToast('error', 'Request failed', err.message);
    }
  }
  window.sendRequest = sendRequest;

  let searchDebounce;
  searchInput?.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      filters.search = searchInput.value.trim();
      page = 1;
      loadSeniors();
    }, 300);
  });

  document.querySelectorAll('.filter-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.filter-pill').forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');

      const filterValue = pill.dataset.filter || '';
      if (filterValue) {
        filters.domain = filterValue;
      } else {
        delete filters.domain;
      }

      page = 1;
      loadSeniors();
    });
  });

  function clearAllFilters() {
    filters = {};
    page = 1;
    if (searchInput) searchInput.value = '';
    document.querySelectorAll('.filter-pill').forEach((p) => p.classList.remove('active'));
    document.querySelector('.filter-pill[data-filter=""]')?.classList.add('active');
    loadSeniors();
  }

  clearBtn?.addEventListener('click', clearAllFilters);

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
