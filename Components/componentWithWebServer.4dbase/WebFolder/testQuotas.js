// Démo Rate Limiting — 4D Web Server.
// Toutes les requêtes visent la même URL de base.
const BASE_URL = 'http://127.0.0.1/runDemo';

// --- Etat global / statistiques ---
const stats = { total: 0, ok: 0, e429: 0 };
let burstRunning = false;

// --- Références DOM ---
const logEl = document.getElementById('log');
const statTotalEl = document.getElementById('statTotal');
const statOkEl = document.getElementById('statOk');
const stat429El = document.getElementById('stat429');
const burstPostProgressEl = document.getElementById('burstPostProgress');
const burstGetProgressEl = document.getElementById('burstGetProgress');
const visitorBurstProgressEl = document.getElementById('visitorBurstProgress');
const btnBurstPostStart = document.getElementById('btnBurstPostStart');
const btnBurstGetStart = document.getElementById('btnBurstGetStart');
const btnVisitorBurstStart = document.getElementById('btnVisitorBurstStart');
const btnBurstPostStop = document.getElementById('btnBurstPostStop');
const btnBurstGetStop = document.getElementById('btnBurstGetStop');
const btnVisitorBurstStop = document.getElementById('btnVisitorBurstStop');
const nbSessionsEl = document.getElementById('nbSessions');
const nbGuestSessionsEl = document.getElementById('nbGuestSessions');
const btnRefreshSessions = document.getElementById('btnRefreshSessions');
const nbEntitySetsEl = document.getElementById('nbEntitySets');
const entitySetCountEl = document.getElementById('entitySetCount');
const btnCreateEntitySets = document.getElementById('btnCreateEntitySets');

const queryParams = new URLSearchParams(window.location.search);
const action = queryParams.get('action');

if (action === 'sendData') {
  document.querySelectorAll('.send-data-section').forEach((section) => {
    section.classList.add('send-data-highlight');
  });
}

if (action === 'requestData') {
  document.querySelectorAll('.request-data-section').forEach((section) => {
    section.classList.add('request-data-highlight');
  });
}

if (action === 'workOnSessions') {
  document.querySelector('.sessions-section')?.classList.add('sessions-highlight');
}

if (action === 'workOnEntitySets') {
  document.querySelector('.entity-sets-section').classList.add('entity-sets-highlight');
}

if (action === 'sendRequest') {
  document.querySelector('.send-request-section').classList.add('send-request-highlight');
}

if (action) {
  document.querySelectorAll('section:not(.results-section):not(.current-values):not(.send-data-highlight):not(.request-data-highlight):not(.sessions-highlight):not(.entity-sets-highlight):not(.send-request-highlight)')
    .forEach((section) => section.classList.add('dimmed'));
}

if (queryParams.get('option') === 'newSession') {
  document.querySelectorAll('section.send-data-highlight input[type="checkbox"], section.request-data-highlight input[type="checkbox"]')
    .forEach((checkbox) => {
      checkbox.classList.add('new-session-highlight');
      checkbox.closest('label').classList.add('new-session-highlight');
    });
}

// --- Bandeau de quotas ---
const QUOTA_KEYS = [
  'inBytesPerMin',
  'outBytesPerMin',
  'nbRequestPerMin',
  'nbSessions',
  'nbGuestSessions',
  'inBytesPerMinPerSession',
  'outBytesPerMinPerSession',
  'nbRequestPerMinPerSession',
  'nbEntitySetsPerSession',
];

// --- Utilitaires ---

// Construit une chaîne de la taille demandée (en octets, approximatif car UTF-8 sur 1 octet pour ces caractères)
function makeBody(sizeInBytes) {
  return 'x'.repeat(Math.max(0, sizeInBytes));
}

function timestamp() {
  const d = new Date();
  return d.toLocaleTimeString('en-GB', { hour12: false }) + '.' + String(d.getMilliseconds()).padStart(3, '0');
}

function logLine(text, cssClass) {
  const line = document.createElement('div');
  if (cssClass) line.className = cssClass;
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
    if (nbEntitySetsEl) nbEntitySetsEl.textContent = quotas.nbEntitySets ?? 0;
  } catch (err) {
    logLine(`Unable to load the number of sessions: ${err.message}`, 'lerr');
  }
}

loadSessionCounts();
btnRefreshSessions.addEventListener('click', loadSessionCounts);

// Envoie une requête et journalise le résultat.
// params: { method, body, querySize, newSession }
async function sendRequest({ method = 'GET', body = null, querySize = null, newSession = false, authenticate = false } = {}) {
  let url = BASE_URL;
  if (querySize !== null) {
    url += '?size=' + encodeURIComponent(querySize);
  }
  
  if (authenticate) {
    url += '?authenticate=true';
  }

  const options = {
    method,
    credentials: newSession ? 'omit' : 'include', // 'omit' = pas de cookie envoyé => nouvelle session côté serveur
  };
  if (body !== null) {
    options.body = body;
    options.headers = { 'Content-Type': 'text/plain' };
  }

  const start = performance.now();
  stats.total++;

  try {
    const response = await fetch(url, options);
    const duration = Math.round(performance.now() - start);
    const buf = await response.arrayBuffer();
    const receivedBytes = buf.byteLength;
    const sentBytes = body ? body.length : 0;

    let cssClass = 'lok';
    if (response.status === 429) {
      stats.e429++;
      cssClass = 'l429';
    } else if (response.ok) {
      stats.ok++;
    }

    const retryAfter = response.headers.get('Retry-After');
    let details = `${timestamp()}  Done  →  status: ${response.status} - ${duration}ms - Sent to the server: ${sentBytes} bytes, Response received from the server: ${receivedBytes} bytes`;
    if (retryAfter !== null) details += `  Retry-After: "${retryAfter}"`;
    if (newSession) details += '  [new session]';

    logLine(details, cssClass);
    updateStats();
    return response;
  } catch (err) {
    logLine(`${timestamp()}  ${method.padEnd(4)} ${url}  →  ERROR: ${err.message}`, 'lerr');
    updateStats();
    return null;
  }
}

// --- Requête unique : POST avec corps ---
const btnSendRequest = document.getElementById('btnSendRequest');
if (btnSendRequest) {
  btnSendRequest.addEventListener('click', async () => {
    await sendRequest({ method: 'GET' });
    await loadSessionCounts();
  });
}

document.getElementById('btnPostBody')?.addEventListener('click', async () => {
  const size = parseInt(document.getElementById('bodySize').value, 10) || 0;
  const newSession = document.getElementById('postNewSession').checked;
  await sendRequest({ method: 'POST', body: makeBody(size), newSession });
  await loadSessionCounts();
});

// --- Requête unique : GET avec taille de réponse demandée ---
document.getElementById('btnGetData')?.addEventListener('click', async () => {
  const size = parseInt(document.getElementById('respSize').value, 10) || 0;
  const newSession = document.getElementById('getNewSession').checked;
  await sendRequest({ method: 'GET', querySize: size, newSession });
  await loadSessionCounts();
});

// --- Rafale de requêtes ---
function buildBurstRequestOptions(type) {
  if (type === 'VISITOR') return { method: 'GET' };

  const prefix = type === 'POST' ? 'burstPost' : 'burstGet';
  const size = parseInt(document.getElementById(`${prefix}Size`).value, 10) || 0;
  const newSession = document.getElementById(`${prefix}NewSession`).checked;

  if (type === 'POST') return { method: 'POST', body: makeBody(size), newSession };
  return { method: 'GET', querySize: size, newSession };
}

async function startBurst(type) {
  const isVisitorBurst = type === 'VISITOR';
  const prefix = isVisitorBurst ? 'visitorBurst' : type === 'POST' ? 'burstPost' : 'burstGet';
  const progressEl = isVisitorBurst ? visitorBurstProgressEl : type === 'POST' ? burstPostProgressEl : burstGetProgressEl;
  const stopButton = isVisitorBurst ? btnVisitorBurstStop : type === 'POST' ? btnBurstPostStop : btnBurstGetStop;
  const count = parseInt(document.getElementById(`${prefix}Count`).value, 10) || 0;
  const delay = parseInt(document.getElementById(`${prefix}Delay`).value, 10) || 0;

  burstRunning = true;
  [btnBurstPostStart, btnBurstGetStart, btnVisitorBurstStart].forEach((button) => {
    if (button) button.disabled = true;
  });
  stopButton.disabled = false;

  for (let i = 1; i <= count && burstRunning; i++) {
    progressEl.textContent = `Request ${i} / ${count}`;
    await sendRequest(buildBurstRequestOptions(type));
    if (delay > 0 && i < count) {
      await new Promise((resolve) => setTimeout(resolve, delay * 1000));
    }
  }

  progressEl.textContent = burstRunning ? 'Burst completed' : 'Burst stopped';
  burstRunning = false;
  [btnBurstPostStart, btnBurstGetStart, btnVisitorBurstStart].forEach((button) => {
    if (button) button.disabled = false;
  });
  [btnBurstPostStop, btnBurstGetStop, btnVisitorBurstStop].forEach((button) => {
    if (button) button.disabled = true;
  });
  await loadSessionCounts();
}

btnBurstPostStart.addEventListener('click', () => startBurst('POST'));
btnBurstGetStart.addEventListener('click', () => startBurst('GET'));
if (btnVisitorBurstStart) {
  btnVisitorBurstStart.addEventListener('click', () => startBurst('VISITOR'));
}

async function stopBurst(stopButton) {
  burstRunning = false;
  stopButton.disabled = true;
  await loadSessionCounts();
}

btnBurstPostStop.addEventListener('click', () => stopBurst(btnBurstPostStop));
btnBurstGetStop.addEventListener('click', () => stopBurst(btnBurstGetStop));
if (btnVisitorBurstStop) {
  btnVisitorBurstStop.addEventListener('click', () => stopBurst(btnVisitorBurstStop));
}

// --- Sessions concurrentes  ---
document.getElementById('btnOpenSessions')?.addEventListener('click', async () => {
  const count = parseInt(document.getElementById('sessionCount').value, 10) || 0;
  for (let i = 1; i <= count; i++) {
    await sendRequest({ method: 'GET', newSession: true });
  }
  await loadSessionCounts();
});

// --- Sessions concurrentes (nbGuestSessions) ---
document.getElementById('btnOpenAndAuthenticateSessions')?.addEventListener('click', async () => {
  const count = parseInt(document.getElementById('authenticatedSessionCount').value, 10) || 0;
  for (let i = 1; i <= count; i++) {
    await sendRequest({ method: 'POST', newSession: true, authenticate: true });
  }
  await loadSessionCounts();
});

// Demande la création d'entity sets sur une nouvelle session.
async function createEntitySets() {
  const count = parseInt(entitySetCountEl.value, 10) || 0;

  try {
    const response = await fetch(`http://127.0.0.1/createEntitySet?size=${encodeURIComponent(count)}`);
    const result = await response.json();
    const cssClass = result.status === 429 || result.status === 402 ? 'l429' : 'lok';
    logLine(`${timestamp()}  createEntitySet  →  status: ${result.status} - ${JSON.stringify(result)}`, cssClass);
  } catch (err) {
    logLine(`Unable to create entity sets: ${err.message}`, 'lerr');
  }

  await loadSessionCounts();
}

if (btnCreateEntitySets) {
  btnCreateEntitySets.addEventListener('click', createEntitySets);
}



// --- Divers ---
document.getElementById('btnClearLog').addEventListener('click', () => {
  logEl.innerHTML = '';
  stats.total = 0;
  stats.ok = 0;
  stats.e429 = 0;
  updateStats();
});