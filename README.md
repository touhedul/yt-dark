# YouTube Video Dark Mode (Chrome Extension)

A Google Chrome extension designed for developers, students, and night owls that darkens and inverts blinding white video content (such as light-themed code editors, bright PowerPoint slides, and white documents) directly inside YouTube videos—without altering the YouTube website interface.

---

## Features

- **Smart Invert Engine**: Inverts luminance (bright white backgrounds turn deep charcoal/black; black text/code turns crisp light) while rotating the color spectrum by 180° to keep syntax highlighting intact (blue keywords, green strings, and red errors retain their natural hues instead of turning into inverted negatives).
- **In-Player Native Button**: Adds a dedicated toggle button with a smooth glow directly into YouTube's bottom player control bar (right next to the Settings gear icon).
- **Keyboard Shortcut**: Press `Alt + D` at any time to toggle video dark mode instantly.
- **HUD Indicator**: Subtle on-screen toast confirming status changes inside the video.
- **Pre-Tuned Presets**:
  - **Code / IDE** *(Default)*: Optimized for VS Code, IntelliJ, Sublime Text, Vim, and browser devtools.
  - **High Contrast**: Deep pitch blacks and punchy contrast.
  - **Slides & Docs**: Softened dark mode for bright white keynote slides, PDFs, and documentation.
  - **Night Dimmer**: Non-inverting gentle brightness reduction for late-night viewing.
- **Custom Fine-Tuning Sliders**: Adjust Invert %, Brightness, Contrast, and Hue Rotation in real-time with instant live preview.
- **Per-Video On-Demand Behavior**: By default, dark mode is turned on only when you need it and resets when opening a new video so regular videos aren't inverted. (Optionally switch to global persistent mode in the popup).

---

## How to Install in Google Chrome

1. Open Google Chrome and navigate to:
   ```text
   chrome://extensions/
   ```
2. Enable **Developer mode** using the toggle in the top-right corner.
3. Click the **Load unpacked** button in the top-left corner.
4. Select this project folder:
   ```text
   d:\Projects\yt-dark
   ```
5. The extension is now installed and active! Pin it to your Chrome toolbar for easy access.

---

## How to Use

1. Open any YouTube video (e.g., a coding tutorial or presentation with a white background).
2. Toggle dark mode in any of three ways:
   - Click the **Dark Mode** moon icon in YouTube's bottom right player controls.
   - Press **`Alt + D`** on your keyboard.
   - Click the extension icon in the Chrome toolbar and flip the master switch.
3. Open the extension popup to switch presets or fine-tune brightness and contrast to your liking.

