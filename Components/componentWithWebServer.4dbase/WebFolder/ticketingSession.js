const REQUEST_URL = 'http://127.0.0.1/runDemo?size=1000';
const REQUEST_INTERVAL_MS = 1000;
const MAX_REQUESTS = 60;

const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const statusEl = document.getElementById('status');
const logEl = document.getElementById('log');

let running = false;
let total = 0;
let accepted = 0;
let limited = 0;

function logResult(message, className) {
  const line = document.createElement('div');
  line.className = className;
  line.textContent = message;
  logEl.appendChild(line);
  logEl.scrollTop = logEl.scrollHeight;
}

function updateStatus() {
  statusEl.textContent = `${total}/${MAX_REQUESTS} requests · ${accepted} accepted · ${limited} rate-limited`;
}

async function sendRequest() {
  total++;

  try {
    const response = await fetch(REQUEST_URL, { credentials: 'include' });
    const retryAfter = response.headers.get('Retry-After');
    if (response.status === 429) {
      limited++;
      logResult(`Request ${total}: HTTP 429 Too Many Requests${retryAfter ? ` · Retry-After: ${retryAfter}` : ''}`, 'limited');
    } else if (response.ok) {
      accepted++;
      logResult(`Request ${total}: HTTP ${response.status} · ${response.statusText}`, 'accepted');
    } else {
      logResult(`Request ${total}: HTTP ${response.status} · ${response.statusText}`, 'error');
    }
  } catch (error) {
    logResult(`Request ${total}: Network error · ${error.message}`, 'error');
    running = false;
  }

  updateStatus();
}

async function runRefreshLoop() {
  running = true;
  startButton.disabled = true;
  stopButton.disabled = false;

  while (running && total < MAX_REQUESTS) {
    await sendRequest();
    if (running && total < MAX_REQUESTS) {
      await new Promise((resolve) => setTimeout(resolve, REQUEST_INTERVAL_MS));
    }
  }

  running = false;
  startButton.disabled = false;
  stopButton.disabled = true;
  if (total >= MAX_REQUESTS) {
    statusEl.textContent += ' · Demo complete';
  } else if (total > 0) {
    statusEl.textContent += ' · Stopped';
  }
}

startButton.addEventListener('click', runRefreshLoop);
stopButton.addEventListener('click', () => {
  running = false;
  stopButton.disabled = true;
});
