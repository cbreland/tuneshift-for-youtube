if (typeof window.audioFxInjected === 'undefined') {
  window.audioFxInjected = true;

  let audioContext, audioElement, sourceNode, mediaRecorder;
  let currentSpeedValue = 1.0;
  
  let recordingState = {
    isRecording: false,
    initialIdentifier: null,
    filename: null,
  };
  
  // --- NEW: Universal tracker for the currently playing song ---
  let lastKnownIdentifier = null;

  const getTrackInfo = () => {
    try {
      const trackSelector = "#layout > ytmusic-player-bar > div.middle-controls.style-scope.ytmusic-player-bar > div.content-info-wrapper.style-scope.ytmusic-player-bar > yt-formatted-string";
      const artistSelector = "#layout > ytmusic-player-bar > div.middle-controls.style-scope.ytmusic-player-bar > div.content-info-wrapper.style-scope.ytmusic-player-bar > span > span.subtitle.style-scope.ytmusic-player-bar > yt-formatted-string";
      const trackEl = document.querySelector(trackSelector);
      const artistEl = document.querySelector(artistSelector);
      if (!trackEl || !artistEl) return null;
      const track = trackEl.textContent.trim();
      const artist = artistEl.textContent.trim();
      return { track, artist, identifier: `${track} - ${artist}` };
    } catch { return null; }
  };

  const getSanitizedFilename = () => {
    const trackInfo = getTrackInfo();
    const speedPercent = Math.round(currentSpeedValue * 100);
    if (!trackInfo) return `recording (${speedPercent}%).webm`;
    let filename = `${trackInfo.identifier} (${speedPercent}%)`;
    return `${filename.replace(/[/\\?%*:|"<>]/g, '-')}.webm`;
  };
  
  const applySpeed = (speed) => {
    if (audioElement && audioElement.playbackRate !== speed) {
        console.log(`Applying speed: ${speed}`);
        audioElement.preservesPitch = false;
        audioElement.playbackRate = speed;
    }
    currentSpeedValue = speed;
  };

  const applySavedSpeed = () => {
    chrome.storage.sync.get(['savedSpeed'], (result) => {
      if (result.savedSpeed) {
        applySpeed(result.savedSpeed);
      }
    });
  };

  const stopRecording = (source) => {
    console.log(`Recording stopped by ${source}.`);
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
    }
    if (recordingState.isRecording) {
        recordingState.isRecording = false;
        chrome.runtime.sendMessage({ type: 'recording_auto_stopped' });
    }
  };

  const setupAudioGraph = (element) => {
    console.log("Setting up audio graph for element:", element);
    audioElement = element;
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    sourceNode = audioContext.createMediaElementSource(audioElement);
    
    const streamDestination = audioContext.createMediaStreamDestination();
    sourceNode.connect(audioContext.destination);
    sourceNode.connect(streamDestination);

    mediaRecorder = new MediaRecorder(streamDestination.stream, { mimeType: 'audio/webm' });
    let recordedChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) recordedChunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'audio/webm;codecs=opus' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = recordingState.filename || 'recording.webm';
      a.click();
      window.URL.revokeObjectURL(url);
      recordedChunks = [];
    };

    applySavedSpeed();
  };

  const findActiveMediaElement = () => {
    const mediaElements = Array.from(document.querySelectorAll('video, audio'));
    return mediaElements.find(el => el.duration > 0 && !el.paused) || mediaElements[0];
  };

  // --- THE FINAL "STATE MONITOR" LOOP ---
  setInterval(() => {
    const currentElement = findActiveMediaElement();
    if (!currentElement) return;

    if (currentElement !== audioElement || !audioContext || audioContext.state === 'closed') {
      console.log("New or disconnected audio element detected. Re-initializing.");
      setupAudioGraph(currentElement);
    }
    
    applySavedSpeed();

    const currentInfo = getTrackInfo();
    if (!currentInfo) return;

    // --- MODIFIED: Universal track change detection, independent of recording state ---
    if (lastKnownIdentifier === null) {
        lastKnownIdentifier = currentInfo.identifier;
    }
    if (currentInfo.identifier !== lastKnownIdentifier) {
        console.log(`Track change detected: ${lastKnownIdentifier} -> ${currentInfo.identifier}`);
        lastKnownIdentifier = currentInfo.identifier;
        chrome.runtime.sendMessage({ type: 'track_changed' }); // Always notify the popup
        
        // If recording, stop the recording for the *previous* track.
        if (recordingState.isRecording) {
            stopRecording('track change');
        }
    }
  }, 1000);

  // Listener for commands from the popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch(message.type) {
      case 'get_filename':
        sendResponse({ filename: getSanitizedFilename() });
        break;
      case 'set_speed':
        applySpeed(message.value);
        chrome.storage.sync.set({ 'savedSpeed': message.value });
        break;
      case 'start_recording':
        if (mediaRecorder && mediaRecorder.state === 'inactive') {
          const initialInfo = getTrackInfo();
          if (initialInfo) {
            recordingState = {
              isRecording: true,
              initialIdentifier: initialInfo.identifier,
              filename: getSanitizedFilename()
            };
            mediaRecorder.start();
            console.log(`Recording started. Locked filename: ${recordingState.filename}`);
            if (audioElement && audioElement.paused) audioElement.play();
          }
        }
        break;
      case 'stop_recording':
        stopRecording('manual stop');
        break;
    }
    return true; 
  });
}