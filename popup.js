document.addEventListener('DOMContentLoaded', () => {
    const speedSlider = document.getElementById('speed');
    const speedValueLabel = document.getElementById('speed-value');
    const startBtn = document.getElementById('start-rec');
    const stopBtn = document.getElementById('stop-rec');
    const filenamePreview = document.getElementById('filename-preview');
    const closeBtn = document.getElementById('close-btn');

    // --- NEW: Automatically focus the speed slider when the panel window gains focus ---
    window.addEventListener('focus', () => {
        speedSlider.focus();
    });

    function sendMessage(message, callback) {
        // Query for the YouTube Music tab specifically by URL
        chrome.tabs.query({ url: "*://music.youtube.com/*" }, (tabs) => {
            if (tabs && tabs.length > 0) {
                chrome.tabs.sendMessage(tabs[0].id, message, callback);
            } else {
                console.log("Could not find an open YouTube Music tab.");
                filenamePreview.textContent = "YouTube Music tab not found.";
            }
        });
    }
    
    function refreshFilename() {
        sendMessage({ type: 'get_filename' }, (response) => {
            if (response && response.filename) {
                filenamePreview.textContent = response.filename;
            }
        });
    }

    // Get initial state when the popup opens
    refreshFilename();
    chrome.storage.sync.get(['savedSpeed'], (result) => {
        if (result.savedSpeed) {
            const speedPercent = result.savedSpeed * 100;
            speedSlider.value = speedPercent;
            speedValueLabel.textContent = Math.round(speedPercent);
        }
    });

    // Event Listeners
    speedSlider.addEventListener('input', () => {
        const speed = parseFloat(speedSlider.value);
        speedValueLabel.textContent = speed;
        sendMessage({ type: 'set_speed', value: speed / 100 });
    });

    startBtn.addEventListener('click', () => {
        sendMessage({ type: 'start_recording' });
        startBtn.disabled = true;
        stopBtn.disabled = false;
    });

    stopBtn.addEventListener('click', () => {
        sendMessage({ type: 'stop_recording' });
        startBtn.disabled = false;
        stopBtn.disabled = true;
    });

    closeBtn.addEventListener('click', () => {
        window.close();
    });

    // Main listener for messages pushed from the content script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'recording_auto_stopped') {
            startBtn.disabled = false;
            stopBtn.disabled = true;
        }
        if (message.type === 'track_changed') {
            console.log('Popup received track_changed message. Refreshing filename.');
            refreshFilename();
        }
    });
});