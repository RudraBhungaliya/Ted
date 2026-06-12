const fs = require('fs');
const WebSocket = require('ws');
const path = require('path');

const WAV_PATH = 'd:/PlayGround/Projects/Ted/polymorphism.wav';
const WS_URL = 'ws://localhost:4000/realtime';

console.log('Reading WAV file from:', WAV_PATH);
const fileBuffer = fs.readFileSync(WAV_PATH);
// Skip the 44-byte WAV header
const pcmBuffer = fileBuffer.subarray(44);

console.log(`PCM Buffer loaded: ${pcmBuffer.length} bytes.`);

const ws = new WebSocket(WS_URL);

ws.on('open', () => {
  console.log('Connected to server, sending session.start...');
  ws.send(JSON.stringify({
    event: 'session.start',
    payload: {
      sessionId: 'cmqah7m0k0000g0kjlufutsvl',
      mode: 'interview'
    }
  }));
});

ws.on('message', (data, isBinary) => {
  if (isBinary) {
    console.log('[CLIENT RECEIVED BINARY CHUNK]');
    return;
  }
  const msg = JSON.parse(data.toString());
  console.log('[CLIENT RECEIVED EVENT]', msg.event, JSON.stringify(msg.payload));

  if (msg.event === 'connection.connected') {
    console.log('Session connected. Starting audio stream...');
    startStreaming();
  }
});

ws.on('error', (err) => {
  console.error('WebSocket client error:', err);
});

ws.on('close', () => {
  console.log('WebSocket client closed.');
});

function startStreaming() {
  const chunkSize = 16000; // 250ms of audio (16000Hz * 2 channels * 2 bytes/sample = 64000 bytes/sec)
  let offset = 0;

  const interval = setInterval(() => {
    if (offset >= pcmBuffer.length) {
      clearInterval(interval);
      console.log('Audio streaming finished. Waiting 5s for transcript/AI response to finalize...');
      setTimeout(() => {
        console.log('Closing session...');
        ws.send(JSON.stringify({
          event: 'session.end',
          payload: {
            sessionId: 'cmqah7m0k0000g0kjlufutsvl'
          }
        }));
        ws.close();
      }, 5000);
      return;
    }

    const chunk = pcmBuffer.subarray(offset, offset + chunkSize);
    ws.send(chunk);
    offset += chunkSize;
    console.log(`Sent chunk of size ${chunk.length} bytes (offset: ${offset}/${pcmBuffer.length})`);
  }, 250);
}
