/**
 * YouTube Video Dark Mode - Background Service Worker
 * Handles commands (Alt+D), action click, and badge updates.
 */

// Handle global command shortcut (Alt+D)
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-dark-mode') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id && tab.url && tab.url.includes('youtube.com')) {
      chrome.tabs.sendMessage(tab.id, { action: 'TOGGLE_DARK_MODE' }, (response) => {
        if (chrome.runtime.lastError) {
          // Tab may not have content script yet or is restricted
          return;
        }
        if (response) {
          updateBadge(tab.id, response.isEnabled);
        }
      });
    }
  }
});

// Update extension icon badge
function updateBadge(tabId, isEnabled) {
  if (isEnabled) {
    chrome.action.setBadgeText({ tabId, text: 'ON' });
    chrome.action.setBadgeBackgroundColor({ tabId, color: '#0284c7' });
  } else {
    chrome.action.setBadgeText({ tabId, text: '' });
  }
}

// Listen for status changes from content script
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action === 'STATUS_CHANGED' && sender.tab && sender.tab.id) {
    updateBadge(sender.tab.id, message.isEnabled);
  }
});

