/* Messages JS */
document.addEventListener('DOMContentLoaded', async () => {
  const user = requireAuth();
  if (!user) return;
  renderNavbar();
  renderSidebar(user.role);

  const convList = document.getElementById('conv-list');
  const chatPanel = document.getElementById('chat-panel');
  const chatMessages = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-input');
  const chatSendBtn = document.getElementById('chat-send');
  const chatHeader = document.getElementById('chat-header');

  let activeUserId = null;
  let pollInterval = null;

  // Load conversations
  async function loadConversations() {
    if (!convList) return;
    try {
      const data = await api.get('/messages/conversations');
      const convs = data.conversations || [];
      if (!convs.length) {
        convList.innerHTML = `<div style="padding:24px;text-align:center;color:var(--text-muted);font-size:14px">No conversations yet</div>`;
        return;
      }
      convList.innerHTML = convs
        .map((msg) => {
          const other = msg.sender?._id === user._id ? msg.receiver : msg.sender;
          return `
        <div class="conv-item ${activeUserId === other?._id ? 'active' : ''}" onclick="openChat('${other?._id}', '${other?.name}', '${other?.role}')">
          ${renderAvatar(other, 'avatar-sm')}
          <div class="conv-info">
            <div class="conv-name">${other?.name || 'Unknown'}</div>
            <div class="conv-preview">${msg.content?.slice(0, 40) || (msg.attachment ? '📎 Attachment' : '')}</div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
            <div class="conv-time">${timeAgo(msg.createdAt)}</div>
            ${!msg.read && msg.receiver?._id === user._id ? `<div class="conv-unread"></div>` : ''}
          </div>
        </div>`;
        })
        .join('');
    } catch (err) {
      console.error(err);
    }
  }

  // Open chat
  window.openChat = async function (userId, name, role) {
    activeUserId = userId;
    clearInterval(pollInterval);

    if (chatPanel) chatPanel.style.display = 'flex';
    if (chatHeader)
      chatHeader.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px">
        <div class="avatar avatar-sm">${name?.[0]?.toUpperCase() || '?'}</div>
        <div>
          <div style="font-weight:600;font-size:14px">${name}</div>
          <div style="font-size:11px;color:var(--text-muted);text-transform:capitalize">${role}</div>
        </div>
      </div>`;

    await loadMessages();
    loadConversations();
    // Poll every 5s
    pollInterval = setInterval(loadMessages, 5000);
    chatInput?.focus();
  };

  async function loadMessages() {
    if (!activeUserId || !chatMessages) return;
    try {
      const data = await api.get(`/messages/${activeUserId}`);
      const msgs = data.messages || [];
      const wasAtBottom =
        chatMessages.scrollHeight - chatMessages.scrollTop <= chatMessages.clientHeight + 100;
      chatMessages.innerHTML = msgs.length
        ? msgs.map((m) => renderMessage(m)).join('')
        : `<div class="chat-empty"><div class="icon">💬</div><p>Start the conversation!</p></div>`;
      if (wasAtBottom || chatMessages.children.length < 5)
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (err) {
      console.error(err);
    }
  }

  function renderMessage(m) {
    const isOwn = m.sender?._id === user._id;
    return `
    <div class="msg-bubble ${isOwn ? 'own' : ''}">
      ${!isOwn ? renderAvatar(m.sender, 'avatar-sm') : ''}
      <div>
        <div class="msg-content">
          ${m.content || ''}
          ${m.attachment ? `<div style="margin-top:8px"><a href="http://localhost:5000${m.attachment}" target="_blank" class="btn btn-ghost btn-sm">📎 Attachment</a></div>` : ''}
        </div>
        <div class="msg-time">${timeAgo(m.createdAt)}</div>
      </div>
    </div>`;
  }

  // Send message
  async function sendMessage() {
    if (!activeUserId) return;
    const content = chatInput?.value?.trim();
    if (!content) return;
    chatInput.value = '';
    try {
      await api.post(`/messages/${activeUserId}`, { content });
      await loadMessages();
      loadConversations();
    } catch (err) {
      showToast('error', 'Failed to send', err.message);
    }
  }

  chatSendBtn?.addEventListener('click', sendMessage);
  chatInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Open from URL param
  const params = new URLSearchParams(window.location.search);
  if (params.get('userId')) {
    const targetUser = await api.get(`/users/${params.get('userId')}`).catch(() => null);
    if (targetUser?.user) openChat(targetUser.user._id, targetUser.user.name, targetUser.user.role);
  }

  loadConversations();
});
