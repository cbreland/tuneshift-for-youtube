# TuneShift for YouTube

A browser extension designed for a customized listening experience on YouTube and YouTube Music. It provides a persistent control panel to adjust playback speed (which also affects pitch) and record audio streams directly from the player.

## Key Features

* **Persistent Speed Control**: Adjust the playback speed from 50% to 150%. The setting is "sticky" and automatically applies to subsequent tracks, page reloads, and browser sessions.
* **Natural Pitch Shifting**: Disables artificial pitch correction, allowing the audio's pitch to drop and rise naturally with the speed, like slowing down a record.
* **Persistent Control Panel**: The UI opens in a minimal, separate window that stays open even when you click back to the main page, allowing for constant access to controls.
* **Keyboard-Friendly**: The control panel automatically focuses on the speed slider, allowing for immediate adjustment with keyboard arrow keys.
* **Live Filename Preview**: The panel's UI automatically detects track changes and updates a filename preview in real-time.
* **High-Quality Audio Recording**: Record any audio stream directly to a `.webm` file.
* **Automatic Filename Generation**: Recorded files are automatically named using the format: `Track Name - Artist Name (Speed%).webm`.
* **Smart Recording Stop**: When recording, the extension automatically detects when the track changes and finalizes the download for the song that just finished.

## Project Files

* `manifest.json`: The core configuration file for the Chrome extension.
* `background.js`: A service worker that manages opening the control panel in a persistent window.
* `popup.html`: The HTML structure for the user interface panel.
* `popup.js`: The JavaScript that powers the UI panel and handles communication with the content script.
* `content.js`: The main script injected into YouTube/YouTube Music pages. It handles all audio manipulation, state monitoring, and recording logic.

## Installation

This extension is loaded as an "unpacked extension" in developer mode.

1.  Create a new folder on your computer (e.g., `tuneshift-extension`).
2.  Save all the project files (`manifest.json`, `background.js`, `popup.html`, `popup.js`, `content.js`) inside this folder.
3.  Open your Chrome-based browser and navigate to `chrome://extensions`.
4.  In the top-right corner, toggle on **"Developer mode"**.
5.  Click the **"Load unpacked"** button that appears on the top-left.
6.  Select the folder you created in Step 1.
7.  The "TuneShift for YouTube" extension will now appear in your extensions list and be active.

## Usage

1.  Navigate to `music.youtube.com` or `www.youtube.com`.
2.  Click the TuneShift extension icon in your browser's toolbar to open the control panel.
3.  The panel will stay open. You can drag it to a convenient location on your screen.
4.  Use the **slider** or your **keyboard's arrow keys** to adjust the playback speed. The change is instant and will persist for future songs.
5.  The **Filename Preview** will update automatically as the song changes.
6.  To record a track:
    * Click **"Start Recording"**. If the track is paused, it will automatically start playing.
    * The recording will stop and the download will trigger automatically when the song changes, or you can click **"Stop & Download"** to end it manually.
7.  Click the **"Close Panel"** button to close the control window.
