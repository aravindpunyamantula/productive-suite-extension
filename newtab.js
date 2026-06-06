// DOM refs
const notesWidget = document.getElementById('widget-notes');
const sessionsWidget = document.getElementById('widget-sessions');
const clockEl = document.getElementById('clock');
const dateEl = document.getElementById('date');
const greetingEl = document.getElementById('greeting');

// SVG Registry for Empty States
const Icons = {
  noteEmpty: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`,
  sessionEmpty: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`
};

document.addEventListener('DOMContentLoaded', async () => {
  updateTimeAndGreeting();
  setInterval(updateTimeAndGreeting, 1000);

  await loadNotes();
  await loadSessions();
});

// --- Time & Greeting Logic ---
function updateTimeAndGreeting() {
  const now = new Date();
  
  // Format Clock (HH:MM format, removing seconds for a calmer UI)
  clockEl.textContent = now.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false // 24-hour format looks sleeker, change to true if preferred
  });

  // Format Date (e.g., Wednesday, June 3)
  dateEl.textContent = now.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });

  // Dynamic Personalized Greeting
  const hour = now.getHours();
  let timeGreeting = 'Good evening';
  if (hour < 12) timeGreeting = 'Good morning';
  else if (hour < 18) timeGreeting = 'Good afternoon';

  greetingEl.textContent = `${timeGreeting}, Aravind.`;
}

// --- Notes Logic ---
async function loadNotes() {
  const result = await chrome.storage.local.get('notes');
  const notesText = result.notes || '';

  if (!notesText.trim()) {
    notesWidget.innerHTML = `
      <div class="empty-state">
        ${Icons.noteEmpty}
        <p>Your scratchpad is empty</p>
      </div>`;
    return;
  }

  notesWidget.textContent = notesText;
}

// --- Sessions Logic ---
async function loadSessions() {
  const result = await chrome.storage.local.get('sessions');
  const sessions = result.sessions || {};
  const names = Object.keys(sessions);

  sessionsWidget.innerHTML = '';

  if (names.length === 0) {
    sessionsWidget.innerHTML = `
      <div class="empty-state">
        ${Icons.sessionEmpty}
        <p>No active workspaces saved</p>
      </div>`;
    return;
  }

  names.forEach(name => {
    const urls = sessions[name];
    
    const card = document.createElement('div');
    card.className = 'session-item';

    const info = document.createElement('div');
    info.className = 'session-info';

    const title = document.createElement('div');
    title.className = 'session-name';
    title.textContent = name;

    const meta = document.createElement('div');
    meta.className = 'session-meta';
    meta.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect></svg> ${urls.length} tabs`;

    info.appendChild(title);
    info.appendChild(meta);

    const restoreBtn = document.createElement('button');
    restoreBtn.className = 'btn-restore';
    restoreBtn.textContent = 'Restore';
    restoreBtn.addEventListener('click', () => restoreSession(name));

    card.appendChild(info);
    card.appendChild(restoreBtn);

    sessionsWidget.appendChild(card);
  });
}

async function restoreSession(sessionName) {
  const result = await chrome.storage.local.get('sessions');
  const sessions = result.sessions || {};
  const urls = sessions[sessionName];

  if (!urls || urls.length === 0) return;

  chrome.windows.create({ url: urls });
}