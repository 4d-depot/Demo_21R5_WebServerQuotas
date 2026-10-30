const BASE_URL = 'http://127.0.0.1/runDemo';
const stats = { total: 0, ok: 0, e429: 0 };
let burstRunning = false;

const logEl = document.getElementById('log');
const statTotalEl = document.getElementById('statTotal');
const statOkEl = document.getElementById('statOk');
const stat429El = document.getElementById('stat429');
const nbSessionsEl = document.getElementById('nbSessions');
const nbGuestSessionsEl = document.getElementById('nbGuestSessions');
const visitorBurstProgressEl = document.getElementById('visitorBurstProgress');
const btnVisitorBurstStart = document.getElementById('btnVisitorBurstStart');
const btnVisitorBurstStop = document.getElementById('btnVisitorBurstStop');
const btnBurstPostStart = document.getElementById('btnBurstPostStart');
const btnBurstPostStop = document.getElementById('btnBurstPostStop');
const btnBurstGetStart = document.getElementById('btnBurstGetStart');
const btnBurstGetStop = document.getElementById('btnBurstGetStop');

function timestamp() {
  const date = new Date();
  return date.toLocaleTimeString('en-GB', { hour12: false }) +
    '.' + String(date.getMilliseconds()).padStart(3, '0');
}

function logLine(text, cssClass = '') {
  const line = document.createElement('div');
  line.className = cssClass;
  line.textContent = text;
  logEl.appendChild(line);
  logEl.scrollTop = logEl.scrollHeight;
}

function updateStats() {
  statTotalEl.textContent = stats.total;
  statOkEl.textContent = stats.ok;
  stat429El.textContent = stats.e429;
}

async function loadSessionCounts() {
  try {
    const response = await fetch('http://127.0.0.1:8044/getHostWebServerInfo?getQuotas=true');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const quotas = await response.json();
    nbSessionsEl.textContent = quotas.nbSessions ?? 0;
    nbGuestSessionsEl.textContent = quotas.nbGuestSessions ?? 0;
  } catch (error) {
    logLine(`Unable to load the number of sessions: ${error.message}`, 'lerr');
  }
}

async function sendRequest({ method = 'GET', body = null, querySize = null } = {}) {
  let url = BASE_URL;
  if (querySize !== null) {
    url += '?size=' + encodeURIComponent(querySize);
  }

  const options = { method, credentials: 'include' };
  if (body !== null) {
    options.body = body;
    options.headers = { 'Content-Type': 'text/plain' };
  }

  const startedAt = performance.now();
  stats.total++;

  try {
    const response = await fetch(url, options);
    const duration = Math.round(performance.now() - startedAt);
    const receivedBytes = (await response.arrayBuffer()).byteLength;

    let cssClass = 'lok';
    if (response.status === 429) {
      stats.e429++;
      cssClass = 'l429';
    } else if (response.ok) {
      stats.ok++;
    }

    const retryAfter = response.headers.get('Retry-After');
    let details = `${timestamp()}  Done  →  status: ${response.status} - ${duration}ms - Response received from the server: ${receivedBytes} bytes`;
    if (retryAfter !== null) details += `  Retry-After: "${retryAfter}"`;

    logLine(details, cssClass);
    updateStats();
  } catch (error) {
    logLine(`${timestamp()}  ${method.padEnd(4)} ${url}  →  ERROR: ${error.message}`, 'lerr');
    updateStats();
  }
}

async function runBurst({ prefix, type, progressEl, stopButton, count, delay }) {
  burstRunning = true;
  btnVisitorBurstStart.disabled = true;
  btnBurstPostStart.disabled = true;
  btnBurstGetStart.disabled = true;
  stopButton.disabled = false;

  for (let index = 1; index <= count && burstRunning; index++) {
    progressEl.textContent = `Request ${index} / ${count}`;

    let requestOptions = { method: 'GET' };
    if (type === 'POST') {
      const size = parseInt(document.getElementById(`${prefix}Size`).value, 10) || 0;
      requestOptions = { method: 'POST', body: 'x'.repeat(Math.max(0, size)) };
    } else if (type === 'GET_WITH_SIZE') {
      const size = parseInt(document.getElementById(`${prefix}Size`).value, 10) || 0;
      requestOptions = { method: 'GET', querySize: size };
    }

    await sendRequest(requestOptions);
    if (delay > 0 && index < count && burstRunning) {
      await new Promise((resolve) => setTimeout(resolve, delay * 1000));
    }
  }

  progressEl.textContent = burstRunning ? 'Burst completed' : 'Burst stopped';
  burstRunning = false;
  btnVisitorBurstStart.disabled = false;
  btnBurstPostStart.disabled = false;
  btnBurstGetStart.disabled = false;
  btnVisitorBurstStop.disabled = true;
  btnBurstPostStop.disabled = true;
  btnBurstGetStop.disabled = true;
  await loadSessionCounts();
}

function startBurst(prefix, type, progressEl, stopButton) {
  const count = parseInt(document.getElementById(`${prefix}Count`).value, 10) || 0;
  const delay = parseInt(document.getElementById(`${prefix}Delay`).value, 10) || 0;
  runBurst({ prefix, type, progressEl, stopButton, count, delay });
}

function stopBurst(stopButton) {
  burstRunning = false;
  stopButton.disabled = true;
}

btnVisitorBurstStart.addEventListener('click', () => {
  startBurst('visitorBurst', 'GET', visitorBurstProgressEl, btnVisitorBurstStop);
});
btnVisitorBurstStop.addEventListener('click', () => stopBurst(btnVisitorBurstStop));
btnBurstPostStart.addEventListener('click', () => {
  startBurst('burstPost', 'POST', document.getElementById('burstPostProgress'), btnBurstPostStop);
});
btnBurstPostStop.addEventListener('click', () => stopBurst(btnBurstPostStop));
btnBurstGetStart.addEventListener('click', () => {
  startBurst('burstGet', 'GET_WITH_SIZE', document.getElementById('burstGetProgress'), btnBurstGetStop);
});
btnBurstGetStop.addEventListener('click', () => stopBurst(btnBurstGetStop));
document.getElementById('btnRefreshSessions').addEventListener('click', loadSessionCounts);
document.getElementById('btnClearLog').addEventListener('click', () => {
  logEl.innerHTML = '';
  stats.total = 0;
  stats.ok = 0;
  stats.e429 = 0;
  updateStats();
});

loadSessionCounts();
