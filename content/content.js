/**
 * YouTube Video Dark Mode - Content Script
 * Inverts and darkens video backgrounds (white IDEs, slides) directly on the HTML5 video element.
 */

(function () {
  'use strict';

  // Prevent multiple injections
  if (window.__ytDarkModeInjected) return;
  window.__ytDarkModeInjected = true;

  const PRESETS = {
    code: {
      name: 'Code / IDE',
      invert: 100,
      hueRotate: 180,
      brightness: 92,
      contrast: 95,
      sepia: 0,
      grayscale: 0
    },
    'high-contrast': {
      name: 'High Contrast',
      invert: 100,
      hueRotate: 180,
      brightness: 85,
      contrast: 120,
      sepia: 0,
      grayscale: 0
    },
    slides: {
      name: 'Slides & Docs',
      invert: 92,
      hueRotate: 180,
      brightness: 95,
      contrast: 105,
      sepia: 0,
      grayscale: 0
    },
    dimmer: {
      name: 'Night Dimmer',
      invert: 0,
      hueRotate: 0,
      brightness: 65,
      contrast: 95,
      sepia: 15,
      grayscale: 0
    }
  };

  const DEFAULT_SETTINGS = {
    preset: 'code',
    invert: 100,
    hueRotate: 180,
    brightness: 92,
    contrast: 95,
    sepia: 0,
    grayscale: 0,
    autoEnable: false // Per-video on-demand by default
  };

  // State
  let isDarkModeActive = false;
  let currentSettings = { ...DEFAULT_SETTINGS };
  let toastTimeout = null;

  // Load saved preferences from chrome.storage
  function loadSettings(callback) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['ytDarkModeSettings'], (result) => {
        if (result && result.ytDarkModeSettings) {
          currentSettings = { ...DEFAULT_SETTINGS, ...result.ytDarkModeSettings };
        }
        if (callback) callback();
      });
    } else if (callback) {
      callback();
    }
  }

  // Generate CSS filter string from current settings
  function buildFilterString(settings) {
    return [
      `invert(${settings.invert}%)`,
      `hue-rotate(${settings.hueRotate}deg)`,
      `brightness(${settings.brightness}%)`,
      `contrast(${settings.contrast}%)`,
      settings.sepia > 0 ? `sepia(${settings.sepia}%)` : '',
      settings.grayscale > 0 ? `grayscale(${settings.grayscale}%)` : ''
    ]
      .filter(Boolean)
      .join(' ');
  }

  // Get active video element in player
  function getVideoElement() {
    return (
      document.querySelector('#movie_player video.html5-main-video') ||
      document.querySelector('.html5-video-player video') ||
      document.querySelector('video')
    );
  }

  // Apply or remove filter from video
  function applyFilter() {
    const video = getVideoElement();
    if (!video) return;

    if (isDarkModeActive) {
      const filterStr = buildFilterString(currentSettings);
      video.style.filter = filterStr;
      video.setAttribute('data-yt-dark-mode', 'active');
    } else {
      video.style.filter = '';
      video.removeAttribute('data-yt-dark-mode');
    }

    updateButtonUI();
  }

  // Toggle dark mode state
  function toggleDarkMode() {
    isDarkModeActive = !isDarkModeActive;
    applyFilter();

    const presetName =
      currentSettings.preset === 'custom'
        ? 'Custom'
        : (PRESETS[currentSettings.preset] && PRESETS[currentSettings.preset].name) || 'Smart Invert';

    showToast(isDarkModeActive ? `Video Dark Mode: ON (${presetName})` : 'Video Dark Mode: OFF');

    // Notify background / popup if listening
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({
        action: 'STATUS_CHANGED',
        isEnabled: isDarkModeActive,
        settings: currentSettings
      }).catch(() => {
        // Suppress message port closed errors when popup is not open
      });
    }
  }

  // Show a sleek HUD notification in the player
  function showToast(message) {
    const player = document.querySelector('#movie_player') || document.querySelector('.html5-video-player');
    if (!player) return;

    let toast = player.querySelector('.yt-dark-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'yt-dark-toast';
      player.appendChild(toast);
    }

    const iconSvg = isDarkModeActive
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
           <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
         </svg>`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
           <circle cx="12" cy="12" r="5"></circle>
           <line x1="12" y1="1" x2="12" y2="3"></line>
           <line x1="12" y1="21" x2="12" y2="23"></line>
         </svg>`;

    toast.innerHTML = `${iconSvg}<span>${message}</span>`;
    toast.classList.add('yt-dark-toast-visible');

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove('yt-dark-toast-visible');
    }, 1200);
  }

  // Update In-Player Button UI state
  function updateButtonUI() {
    const btn = document.querySelector('.yt-dark-mode-btn');
    if (!btn) return;

    if (isDarkModeActive) {
      btn.classList.add('ytdm-active');
      btn.setAttribute('aria-pressed', 'true');
      btn.setAttribute('title', 'Video Dark Mode: ON (Alt+D)');
      const tooltip = btn.querySelector('.yt-dark-mode-tooltip');
      if (tooltip) tooltip.textContent = 'Video Dark Mode: ON (Alt+D)';
    } else {
      btn.classList.remove('ytdm-active');
      btn.setAttribute('aria-pressed', 'false');
      btn.setAttribute('title', 'Video Dark Mode: OFF (Alt+D)');
      const tooltip = btn.querySelector('.yt-dark-mode-tooltip');
      if (tooltip) tooltip.textContent = 'Video Dark Mode: OFF (Alt+D)';
    }
  }

  // SVG Moon / Sun Contrast Icon
  const BUTTON_SVG = `
    <svg viewBox="0 0 24 24" width="22" height="22">
      <!-- Contrast / Dark Moon symbol -->
      <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" />
    </svg>
    <span class="yt-dark-mode-active-indicator"></span>
    <span class="yt-dark-mode-tooltip">Video Dark Mode (Alt+D)</span>
  `;

  // Inject toggle button into YouTube's right control bar
  function injectPlayerButton() {
    const rightControls = document.querySelector('.ytp-right-controls');
    if (!rightControls) return;

    // Check if button already exists in controls
    if (document.querySelector('.yt-dark-mode-btn')) {
      updateButtonUI();
      return;
    }

    const btn = document.createElement('button');
    btn.className = 'ytp-button yt-dark-mode-btn';
    btn.setAttribute('aria-label', 'Video Dark Mode (Alt+D)');
    btn.setAttribute('aria-pressed', isDarkModeActive ? 'true' : 'false');
    btn.setAttribute('data-priority', '10');
    btn.innerHTML = BUTTON_SVG;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleDarkMode();
    });

    // Place before settings button or size button if present
    const settingsBtn = rightControls.querySelector('.ytp-settings-button');
    const sizeBtn = rightControls.querySelector('.ytp-size-button');
    const targetElement = settingsBtn || sizeBtn;

    if (targetElement) {
      rightControls.insertBefore(btn, targetElement);
    } else {
      rightControls.appendChild(btn);
    }

    updateButtonUI();
  }

  // Observe player DOM changes to maintain button injection
  function observePlayer() {
    const observer = new MutationObserver(() => {
      const rightControls = document.querySelector('.ytp-right-controls');
      if (rightControls && !rightControls.querySelector('.yt-dark-mode-btn')) {
        injectPlayerButton();
      }
      // Re-apply filter if video element was re-created or changed
      if (isDarkModeActive) {
        const video = getVideoElement();
        if (video && !video.getAttribute('data-yt-dark-mode')) {
          applyFilter();
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Handle YouTube SPA Navigation (user clicks another video)
  function handleNavigation() {
    loadSettings(() => {
      if (!currentSettings.autoEnable) {
        // Reset to off for the new video
        isDarkModeActive = false;
        applyFilter();
      } else {
        // If user configured auto-enable, activate it
        isDarkModeActive = true;
        applyFilter();
      }
      setTimeout(injectPlayerButton, 300);
      setTimeout(injectPlayerButton, 1000);
    });
  }

  // Keyboard shortcut listener (Alt+D) directly in page context
  window.addEventListener('keydown', (e) => {
    // Check for Alt+D (or Option+D on Mac)
    if (e.altKey && (e.key === 'd' || e.key === 'D')) {
      // Don't trigger if user is typing in a comment, search box, or input field
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      const isEditable = document.activeElement && document.activeElement.isContentEditable;
      if (activeTag === 'input' || activeTag === 'textarea' || isEditable) {
        return;
      }
      e.preventDefault();
      toggleDarkMode();
    }
  });

  // Listen for messages from extension popup / background worker
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (!message || !message.action) return;

      switch (message.action) {
        case 'GET_STATUS':
          sendResponse({
            isEnabled: isDarkModeActive,
            settings: currentSettings,
            presets: PRESETS
          });
          break;

        case 'TOGGLE_DARK_MODE':
          toggleDarkMode();
          sendResponse({
            isEnabled: isDarkModeActive,
            settings: currentSettings
          });
          break;

        case 'SET_ENABLED':
          isDarkModeActive = !!message.value;
          applyFilter();
          sendResponse({
            isEnabled: isDarkModeActive,
            settings: currentSettings
          });
          break;

        case 'UPDATE_SETTINGS':
          if (message.settings) {
            currentSettings = { ...currentSettings, ...message.settings };
            if (isDarkModeActive) {
              applyFilter();
            }
          }
          sendResponse({
            isEnabled: isDarkModeActive,
            settings: currentSettings
          });
          break;

        default:
          break;
      }
      return true; // Keep message channel open for async response
    });
  }

  // Lifecycle initialization
  loadSettings(() => {
    injectPlayerButton();
    observePlayer();

    // YouTube SPA event hooks
    window.addEventListener('yt-navigate-finish', handleNavigation);
    window.addEventListener('spfdone', handleNavigation);

    // Backup polling for initial load
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      injectPlayerButton();
      if (attempts > 10 || document.querySelector('.yt-dark-mode-btn')) {
        clearInterval(interval);
      }
    }, 400);
  });
})();

