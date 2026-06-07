// script.js – frontend logic for Ted assistant

let sessionId = null;
let mode = null; // 'interview' or 'meeting'
let userId = 1; // placeholder user ID

// DOM elements
const modeOverlay = document.getElementById('modeOverlay');
const interviewBtn = document.getElementById('interviewBtn');
const meetingBtn = document.getElementById('meetingBtn');
const tedPanel = document.getElementById('tedPanel');
const closePanelBtn = document.getElementById('closePanel');
const panelHeader = document.getElementById('panelHeader');
const chatLog = document.getElementById('chatLog');
const chatInput = document.getElementById('chatInput');
const sendChatBtn = document.getElementById('sendChat');
const assistOutput = document.getElementById('assistOutput');
const summaryOutput = document.getElementById('summaryOutput');
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

// ---------- Mode selection ----------
function startSession(selectedMode) {
  mode = selectedMode;
  fetch('/api/session/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode, userId }),
  })
    .then((r) => r.json())
    .then((data) => {
      sessionId = data.sessionId;
      console.log('Session started', sessionId);
      // start audio & screen capture
      startAudioCapture();
      startScreenCapture();
    })
    .catch(console.error);

  modeOverlay.classList.add('hidden');
  tedPanel.classList.remove('hidden');
}

interviewBtn.addEventListener('click', () => startSession('interview'));
meetingBtn.addEventListener('click', () => startSession('meeting'));

closePanelBtn.addEventListener('click', () => {
  // End session (simple placeholder)
  if (sessionId) {
    fetch('/api/session/end', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, summary: '' }),
    })
      .then((r) => r.json())
      .then((data) => {
        summaryOutput.textContent = data.summary || 'No summary generated.';
        switchTab('summary');
      })
      .catch(console.error);
  }
  tedPanel.classList.add('hidden');
});

// ---------- Tab handling ----------
function switchTab(tabName) {
  tabs.forEach((t) => {
    t.classList.toggle('active', t.dataset.tab === tabName);
  });
  tabContents.forEach((c) => {
    c.classList.toggle('active', c.id === `${tabName}Tab`);
    c.classList.toggle('hidden', c.id !== `${tabName}Tab`);
  });
}

tabs.forEach((tab) => {
  tab.addEventListener('click', () => switchTab(tab.dataset.tab));
});

// ---------- Chat handling ----------
function appendChatMessage(sender, text) {
  const p = document.createElement('p');
  p.innerHTML = `<strong>${sender}:</strong> ${text}`;
  chatLog.appendChild(p);
  chatLog.scrollTop = chatLog.scrollHeight;
}

sendChatBtn.addEventListener('click', () => {
  const message = chatInput.value.trim();
  if (!message) return;
  const participant = 'user'; // simple name
  // Save chat to backend
  fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, participant, message }),
  })
    .then(() => {
      appendChatMessage('You', message);
      chatInput.value = '';
      // Ask assist (Ted)
      fetch('/api/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, lastMessage: message }),
      })
        .then((r) => r.json())
        .then((data) => {
          assistOutput.innerHTML = `<p><strong>Ted:</strong> ${data.suggestion}</p>`;
          switchTab('assist');
        })
        .catch(console.error);
    })
    .catch(console.error);
});

// ---------- Audio capture ----------
let mediaRecorder = null;
function startAudioCapture() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((stream) => {
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (e) => {
        const blob = e.data;
        const form = new FormData();
        form.append('audio', blob, 'audio.webm');
        form.append('sessionId', sessionId);
        form.append('participant', 'user');
        fetch('/api/audio', { method: 'POST', body: form }).catch(console.error);
      };
      mediaRecorder.start(3000); // send every 3 seconds
    })
    .catch(console.error);
}

// ---------- Screen capture (stub) ----------
let screenStream = null;
function startScreenCapture() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) return;
  navigator.mediaDevices
    .getDisplayMedia({ video: true })
    .then((stream) => {
      screenStream = stream;
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      const canvas = document.createElement('canvas');
      const capture = () => {
        if (!video.videoWidth) return setTimeout(capture, 500);
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          const form = new FormData();
          form.append('image', blob, 'screenshot.png');
          form.append('sessionId', sessionId);
          fetch('/api/screen-analyze', { method: 'POST', body: form }).catch(console.error);
        }, 'image/png');
        setTimeout(capture, 5000); // every 5 seconds
      };
      capture();
    })
    .catch(console.error);
}

// ---------- Draggable panel ----------
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

panelHeader.addEventListener('mousedown', (e) => {
  isDragging = true;
  const rect = tedPanel.getBoundingClientRect();
  dragOffsetX = e.clientX - rect.left;
  dragOffsetY = e.clientY - rect.top;
});

document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  tedPanel.style.left = `${e.clientX - dragOffsetX}px`;
  tedPanel.style.top = `${e.clientY - dragOffsetY}px`;
});

document.addEventListener('mouseup', () => (isDragging = false));

// ---------- WebSocket for real‑time chat (optional) ----------
const socket = new WebSocket(`ws://${location.host}`);
socket.addEventListener('message', (event) => {
  // Simple echo handling – could be expanded
  console.log('WS message', event.data);
});

// End of script.js
