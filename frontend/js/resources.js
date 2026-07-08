/* Resources + Subject Guidance JS */
document.addEventListener('DOMContentLoaded', async () => {
  const user = requireAuth();
  if (!user) return;
  renderNavbar();
  renderSidebar(user.role);

  const isSubjectPage = window.location.pathname.includes('subject-guidance');

  if (isSubjectPage) {
    loadSubjectGuidance();
    return;
  }

  let page = 1,
    currentCategory = '',
    currentType = '';
  const limit = 15;
  const grid = document.getElementById('resources-grid');
  const paginationEl = document.getElementById('pagination');
  const searchInput = document.getElementById('search-input');

  async function loadResources() {
    if (!grid) return;
    grid.innerHTML = Array(6)
      .fill(0)
      .map(
        () =>
          `<div class="resource-card"><div class="skeleton" style="height:44px;width:44px;border-radius:10px;margin-bottom:12px"></div><div class="skeleton skeleton-title" style="margin-bottom:6px"></div><div class="skeleton skeleton-text"></div></div>`
      )
      .join('');
    try {
      const params = new URLSearchParams({ page, limit });
      if (currentCategory) params.set('category', currentCategory);
      if (currentType) params.set('type', currentType);
      if (searchInput?.value) params.set('search', searchInput.value);
      const data = await api.get(`/resources?${params}`);
      document.getElementById('total-count') &&
        (document.getElementById('total-count').textContent = data.total || 0);
      if (!data.resources?.length) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">📚</div><h3>No resources found</h3><p>Be the first to upload one!</p></div>`;
        return;
      }
      grid.innerHTML = data.resources.map(renderResourceCard).join('');
      if (paginationEl)
        renderPagination(paginationEl, page, data.total, limit, (p) => {
          page = p;
          loadResources();
        });
    } catch (err) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">⚠️</div><h3>${err.message}</h3></div>`;
    }
  }

  const typeIcons = {
    pdf: '📄',
    notes: '📝',
    'drive-link': '🔗',
    'video-link': '🎬',
    article: '📰',
    other: '📦',
  };
  const catColors = {
    dsa: 'badge-primary',
    'web-dev': 'badge-info',
    'ai-ml': 'badge-secondary',
    aptitude: 'badge-warning',
    resume: 'badge-success',
    'core-subjects': 'badge-ghost',
    other: 'badge-ghost',
  };

  function renderResourceCard(r) {
    const likes = r.likes?.length || 0;
    return `
    <div class="resource-card">
      <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:8px">
        <div class="resource-type-icon" style="background:var(--bg-elevated)">${typeIcons[r.type] || '📦'}</div>
        <div>
          <span class="badge ${catColors[r.category] || 'badge-ghost'}" style="margin-bottom:6px">${r.category}</span>
          <div class="resource-title">${r.title}</div>
        </div>
      </div>
      ${r.description ? `<p class="resource-desc">${r.description}</p>` : ''}
      <div class="resource-footer">
        <div class="resource-stats">
          <span class="resource-stat">❤️ ${likes}</span>
          <span class="resource-stat">⬇️ ${r.downloads || 0}</span>
          <span class="resource-stat" style="color:var(--text-muted);font-size:11px">${timeAgo(r.createdAt)}</span>
        </div>
        <a href="${r.url?.startsWith('/uploads') ? 'http://localhost:5000' + r.url : r.url}" target="_blank"
           class="btn btn-primary btn-sm" onclick="trackDownload('${r._id}')">
          ${r.type === 'pdf' || r.type === 'notes' ? '⬇️ Download' : '🔗 Open'}
        </a>
      </div>
    </div>`;
  }

  async function trackDownload(id) {
    await api.put(`/resources/${id}/download`, {}).catch(() => {});
  }
  window.trackDownload = trackDownload;

  // Category pills
  document.querySelectorAll('.cat-pill').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-pill').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.cat || '';
      page = 1;
      loadResources();
    });
  });

  // Type filter
  document.getElementById('type-filter')?.addEventListener('change', (e) => {
    currentType = e.target.value;
    page = 1;
    loadResources();
  });

  let debounce;
  searchInput?.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      page = 1;
      loadResources();
    }, 400);
  });

  // Upload modal
  document.getElementById('upload-btn')?.addEventListener('click', () => {
    document.getElementById('upload-modal')?.classList.add('active');
  });
  document.getElementById('close-upload-modal')?.addEventListener('click', () => {
    document.getElementById('upload-modal')?.classList.remove('active');
  });

  document.getElementById('submit-resource')?.addEventListener('click', async () => {
    const title = document.getElementById('res-title').value.trim();
    const category = document.getElementById('res-category').value;
    const type = document.getElementById('res-type').value;
    const url = document.getElementById('res-url').value.trim();
    const description = document.getElementById('res-description').value.trim();
    const tags = document.getElementById('res-tags').value;
    if (!title || !category || !type) {
      showToast('warning', 'Fill required fields');
      return;
    }

    const fd = new FormData();
    fd.append('title', title);
    fd.append('category', category);
    fd.append('type', type);
    fd.append('description', description);
    fd.append('tags', tags);
    if (url) fd.append('url', url);
    const fileInput = document.getElementById('res-file');
    if (fileInput?.files?.[0]) fd.append('file', fileInput.files[0]);

    const btn = document.getElementById('submit-resource');
    btn.disabled = true;
    btn.textContent = 'Uploading...';
    try {
      await api.postForm('/resources', fd);
      document.getElementById('upload-modal').classList.remove('active');
      showToast('success', 'Resource shared! 🎉');
      loadResources();
    } catch (err) {
      showToast('error', 'Failed', err.message);
    }
    btn.disabled = false;
    btn.textContent = 'Share Resource';
  });

  loadResources();
});

async function loadSubjectGuidance() {
  const container = document.getElementById('subjects-accordion');
  if (!container) return;
  container.innerHTML = `<div class="empty-state"><div class="animate-spin" style="font-size:2rem">⏳</div></div>`;
  try {
    const data = await api.get('/resources/subjects');
    const semesters = data.semesters || {};

    container.innerHTML = Object.entries(semesters)
      .map(([semName, subjects]) => {
        const semId = `sem-${semName.replace(/\s/g, '-')}`;
        return `
      <div class="semester-section" id="${semId}" style="margin-bottom:36px; scroll-margin-top: 80px">
        <h2 style="font-size:18px;font-weight:800;margin-bottom:16px;color:var(--primary);display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--border-subtle);padding-bottom:8px">
          <span>📚</span> ${semName}
        </h2>
        <div class="subject-accordion" style="display:flex;flex-direction:column;gap:12px">
          ${Object.entries(subjects)
            .map(([name, resources]) => {
              const subId = `sub-${name.replace(/\s/g, '-')}`;
              return `
            <div class="subject-item" id="${subId}">
              <div class="subject-header" onclick="toggleSubject('${subId}')">
                <div class="subject-title-row">
                  <span class="subject-icon">${subjectIcons[name] || '📖'}</span>
                  <div>
                    <div class="subject-name">${name}</div>
                    <div class="subject-count">${resources.length} resource${resources.length !== 1 ? 's' : ''}</div>
                  </div>
                </div>
                <span class="subject-chevron">▼</span>
              </div>
              <div class="subject-body">
                ${
                  resources.length
                    ? `
                <div class="subject-resources" style="display:flex;flex-direction:column;gap:8px">
                  ${resources
                    .map(
                      (r) => `
                  <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;background:var(--bg-elevated);border-radius:10px">
                    <div style="display:flex;align-items:center;gap:10px">
                      <span style="font-size:1.2rem">${{ pdf: '📄', notes: '📝', 'drive-link': '🔗', 'video-link': '🎬', article: '📰', other: '📦' }[r.type] || '📦'}</span>
                      <div>
                        <div style="font-size:13px;font-weight:600;color:var(--text-primary)">${r.title}</div>
                        <div style="font-size:11px;color:var(--text-muted)">${r.uploadedBy?.name || 'Anonymous'} · ${timeAgo(r.createdAt)}</div>
                      </div>
                    </div>
                    <a href="${r.url?.startsWith('/uploads') ? 'http://localhost:5000' + r.url : r.url}" target="_blank" class="btn btn-primary btn-sm">Open</a>
                  </div>`
                    )
                    .join('')}
                </div>`
                    : `<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:13px">No resources yet for this subject</div>`
                }
              </div>
            </div>`;
            })
            .join('')}
        </div>
      </div>`;
      })
      .join('');
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><h3>${err.message}</h3></div>`;
  }
}

const subjectIcons = {
  // Semester I
  LAC: '🧮',
  'ENGG. GRAP': '📐',
  CHEM: '🧪',
  BCME: '🏗️',
  HWYS: '🏃',
  'C-LANG': '💻',
  'CHEM LAB': '🥼',
  CPL: '🖥️',
  EWS: '🔧',

  // Semester II
  NSS: '🤝',
  DEVC: '📈',
  EP: '⚛️',
  CE: '🗣️',
  BEEE: '⚡',
  DS: '📊',
  'CE LAB': '🎙️',
  'EP LAB': '🔮',
  'EEE LAB': '🔌',
  'DS LAB': '🗄️',
  'IT WS': '🛠️',

  // Semester III
  MFCS: '✍️',
  UHV: '🤍',
  'DL&CO': '💾',
  SE: '⚙️',
  'OOPS JAVA': '☕',
  ES: '🌱',
  'CT Lab': '🎛️',
  'JAVA LAB': '💻',
  FSD: '🥞',

  // Higher Semesters
  DBMS: '🗃️',
  'Operating Systems': '⚙️',
  'Computer Networks': '🌐',
  'Python Programming': '🐍',
};

function toggleSubject(id) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('open');
}
window.toggleSubject = toggleSubject;

function scrollToSemester(id) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' });
    el.style.transition = 'all 0.5s ease';
    el.style.transform = 'scale(1.01)';
    setTimeout(() => {
      el.style.transform = 'scale(1)';
    }, 500);
  }
}
window.scrollToSemester = scrollToSemester;
