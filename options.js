// DOM refs
const hostnameInput = document.getElementById('block-hostname-input');
const addBlockBtn = document.getElementById('add-block-btn');
const blockedSitesList = document.getElementById('blocked-sites-list');
const exportBtn = document.getElementById('export-data-btn');

// --- SVG Icons Registry ---
const Icons = {
  check: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
  warning: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-red)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
  shield: `<svg class="icon-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.5;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`,
  trash: `<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`
};

// --- Init ---
document.addEventListener('DOMContentLoaded', async () => {
  await loadBlockedSites();
});

addBlockBtn.addEventListener('click', addBlockedSite);

// Allow pressing Enter in the input field
hostnameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addBlockedSite();
});

exportBtn.addEventListener('click', exportData);

// --- Toast Notification ---
function showToast(msg = 'Success', isError = false) {
  const toast = document.getElementById('toast');
  const toastIcon = document.getElementById('toast-icon');
  const toastMsg = document.getElementById('toast-msg');
  
  toastIcon.innerHTML = isError ? Icons.warning : Icons.check;
  toastMsg.textContent = msg;
  
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// --- Blocker Logic ---
async function addBlockedSite() {
  // Clean up the input (remove https://, http://, trailing slashes)
  let hostname = hostnameInput.value.trim().toLowerCase();
  hostname = hostname.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];

  if (!hostname) {
    showToast('Enter a valid URL', true);
    hostnameInput.focus();
    return;
  }

  const result = await chrome.storage.sync.get('blockedSites');
  const blockedSites = result.blockedSites || [];

  if (blockedSites.includes(hostname)) {
    showToast('Site is already blocked', true);
    hostnameInput.value = '';
    return;
  }

  blockedSites.push(hostname);
  await chrome.storage.sync.set({ blockedSites });

  hostnameInput.value = '';
  showToast('Site added to blocklist');
  await loadBlockedSites();
}

async function loadBlockedSites() {
  const result = await chrome.storage.sync.get('blockedSites');
  const blockedSites = result.blockedSites || [];

  blockedSitesList.innerHTML = '';

  if (blockedSites.length === 0) {
    blockedSitesList.innerHTML = `
      <div class="empty-state">
        ${Icons.shield}
        <span>No sites are currently blocked</span>
      </div>`;
    return;
  }

  blockedSites.forEach(site => {
    const div = document.createElement('div');
    div.className = 'site-item';

    const text = document.createElement('span');
    text.textContent = site;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn-danger-ghost';
    removeBtn.innerHTML = Icons.trash;
    removeBtn.title = 'Remove block';
    removeBtn.addEventListener('click', () => removeBlockedSite(site));

    div.appendChild(text);
    div.appendChild(removeBtn);

    blockedSitesList.appendChild(div);
  });
}

async function removeBlockedSite(site) {
  const result = await chrome.storage.sync.get('blockedSites');
  let blockedSites = result.blockedSites || [];

  blockedSites = blockedSites.filter(s => s !== site);
  
  await chrome.storage.sync.set({ blockedSites });
  showToast('Site removed from blocklist');
  await loadBlockedSites();
}

// --- Export Logic ---
async function exportData() {
  try {
    const localData = await chrome.storage.local.get();
    const syncData = await chrome.storage.sync.get();

    const exportObject = {
      sessions: localData.sessions || {},
      notes: localData.notes || '',
      blockedSites: syncData.blockedSites || []
    };

    const blob = new Blob([JSON.stringify(exportObject, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    
    // Append date to the filename for better organization
    const dateStr = new Date().toISOString().split('T')[0];
    a.download = `productivity_suite_backup_${dateStr}.json`;
    
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Data exported successfully');
  } catch (error) {
    console.error("Export failed:", error);
    showToast('Failed to export data', true);
  }
}