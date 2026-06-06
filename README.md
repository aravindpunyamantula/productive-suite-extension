# Productivity Suite

A multi-feature Chrome extension with an Apple-inspired dark mode UI for managing browser sessions, quick notes, and website blocking.

## Features

### Session Manager
Save and restore named groups of tabs (workspaces) across browser sessions.
- Save the current window's tabs as a named workspace
- Restore any saved workspace in a new window
- Delete workspaces you no longer need
- Quick-save via keyboard shortcut **Ctrl+Shift+S** (Cmd+Shift+S on Mac)

### Quick Notes
A persistent scratchpad synced to your browser storage.
- Write and save notes directly from the popup
- Notes are displayed as a widget on the New Tab page
- Right-click any page and select **"Add page to notes"** to append its title and URL

### Website Blocker
Block distracting websites to stay focused.
- Enter any hostname (e.g. `twitter.com`) in Preferences to block it
- Blocked sites redirect to a clean "Access Restricted" page
- Manage the blocklist anytime from Preferences

### Custom New Tab Page
Replaces the default new tab with a minimal dashboard showing:
- Live clock and date
- Time-based greeting
- Notes scratchpad widget
- Saved workspaces widget with one-click restore

### Data Export
Export all your data (sessions, notes, blocked sites) to a dated JSON backup file from the Preferences page.

## Installation

1. Clone or download this repository.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the project folder.

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| Ctrl+Shift+P (Cmd+Shift+P) | Open popup |
| Ctrl+Shift+S (Cmd+Shift+S) | Quick-save current window as a session |

## File Structure

```
├── manifest.json      # Extension manifest (Manifest V3)
├── background.js      # Service worker: blocking, context menu, shortcuts
├── popup.html/js      # Popup UI: session manager + notes
├── options.html/js    # Preferences page: website blocker + data export
├── newtab.html/js     # Custom new tab dashboard
└── blocked.html       # Page shown when a blocked site is visited
```

## Permissions

| Permission | Reason |
|---|---|
| `storage` | Persist sessions, notes, and blocklist |
| `tabs` | Read open tabs to save sessions |
| `windows` | Open a new window when restoring a session |
| `scripting` | Reserved for future content-script use |
| `contextMenus` | "Add page to notes" right-click menu item |
| `host_permissions: <all_urls>` | Intercept navigation to blocked sites |
