// --- Installation & Setup ---
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "add-page-note",
    title: "Add page to notes",
    contexts: ["page"]
  });
});

// --- Website Blocker Logic ---
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "loading" || !tab.url) return;

  // Prevent URL parsing errors on internal browser pages
  if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) return;

  try {
    const result = await chrome.storage.sync.get("blockedSites");
    const blockedSites = result.blockedSites || [];

    if (blockedSites.length === 0) return;

    const urlObj = new URL(tab.url);
    const hostname = urlObj.hostname.replace(/^www\./, "");

    const isBlocked = blockedSites.some(site => 
      hostname === site || hostname.endsWith("." + site)
    );

    if (isBlocked) {
      const blockedUrl = chrome.runtime.getURL("blocked.html");
      chrome.tabs.update(tabId, { url: blockedUrl });
    }
  } catch (error) {
    console.error("Productivity Suite - Blocking error:", error);
  }
});

// --- Context Menu: Quick Notes ---
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "add-page-note") return;

  const result = await chrome.storage.local.get("notes");
  const oldNotes = result.notes || "";
  
  // Format the appended note cleanly
  const newEntry = `\n${tab.title}\n${tab.url}\n`;

  await chrome.storage.local.set({ notes: oldNotes + newEntry });
});

// --- Keyboard Shortcuts ---
chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "save-session") return;

  const tabs = await chrome.tabs.query({ currentWindow: true });
  const urls = tabs.map(tab => tab.url).filter(Boolean);

  if (urls.length === 0) return;

  const result = await chrome.storage.local.get("sessions");
  const sessions = result.sessions || {};

  // Generate a clean, human-readable session name (e.g., "Quick Save 14:30")
  const date = new Date();
  const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const sessionName = `Quick Save (${timeString})`;

  sessions[sessionName] = urls;

  await chrome.storage.local.set({ sessions });
});