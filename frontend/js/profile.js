/* Profile + Edit Profile JS */
document.addEventListener('DOMContentLoaded', async () => {
  const user = requireAuth();
  if (!user) return;
  renderNavbar();
  renderSidebar(user.role);

  const isEdit = window.location.pathname.includes('edit-profile');
  if (isEdit) {
    initEditProfile(user);
    return;
  }

  // View profile
  const id = new URLSearchParams(window.location.search).get('id') || user._id;
  const container = document.getElementById('profile-container');
  if (!container) return;

  try {
    const data = await api.get(`/users/${id}`);
    const u = data.user;
    document.title = `${u.name} | MentorBridge`;

    const isOwn = u._id === user._id;
    const initials = getInitials(u.name);

    container.innerHTML = `
    <div class="profile-hero">
      <div class="profile-top">
        <div class="profile-avatar">
          ${u.profilePicture ? `<img src="http://localhost:5000${u.profilePicture}" alt="${u.name}">` : initials}
        </div>
        <div class="profile-meta">
          <h1>${u.name}</h1>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:4px">
            <span class="badge badge-primary">${u.role}</span>
            ${u.branch ? `<span class="badge badge-ghost">🎓 ${u.branch}</span>` : ''}
            ${u.role === 'senior' ? `<span class="badge badge-ghost">Batch ${u.graduationYear || ''}</span>` : `<span class="badge badge-ghost">Year ${u.currentYear || ''}</span>`}
            ${u.role === 'senior' && u.availabilityStatus !== undefined ? `<span class="badge ${u.availabilityStatus ? 'badge-success' : 'badge-warning'}">${u.availabilityStatus ? '🟢 Available' : '🟡 Busy'}</span>` : ''}
          </div>
          ${u.bio ? `<p style="margin-top:12px;font-size:14px;color:var(--text-secondary);max-width:600px">${u.bio}</p>` : ''}
          <div class="profile-links">
            ${u.linkedin ? `<a href="${u.linkedin}" target="_blank" class="profile-link">🔗 LinkedIn</a>` : ''}
            ${u.github ? `<a href="${u.github}" target="_blank" class="profile-link">🐙 GitHub</a>` : ''}
            ${u.placementCompany ? `<span class="profile-link">🏢 ${u.placementCompany}</span>` : ''}
          </div>
        </div>
        <div style="margin-left:auto;display:flex;gap:8px;flex-direction:column">
          ${
            isOwn
              ? `<a href="edit-profile.html" class="btn btn-secondary btn-sm">✏️ Edit Profile</a>`
              : user.role === 'junior' && u.role === 'senior'
                ? `<button class="btn btn-primary btn-sm" onclick="sendRequest('${u._id}', '${u.name}')">🤝 Request Mentorship</button><a href="messages.html?userId=${u._id}" class="btn btn-ghost btn-sm">✉️ Message</a>`
                : `<a href="messages.html?userId=${u._id}" class="btn btn-ghost btn-sm">✉️ Message</a>`
          }
        </div>
      </div>
      ${u.skills?.length ? `<div class="profile-skills-section"><h4>Skills</h4><div class="skills-row">${u.skills.map((s) => `<span class="tag">${s}</span>`).join('')}</div></div>` : ''}
      ${u.areasOfExpertise?.length ? `<div class="profile-skills-section" style="margin-top:12px"><h4>Areas of Expertise</h4><div class="skills-row">${u.areasOfExpertise.map((s) => `<span class="badge badge-secondary">${s}</span>`).join('')}</div></div>` : ''}
      ${u.interests?.length ? `<div class="profile-skills-section" style="margin-top:12px"><h4>Interests</h4><div class="skills-row">${u.interests.map((s) => `<span class="badge badge-info">${s}</span>`).join('')}</div></div>` : ''}
    </div>
    ${u.careerGoals ? `<div class="profile-section"><h3>🎯 Career Goals</h3><p style="font-size:14px;color:var(--text-secondary)">${u.careerGoals}</p></div>` : ''}
    `;

    async function sendRequest(seniorId, name) {
      const msg = prompt(`Send mentorship request to ${name}?\nAdd a message:`);
      if (msg === null) return;
      try {
        await api.post('/mentorship/request', { seniorId, message: msg });
        showToast('success', 'Request sent!');
      } catch (err) {
        showToast('error', 'Failed', err.message);
      }
    }
    window.sendRequest = sendRequest;
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><h3>${err.message}</h3></div>`;
  }
});

async function initEditProfile(_user) {
  const saveBtn = document.getElementById('save-btn');
  if (!saveBtn) return;

  // Load current data
  try {
    const data = await api.get('/users/me');
    const u = data.user;
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || '';
    };
    set('name', u.name);
    set('bio', u.bio);
    set('branch', u.branch);
    set('linkedin', u.linkedin);
    set('github', u.github);
    set('skills', (u.skills || []).join(', '));
    set('areasOfExpertise', (u.areasOfExpertise || []).join(', '));
    set('interests', (u.interests || []).join(', '));
    set('careerGoals', u.careerGoals);
    set('placementCompany', u.placementCompany);
    set('currentYear', u.currentYear);
    set('graduationYear', u.graduationYear);
    if (document.getElementById('availability'))
      document.getElementById('availability').checked = u.availabilityStatus;
    if (u.profilePicture) {
      const preview = document.getElementById('avatar-preview');
      if (preview) {
        preview.innerHTML = `<img src="http://localhost:5000${u.profilePicture}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius-2xl)">`;
      }
    }
  } catch (err) {
    showToast('error', 'Failed to load profile', err.message);
  }

  // Avatar preview
  document.getElementById('profile-pic-input')?.addEventListener('change', function () {
    const file = this.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = document.getElementById('avatar-preview');
      if (preview)
        preview.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius-2xl)">`;
    };
    reader.readAsDataURL(file);
  });

  // Save
  document.getElementById('save-btn')?.addEventListener('click', async () => {
    const fd = new FormData();
    const fields = [
      'name',
      'bio',
      'branch',
      'linkedin',
      'github',
      'skills',
      'areasOfExpertise',
      'interests',
      'careerGoals',
      'placementCompany',
      'currentYear',
      'graduationYear',
    ];
    fields.forEach((f) => {
      const el = document.getElementById(f);
      if (el) fd.append(f, el.value);
    });
    const avail = document.getElementById('availability');
    if (avail) fd.append('availabilityStatus', avail.checked);
    const pic = document.getElementById('profile-pic-input');
    if (pic?.files?.[0]) fd.append('profilePicture', pic.files[0]);

    const btn = document.getElementById('save-btn');
    btn.disabled = true;
    btn.textContent = 'Saving...';
    try {
      const data = await api.putForm('/users/me', fd);
      api.setAuth(api.getToken(), data.user);
      showToast('success', 'Profile updated! ✨');
      setTimeout(() => (location.href = `profile.html?id=${data.user._id}`), 1200);
    } catch (err) {
      showToast('error', 'Save failed', err.message);
    }
    btn.disabled = false;
    btn.textContent = 'Save Changes';
  });
}
