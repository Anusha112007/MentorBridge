/* Experiences JS (Placement + Internship Hubs) */
document.addEventListener('DOMContentLoaded', async () => {
  const user = requireAuth();
  if (!user) return;
  renderNavbar();
  renderSidebar(user.role);

  const isPlacement = window.location.pathname.includes('placement');
  const type = isPlacement ? 'placement' : 'internship';
  let page = 1;
  const limit = 12;
  const grid = document.getElementById('exp-grid');
  const paginationEl = document.getElementById('pagination');
  const searchInput = document.getElementById('search-input');
  const companyFilter = document.getElementById('company-filter');
  const totalEl = document.getElementById('total-count');

  async function loadExperiences() {
    if (!grid) return;
    grid.innerHTML = Array(6)
      .fill(0)
      .map(
        () =>
          `<div class="exp-card"><div class="skeleton skeleton-title" style="margin-bottom:8px"></div><div class="skeleton skeleton-text" style="margin-bottom:4px"></div><div class="skeleton skeleton-text" style="width:60%"></div></div>`
      )
      .join('');
    try {
      const params = new URLSearchParams({ page, limit });
      if (searchInput?.value) params.set('search', searchInput.value);
      if (companyFilter?.value) params.set('company', companyFilter.value);
      const data = await api.get(`/experiences/${type}?${params}`);
      if (totalEl) totalEl.textContent = data.total || 0;
      if (!data.experiences?.length) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">${isPlacement ? '🏢' : '💼'}</div><h3>No experiences yet</h3><p>Be the first to share your experience!</p></div>`;
        return;
      }
      grid.innerHTML = data.experiences.map(renderExpCard).join('');
      if (paginationEl)
        renderPagination(paginationEl, page, data.total, limit, (p) => {
          page = p;
          loadExperiences();
        });
    } catch (err) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">⚠️</div><h3>${err.message}</h3></div>`;
    }
  }

  function renderExpCard(e) {
    const likes = e.likes?.length || 0;
    const tags = (e.tags || [])
      .slice(0, 3)
      .map((t) => `<span class="tag">${t}</span>`)
      .join('');
    const preview = isPlacement ? e.process : e.learnings || e.howFound;
    return `
    <div class="exp-card" onclick="location.href='${type === 'placement' ? 'placement' : 'internship'}-detail.html?id=${e._id}'">
      <div class="exp-card-top">
        <div class="company-badge">
          <div class="company-logo">${e.company?.[0]?.toUpperCase() || '?'}</div>
          <div>
            <div class="company-name">${e.company}</div>
            <div class="company-role">${e.role} · ${e.year}</div>
          </div>
        </div>
        ${isPlacement && e.package ? `<span class="badge badge-success">${e.package}</span>` : ''}
        ${!isPlacement && e.duration ? `<span class="badge badge-info">${e.duration}</span>` : ''}
      </div>
      <p class="exp-preview">${preview?.slice(0, 150) || 'Click to read the full experience...'}${preview?.length > 150 ? '...' : ''}</p>
      ${tags ? `<div class="skills-row">${tags}</div>` : ''}
      <div class="exp-footer">
        <div style="display:flex;align-items:center;gap:8px">
          ${renderAvatar(e.author, 'avatar-sm')}
          <span style="font-size:12px;color:var(--text-muted)">${e.author?.name} · ${e.author?.branch || ''}</span>
        </div>
        <button class="like-btn" onclick="event.stopPropagation();toggleLike('${e._id}', this)">❤️ ${likes}</button>
      </div>
    </div>`;
  }

  async function toggleLike(id, btn) {
    try {
      const data = await api.put(`/experiences/${type}/${id}/like`, {});
      btn.innerHTML = `❤️ ${data.likes}`;
      btn.classList.toggle('liked');
    } catch (err) {
      showToast('error', 'Failed', err.message);
    }
  }
  window.toggleLike = toggleLike;

  let debounce;
  [searchInput, companyFilter].forEach((el) => {
    el?.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        page = 1;
        loadExperiences();
      }, 400);
    });
  });

  // Share experience modal
  document.getElementById('share-btn')?.addEventListener('click', () => {
    document.getElementById('share-modal')?.classList.add('active');
  });
  document.getElementById('close-share-modal')?.addEventListener('click', () => {
    document.getElementById('share-modal')?.classList.remove('active');
  });

  document.getElementById('submit-exp')?.addEventListener('click', async () => {
    const company = document.getElementById('exp-company').value.trim();
    const role = document.getElementById('exp-role').value.trim();
    const year = document.getElementById('exp-year').value;
    const process = document.getElementById('exp-process').value.trim();
    if (!company || !role || !process) {
      showToast('warning', 'Fill required fields');
      return;
    }

    const body = { company, role, year: Number(year) || new Date().getFullYear(), process };
    if (isPlacement) {
      body.package = document.getElementById('exp-package')?.value;
      body.prepStrategy = document.getElementById('exp-prep')?.value;
      body.tips = document.getElementById('exp-tips')?.value;
    } else {
      body.duration = document.getElementById('exp-duration')?.value;
      body.howFound = document.getElementById('exp-how')?.value;
      body.learnings = process;
    }
    body.tags = (document.getElementById('exp-tags')?.value || '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const btn = document.getElementById('submit-exp');
    btn.disabled = true;
    btn.textContent = 'Sharing...';
    try {
      await api.post(`/experiences/${type}`, body);
      document.getElementById('share-modal').classList.remove('active');
      showToast('success', 'Experience shared! 🎉');
      loadExperiences();
    } catch (err) {
      showToast('error', 'Failed', err.message);
    }
    btn.disabled = false;
    btn.textContent = 'Share Experience';
  });

  loadExperiences();
});

/* Experience detail page */
if (window.location.pathname.includes('-detail.html')) {
  document.addEventListener('DOMContentLoaded', async () => {
    const user = requireAuth();
    if (!user) return;
    renderNavbar();
    renderSidebar(user.role);

    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) {
      location.href = 'placement-hub.html';
      return;
    }

    const isPlacement = window.location.pathname.includes('placement');
    const type = isPlacement ? 'placement' : 'internship';
    const container = document.getElementById('exp-detail');
    if (!container) return;

    try {
      const data = await api.get(`/experiences/${type}/${id}`);
      const e = data.experience;
      document.title = `${e.company} - ${isPlacement ? 'Placement' : 'Internship'} Experience | MentorBridge`;

      container.innerHTML = `
      <div class="profile-section" style="margin-bottom:16px">
        <div class="exp-card-top" style="margin-bottom:20px">
          <div class="company-badge">
            <div class="company-logo" style="width:60px;height:60px;font-size:1.6rem">${e.company[0]}</div>
            <div>
              <div class="company-name" style="font-size:1.4rem">${e.company}</div>
              <div class="company-role" style="font-size:14px">${e.role} · Batch of ${e.year}</div>
              ${isPlacement && e.package ? `<span class="badge badge-success" style="margin-top:6px">${e.package} LPA</span>` : ''}
              ${!isPlacement && e.duration ? `<span class="badge badge-info" style="margin-top:6px">${e.duration}</span>` : ''}
            </div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;padding-bottom:20px;border-bottom:1px solid var(--border-subtle);margin-bottom:20px">
          ${renderAvatar(e.author)}
          <div>
            <div style="font-weight:600">${e.author?.name}</div>
            <div style="font-size:12px;color:var(--text-muted)">${e.author?.branch} · ${timeAgo(e.createdAt)}</div>
          </div>
          ${e.author?.linkedin ? `<a href="${e.author.linkedin}" target="_blank" class="btn btn-ghost btn-sm" style="margin-left:auto">LinkedIn</a>` : ''}
        </div>
        ${
          isPlacement
            ? `
          ${renderSection('🎯 Interview Process', e.process)}
          ${e.prepStrategy ? renderSection('📚 Preparation Strategy', e.prepStrategy) : ''}
          ${e.questionsAsked ? renderSection('❓ Questions Asked', e.questionsAsked) : ''}
          ${e.tips ? renderSection('💡 Tips', e.tips) : ''}
          ${e.mistakes ? renderSection('⚠️ Mistakes to Avoid', e.mistakes) : ''}
        `
            : `
          ${e.howFound ? renderSection('🔍 How I Found It', e.howFound) : ''}
          ${renderSection('📋 Experience', e.process)}
          ${e.resumeTips ? renderSection('📄 Resume Tips', e.resumeTips) : ''}
          ${e.interviewRounds ? renderSection('🎤 Interview Rounds', e.interviewRounds) : ''}
          ${e.learnings ? renderSection('🌟 Learnings', e.learnings) : ''}
          ${e.resources ? renderSection('🔗 Resources', e.resources) : ''}
        `
        }
        ${e.tags?.length ? `<div class="skills-row" style="margin-top:16px">${e.tags.map((t) => `<span class="tag">${t}</span>`).join('')}</div>` : ''}
      </div>`;
    } catch (err) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><h3>${err.message}</h3></div>`;
    }
  });
}

function renderSection(title, content) {
  return `<div style="margin-bottom:20px"><h4 style="font-size:15px;font-weight:700;margin-bottom:8px;color:var(--text-primary)">${title}</h4><p style="font-size:14px;color:var(--text-secondary);line-height:1.8;white-space:pre-wrap">${content}</p></div>`;
}
