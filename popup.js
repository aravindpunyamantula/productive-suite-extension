// DOM refs
let sessionNameInput, saveSessionBtn, sessionsList;
let openOptionsBtn, notesTextarea, saveNotesBtn;

// --- SVG Icons Registry ---
const Icons = {
  check: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
  warning: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-red)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
  folder: `<svg class="icon-lg empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`,
  close: `<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
};

// --- Init ---
document.addEventListener('DOMContentLoaded', async () => {
  sessionNameInput = document.getElementById('sessionName');
  saveSessionBtn   = document.querySelector('[data-testid="save-session-btn"]');
  sessionsList     = document.querySelector('[data-testid="sessions-list"]');
  openOptionsBtn   = document.querySelector('[data-testid="open-options-btn"]');
  notesTextarea    = document.querySelector('[data-testid="notes-textarea"]');
  saveNotesBtn     = document.querySelector('[data-testid="save-notes-btn"]');

  // Apple-style Tab switching
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
    });
  });

  // Enter key to save session
  sessionNameInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') saveSession();
  });

  saveSessionBtn.addEventListener('click', saveSession);
  saveNotesBtn.addEventListener('click', saveNotes);

  openOptionsBtn.addEventListener('click', () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    }
  });

  await loadNotes();
  await loadSessions();
});

// --- Toast Notification ---
function showToast(msg = 'Saved successfully', isError = false) {
  const toast = document.getElementById('toast');
  const toastIcon = document.getElementById('toast-icon');
  const toastMsg = document.getElementById('toast-msg');
  
  toastIcon.innerHTML = isError ? Icons.warning : Icons.check;
  toastMsg.textContent = msg;
  
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// --- Sessions Logic ---
async function saveSession() {
  const sessionName = sessionNameInput.value.trim();
  if (!sessionName) {
    showToast('Session name required', true);
    sessionNameInput.focus();
    return;
  }

  const tabs = await chrome.tabs.query({ currentWindow: true });
  const urls = tabs.map(tab => tab.url).filter(Boolean);

  const result   = await chrome.storage.local.get('sessions');
  const sessions = result.sessions || {};
  sessions[sessionName] = urls;

  await chrome.storage.local.set({ sessions });
  sessionNameInput.value = '';
  showToast('Workspace saved');
  await loadSessions();
}

async function loadSessions() {
  const result   = await chrome.storage.local.get('sessions');
  const sessions = result.sessions || {};
  const names    = Object.keys(sessions);

  if (names.length === 0) {
    sessionsList.innerHTML = `
      <div class="empty-state">
        ${Icons.folder}
        <span>No workspaces saved yet</span>
      </div>`;
    return;
  }

  sessionsList.innerHTML = '';

  for (const name of names) {
    const urls = sessions[name] || [];

    const card = document.createElement('div');
    card.className = 'session-card';

    const info = document.createElement('div');
    info.className = 'session-info';

    const nameEl = document.createElement('div');
    nameEl.className = 'session-name';
    nameEl.textContent = name;

    const countEl = document.createElement('div');
    countEl.className = 'session-count';
    countEl.textContent = `${urls.length} tab${urls.length !== 1 ? 's' : ''}`;

    info.appendChild(nameEl);
    info.appendChild(countEl);

    const actions = document.createElement('div');
    actions.className = 'session-actions';

    const restoreBtn = document.createElement('button');
    restoreBtn.className = 'btn btn-restore';
    restoreBtn.textContent = 'Restore';
    restoreBtn.setAttribute('data-testid', `restore-session-${name}`);
    restoreBtn.addEventListener('click', () => restoreSession(name));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-danger-ghost';
    deleteBtn.innerHTML = Icons.close;
    deleteBtn.title = 'Delete workspace';
    deleteBtn.addEventListener('click', () => deleteSession(name));

    actions.appendChild(restoreBtn);
    actions.appendChild(deleteBtn);

    card.appendChild(info);
    card.appendChild(actions);
    sessionsList.appendChild(card);
  }
}

async function restoreSession(sessionName) {
  const result   = await chrome.storage.local.get('sessions');
  const sessions = result.sessions || {};
  const urls     = sessions[sessionName];

  if (!urls || !urls.length) {
    showToast('No tabs found in this workspace', true);
    return;
  }

  chrome.windows.create({ url: urls });
}

async function deleteSession(sessionName) {
  const result   = await chrome.storage.local.get('sessions');
  const sessions = result.sessions || {};
  delete sessions[sessionName];
  await chrome.storage.local.set({ sessions });
  showToast('Workspace deleted');
  await loadSessions();
}

// --- Notes Logic ---
async function loadNotes() {
  const result = await chrome.storage.local.get('notes');
  notesTextarea.value = result.notes || '';
}

async function saveNotes() {
  await chrome.storage.local.set({ notes: notesTextarea.value });
  showToast('Notes saved');
}