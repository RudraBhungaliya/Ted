// overlay.js - Session mode selection & chat management

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const startTedBtn = document.getElementById('startTedBtn');
  const modeModal = document.getElementById('sessionModeModal');
  const modeInterview = document.getElementById('modeInterview');
  const modeMeeting = document.getElementById('modeMeeting');
  const sessionList = document.getElementById('sessionList');
  const sessionsUl = document.getElementById('sessionsUl');
  const chatLog = document.getElementById('chatLog');
  const chatInput = document.getElementById('chatInput');
  const sendChat = document.getElementById('sendChat');

  let currentSessionId = null;

  // Utilities
  const loadSessions = () => {
    const data = localStorage.getItem('ted_sessions');
    return data ? JSON.parse(data) : [];
  };

  const saveSessions = (sessions) => {
    localStorage.setItem('ted_sessions', JSON.stringify(sessions));
  };

  const renderSessionList = () => {
    const sessions = loadSessions();
    sessionsUl.innerHTML = '';
    sessions.forEach((s) => {
      const li = document.createElement('li');
      li.textContent = `${s.mode} – ${new Date(s.id).toLocaleString()}`;
      li.dataset.id = s.id;
      li.addEventListener('click', () => loadSession(s.id));
      sessionsUl.appendChild(li);
    });
    // Show the list container if there are sessions
    sessionList.classList.toggle('hidden', sessions.length === 0);
  };

  const renderChat = (session) => {
    chatLog.innerHTML = '';
    session.messages.forEach((msg) => {
      const div = document.createElement('div');
      div.textContent = `${msg.sender}: ${msg.text}`;
      chatLog.appendChild(div);
    });
    chatLog.scrollTop = chatLog.scrollHeight;
  };

  const loadSession = (id) => {
    const sessions = loadSessions();
    const session = sessions.find((s) => s.id === id);
    if (!session) return;
    currentSessionId = id;
    renderChat(session);
    // When a session is loaded, hide the New Session button to prevent mode change
    startTedBtn.classList.add('hidden');
  };

  const createSession = (mode) => {
    // Prevent creating a new session if one is already active
    if (currentSessionId) return;
    const sessions = loadSessions();
    const newSession = {
      id: Date.now().toString(),
      mode,
      messages: []
    };
    sessions.push(newSession);
    saveSessions(sessions);
    renderSessionList();
    loadSession(newSession.id);
    // Hide Start button after creation to lock the mode
    startTedBtn.classList.add('hidden');
  };

  // Event handlers
  startTedBtn.addEventListener('click', () => {
    console.log('Start Ted button clicked');
    if (currentSessionId) {
      console.log('Session already active, ignoring click');
      return;
    }
    console.log('Opening mode selection modal');
    modeModal.classList.remove('hidden');
  });

  const closeModal = () => modeModal.classList.add('hidden');

  modeInterview.addEventListener('click', () => {
    createSession('Interview');
    closeModal();
  });
  modeMeeting.addEventListener('click', () => {
    createSession('Meeting');
    closeModal();
  });

  sendChat.addEventListener('click', () => {
    const text = chatInput.value.trim();
    if (!text || !currentSessionId) return;
    const sessions = loadSessions();
    const session = sessions.find((s) => s.id === currentSessionId);
    if (!session) return;
    // User message
    session.messages.push({ sender: 'You', text });
    // Placeholder AI response
    session.messages.push({ sender: 'AI', text: '(AI response placeholder)' });
    saveSessions(sessions);
    renderChat(session);
    chatInput.value = '';
  });

  // Initialize UI
  renderSessionList();
});
