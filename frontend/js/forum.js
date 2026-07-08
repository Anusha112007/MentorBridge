/* Forum JS */
document.addEventListener('DOMContentLoaded', async () => {
  const user = requireAuth();
  if (!user) return;
  renderNavbar();
  renderSidebar(user.role);

  let page = 1,
    currentCategory = '',
    currentSort = 'newest';
  const limit = 15;

  const list = document.getElementById('questions-list');
  const totalEl = document.getElementById('total-count');
  const paginationEl = document.getElementById('pagination');
  const searchInput = document.getElementById('search-input');

  async function loadQuestions() {
    if (!list) return;
    list.innerHTML = Array(5)
      .fill(0)
      .map(
        () =>
          `<div class="question-card" style="margin-bottom:12px"><div class="skeleton skeleton-title" style="margin-bottom:8px"></div><div class="skeleton skeleton-text" style="margin-bottom:4px"></div><div class="skeleton skeleton-text" style="width:70%"></div></div>`
      )
      .join('');
    try {
      const params = new URLSearchParams({ page, limit, sort: currentSort });
      if (currentCategory) params.set('category', currentCategory);
      if (searchInput?.value) params.set('search', searchInput.value);
      const data = await api.get(`/questions?${params}`);
      if (totalEl) totalEl.textContent = data.total || 0;
      if (!data.questions?.length) {
        list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">💬</div><h3>No questions yet</h3><p>Be the first to ask!</p></div>`;
        return;
      }
      list.innerHTML = data.questions.map(renderQuestion).join('');
      if (paginationEl)
        renderPagination(paginationEl, page, data.total, limit, (p) => {
          page = p;
          loadQuestions();
        });
    } catch (err) {
      list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><h3>Failed to load</h3><p>${err.message}</p></div>`;
    }
  }

  function renderQuestion(q) {
    const author = q.isAnonymous ? { name: 'Anonymous' } : q.author;
    const answerCount = q.answers?.length || 0;
    const upvotes = q.upvotes?.length || 0;
    const hasAccepted = !!q.acceptedAnswer;
    const tags = (q.tags || []).map((t) => `<span class="tag">${t}</span>`).join('');
    return `
    <div class="question-card" onclick="location.href='question-detail.html?id=${q._id}'" style="margin-bottom:12px;cursor:pointer">
      <div class="question-header">
        <div class="question-vote">
          <div class="vote-count">${upvotes}</div>
          <div class="vote-label">votes</div>
        </div>
        <div class="question-body">
          <div class="question-title">${q.title}</div>
          <div class="question-excerpt">${q.body?.slice(0, 150)}${q.body?.length > 150 ? '...' : ''}</div>
          <div class="question-meta">
            <span class="question-meta-item">
              ${q.isAnonymous ? `<span class="anon-tag">🎭 Anonymous</span>` : renderAvatar(author, 'avatar-sm') + ` ${author?.name}`}
            </span>
            <span class="question-meta-item">👁️ ${q.views || 0}</span>
            <span class="answer-count ${hasAccepted ? 'has-accepted' : ''}">
              ${hasAccepted ? '✅' : '💬'} ${answerCount} ${answerCount === 1 ? 'answer' : 'answers'}
            </span>
            <span class="badge badge-ghost">${q.category}</span>
            <span class="text-muted">${timeAgo(q.createdAt)}</span>
          </div>
          ${tags ? `<div class="skills-row" style="margin-top:8px">${tags}</div>` : ''}
        </div>
      </div>
    </div>`;
  }

  // Category tabs
  document.querySelectorAll('.cat-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-tab').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.cat || '';
      page = 1;
      loadQuestions();
    });
  });

  // Sort
  document.querySelectorAll('.sort-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sort-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentSort = btn.dataset.sort;
      page = 1;
      loadQuestions();
    });
  });

  let debounce;
  searchInput?.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      page = 1;
      loadQuestions();
    }, 400);
  });

  // Ask question modal
  document.getElementById('ask-btn')?.addEventListener('click', () => {
    document.getElementById('ask-modal')?.classList.add('active');
  });
  document.getElementById('close-ask-modal')?.addEventListener('click', () => {
    document.getElementById('ask-modal')?.classList.remove('active');
  });

  document.getElementById('submit-question')?.addEventListener('click', async () => {
    const title = document.getElementById('q-title').value.trim();
    const body = document.getElementById('q-body').value.trim();
    const category = document.getElementById('q-category').value;
    const tags = document.getElementById('q-tags').value;
    const isAnonymous = document.getElementById('q-anon').checked;
    if (!title || !body) {
      showToast('warning', 'Title and description required');
      return;
    }
    const btn = document.getElementById('submit-question');
    btn.disabled = true;
    btn.textContent = 'Posting...';
    try {
      await api.post('/questions', { title, body, category, tags, isAnonymous });
      document.getElementById('ask-modal').classList.remove('active');
      showToast('success', 'Question posted!');
      document.getElementById('q-title').value = '';
      document.getElementById('q-body').value = '';
      loadQuestions();
    } catch (err) {
      showToast('error', 'Failed to post', err.message);
    }
    btn.disabled = false;
    btn.textContent = 'Post Question';
  });

  loadQuestions();
});
