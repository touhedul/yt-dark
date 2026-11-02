/**
 * YouTube Video Dark Mode - Popup Script
 */

document.addEventListener('DOMContentLoaded', () => {
  const PRESETS = {
    code: {
      invert: 100,
      hueRotate: 180,
      brightness: 92,
      contrast: 95
    },
    'high-contrast': {
      invert: 100,
      hueRotate: 180,
      brightness: 85,
      contrast: 120
    },
    slides: {
      invert: 92,
      hueRotate: 180,
      brightness: 95,
      contrast: 105
    },
    dimmer: {
      invert: 0,
      hueRotate: 0,
      brightness: 65,
      contrast: 95
    }
  };

  const DEFAULT_SETTINGS = {
    preset: 'code',
    invert: 100,
    hueRotate: 180,
    brightness: 92,
    contrast: 95,
    autoEnable: false
  };

  let currentSettings = { ...DEFAULT_SETTINGS };
  let isDarkModeActive = false;
  let activeTabId = null;
  let saveTimeout = null;

  // DOM Elements
  const masterToggle = document.getElementById('masterToggle');
  const toggleCard = document.getElementById('toggleCard');
  const toggleStatus = document.getElementById('toggleStatus');
  const nonYoutubeBanner = document.getElementById('nonYoutubeBanner');
  const presetButtons = document.querySelectorAll('.preset-btn');
  const resetBtn = document.getElementById('resetBtn');
  const autoEnableToggle = document.getElementById('autoEnableToggle');

  const sliderInvert = document.getElementById('sliderInvert');
  const sliderBrightness = document.getElementById('sliderBrightness');
  const sliderContrast = document.getElementById('sliderContrast');
  const sliderHue = document.getElementById('sliderHue');

  const valInvert = document.getElementById('valInvert');
  const valBrightness = document.getElementById('valBrightness');
  const valContrast = document.getElementById('valContrast');
  const valHue = document.getElementById('valHue');

  // Send message to the active tab's content script
  function sendToActiveTab(message, callback) {
    if (!activeTabId) {
      if (callback) callback(null);
      return;
    }
    chrome.tabs.sendMessage(activeTabId, message, (response) => {
      if (chrome.runtime.lastError) {
        // Tab does not have content script (or restricted)
        if (callback) callback(null);
        return;
      }
      if (callback) callback(response);
    });
  }

  // Save settings to chrome.storage.local
  function persistSettings() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      chrome.storage.local.set({ ytDarkModeSettings: currentSettings });
    }, 200);
  }

  // Update slider UI elements
  function updateSliderUI() {
    sliderInvert.value = currentSettings.invert;
    sliderBrightness.value = currentSettings.brightness;
    sliderContrast.value = currentSettings.contrast;
    sliderHue.value = currentSettings.hueRotate;

    valInvert.textContent = `${currentSettings.invert}%`;
    valBrightness.textContent = `${currentSettings.brightness}%`;
    valContrast.textContent = `${currentSettings.contrast}%`;
    valHue.textContent = `${currentSettings.hueRotate}°`;
  }

  // Update presets buttons active state
  function updatePresetButtonsUI() {
    presetButtons.forEach((btn) => {
      const presetKey = btn.getAttribute('data-preset');
      if (presetKey === currentSettings.preset) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // Update master toggle switch & card UI
  function updateToggleUI() {
    masterToggle.checked = isDarkModeActive;
    if (isDarkModeActive) {
      toggleCard.classList.add('active');
      toggleStatus.textContent = 'Active';
    } else {
      toggleCard.classList.remove('active');
      toggleStatus.textContent = 'Disabled';
    }
  }

  // Apply a selected preset
  function selectPreset(presetKey) {
    const preset = PRESETS[presetKey];
    if (!preset) return;

    currentSettings.preset = presetKey;
    currentSettings.invert = preset.invert;
    currentSettings.hueRotate = preset.hueRotate;
    currentSettings.brightness = preset.brightness;
    currentSettings.contrast = preset.contrast;

    updatePresetButtonsUI();
    updateSliderUI();
    persistSettings();

    sendToActiveTab({
      action: 'UPDATE_SETTINGS',
      settings: currentSettings
    });
  }

  // Check if current slider values match an existing preset
  function checkMatchingPreset() {
    for (const [key, preset] of Object.entries(PRESETS)) {
      if (
        preset.invert === currentSettings.invert &&
        preset.hueRotate === currentSettings.hueRotate &&
        preset.brightness === currentSettings.brightness &&
        preset.contrast === currentSettings.contrast
      ) {
        currentSettings.preset = key;
        updatePresetButtonsUI();
        return;
      }
    }
    currentSettings.preset = 'custom';
    updatePresetButtonsUI();
  }

  // Event: Master Toggle Switch
  masterToggle.addEventListener('change', () => {
    isDarkModeActive = masterToggle.checked;
    updateToggleUI();

    sendToActiveTab({
      action: 'SET_ENABLED',
      value: isDarkModeActive
    });
  });

  // Event: Preset Buttons
  presetButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const presetKey = btn.getAttribute('data-preset');
      selectPreset(presetKey);
      // If toggled off, automatically turn it on when picking a preset
      if (!isDarkModeActive) {
        isDarkModeActive = true;
        updateToggleUI();
        sendToActiveTab({ action: 'SET_ENABLED', value: true });
      }
    });
  });

  // Event: Real-time slider input
  function handleSliderChange() {
    currentSettings.invert = parseInt(sliderInvert.value, 10);
    currentSettings.brightness = parseInt(sliderBrightness.value, 10);
    currentSettings.contrast = parseInt(sliderContrast.value, 10);
    currentSettings.hueRotate = parseInt(sliderHue.value, 10);

    valInvert.textContent = `${currentSettings.invert}%`;
    valBrightness.textContent = `${currentSettings.brightness}%`;
    valContrast.textContent = `${currentSettings.contrast}%`;
    valHue.textContent = `${currentSettings.hueRotate}°`;

    checkMatchingPreset();
    persistSettings();

    sendToActiveTab({
      action: 'UPDATE_SETTINGS',
      settings: currentSettings
    });
  }

  sliderInvert.addEventListener('input', handleSliderChange);
  sliderBrightness.addEventListener('input', handleSliderChange);
  sliderContrast.addEventListener('input', handleSliderChange);
  sliderHue.addEventListener('input', handleSliderChange);

  // Event: Reset Button
  resetBtn.addEventListener('click', () => {
    selectPreset('code');
  });

  // Event: Auto-Enable Checkbox
  autoEnableToggle.addEventListener('change', () => {
    currentSettings.autoEnable = autoEnableToggle.checked;
    persistSettings();
    sendToActiveTab({
      action: 'UPDATE_SETTINGS',
      settings: currentSettings
    });
  });

  // Initialization: Query current active tab and storage
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    const isYouTube = tab && tab.url && tab.url.includes('youtube.com');

    if (!isYouTube) {
      nonYoutubeBanner.style.display = 'flex';
    } else {
      activeTabId = tab.id;
    }

    // Load stored settings first
    chrome.storage.local.get(['ytDarkModeSettings'], (result) => {
      if (result && result.ytDarkModeSettings) {
        currentSettings = { ...DEFAULT_SETTINGS, ...result.ytDarkModeSettings };
      }

      autoEnableToggle.checked = !!currentSettings.autoEnable;
      updateSliderUI();
      updatePresetButtonsUI();

      // Query active video status directly from content script
      if (isYouTube && activeTabId) {
        sendToActiveTab({ action: 'GET_STATUS' }, (response) => {
          if (response) {
            isDarkModeActive = !!response.isEnabled;
            if (response.settings) {
              currentSettings = { ...currentSettings, ...response.settings };
              autoEnableToggle.checked = !!currentSettings.autoEnable;
              updateSliderUI();
              updatePresetButtonsUI();
            }
          }
          updateToggleUI();
        });
      } else {
        updateToggleUI();
      }
    });
  });
});

