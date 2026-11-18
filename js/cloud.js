/* cloud.js: optional online saving, so an account's data follows it to any device (laptop, phone, another browser).
   It talks to a Firebase Realtime Database with plain fetch() (REST), so no extra library is needed.
   Put the database address in js/config.js (databaseUrl). While it is empty the app works exactly as before
   and saves in this browser only. */

/* ---------- Settings (read from js/config.js) ---------- */
const CLOUD_URL = String((window.CX_CONFIG || {}).databaseUrl || '')
  .trim()
  .replace(/\/+$/, '');
const CLOUD_ON = /^https:\/\/.+/.test(CLOUD_URL);
const CLOUD_DEMO = !!(window.CX_CONFIG || {}).syncDemo;
const CLOUD_KEYS = ['trips', 'expenses', 'acts', 'pack', 'dreams', 'budget']; // the lists saved online

/* Which accounts are saved online: every account, except the shared demo account (unless syncDemo is true) */
const cloudFor = user => CLOUD_ON && !!user && user !== 'guest' && (user !== 'demo' || CLOUD_DEMO);
/* Usernames are only letters, numbers and underscore, so they are safe to use inside the database path */
const cloudSafe = user => /^[a-z0-9_]{3,20}$/.test(user);

/* ---------- One request to the database (gives up after 8 seconds) ---------- */
async function cloudCall(path, method = 'GET', body) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(`${CLOUD_URL}/${path}.json`, {
      method,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error('Cloud request failed: ' + res.status);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/* ---------- Accounts: only a SHA-256 hash of the password is stored online, never the password itself ---------- */
async function cloudHash(user, pass) {
  const text = `conan-travel:${user}:${pass}`;
  if (window.crypto && crypto.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
  }
  return sha256Plain(text); // browsers on plain http:// have no crypto.subtle, so use the same maths written out below
}

/* SHA-256 written out in plain JavaScript. It gives exactly the same result as crypto.subtle. */
function sha256Plain(text) {
  const frac = x => Math.floor((x - Math.floor(x)) * 4294967296);
  const primes = [];
  for (let n = 2; primes.length < 64; n++) if (primes.every(p => n % p)) primes.push(n);
  const K = primes.map(p => frac(Math.cbrt(p)));
  let H = primes.slice(0, 8).map(p => frac(Math.sqrt(p)));
  const rotr = (x, n) => (x >>> n) | (x << (32 - n));

  // Pad the message: a 1 bit, zeros, then the length in bits
  const bytes = [...new TextEncoder().encode(text)];
  const bitLength = bytes.length * 8;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  for (let i = 7; i >= 0; i--) bytes.push(i >= 4 ? 0 : (bitLength >>> (i * 8)) & 255);

  for (let off = 0; off < bytes.length; off += 64) {
    const w = new Array(64);
    for (let i = 0; i < 16; i++) {
      w[i] =
        (bytes[off + 4 * i] << 24) |
        (bytes[off + 4 * i + 1] << 16) |
        (bytes[off + 4 * i + 2] << 8) |
        bytes[off + 4 * i + 3];
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const t1 = (h + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0;
      const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
      h = g;
      g = f;
      f = e;
      e = (d + t1) | 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) | 0;
    }
    H = H.map((v, i) => (v + [a, b, c, d, e, f, g, h][i]) | 0);
  }
  return H.map(v => (v >>> 0).toString(16).padStart(8, '0')).join('');
}
// Returns the stored hash, or null when the username does not exist online
const cloudGetAccount = async user => (cloudSafe(user) ? cloudCall(`accounts/${user}`) : null);
const cloudSetAccount = async (user, pass) =>
  cloudCall(`accounts/${user}`, 'PUT', await cloudHash(user, pass));

/* ---------- Saving data ----------
   Every change is first saved in this browser (core.js), then sent online a moment later.
   "ts" is the time of the newest change. It decides which copy is newer when two devices meet. */
const cloudTs = user => +localStorage.getItem(`cx_${user}_ts`) || 0;
let cloudPending = {};
let cloudTimer = null;
let cloudChain = Promise.resolve();

// Called by save() in core.js after every change
function cloudSaved(user, key, value) {
  if (!cloudFor(user) || !CLOUD_KEYS.includes(key)) return;
  const ts = Date.now();
  localStorage.setItem(`cx_${user}_ts`, String(ts));
  cloudPending[key] = JSON.stringify(value);
  clearTimeout(cloudTimer);
  // Wait 0.6 seconds so quick typing (e.g. the budget boxes) sends one request, not one per key press
  cloudTimer = setTimeout(() => {
    const batch = {...cloudPending, ts};
    cloudPending = {};
    cloudChain = cloudChain
      .then(() => cloudCall(`users/${user}/data`, 'PATCH', batch))
      .then(() => localStorage.removeItem(`cx_${user}_dirty`))
      .catch(() => localStorage.setItem(`cx_${user}_dirty`, '1')); // failed (offline?): send everything next time
  }, 600);
}

// Send every list of this account to the database
function cloudPushAll(user, ts) {
  const data = {ts};
  CLOUD_KEYS.forEach(k => {
    const v = localStorage.getItem(`cx_${user}_${k}`);
    if (v !== null) data[k] = v;
  });
  return cloudCall(`users/${user}/data`, 'PATCH', data);
}

/* ---------- Loading data ----------
   Compares this browser with the database and keeps the newer copy.
   Returns 'applied' (database was newer, data copied here), 'pushed' (this browser was newer),
   'same' or 'off'. */
async function cloudSync(user) {
  if (!cloudFor(user)) return 'off';
  const remote = (await cloudCall(`users/${user}/data`)) || {};
  const remoteTs = +remote.ts || 0;
  const localTs = cloudTs(user);
  const hasLocal = CLOUD_KEYS.some(k => localStorage.getItem(`cx_${user}_${k}`) !== null);
  const dirty = localStorage.getItem(`cx_${user}_dirty`) === '1';

  if (!dirty && remoteTs > localTs) {
    CLOUD_KEYS.forEach(k =>
      remote[k] === undefined
        ? localStorage.removeItem(`cx_${user}_${k}`)
        : localStorage.setItem(`cx_${user}_${k}`, remote[k]),
    );
    localStorage.setItem(`cx_${user}_ts`, String(remoteTs));
    return 'applied';
  }
  if (dirty || localTs > remoteTs || (!remoteTs && hasLocal)) {
    const ts = localTs || Date.now();
    await cloudPushAll(user, ts);
    localStorage.setItem(`cx_${user}_ts`, String(ts));
    localStorage.removeItem(`cx_${user}_dirty`);
    return 'pushed';
  }
  return 'same';
}

/* ---------- On every page after login: check the database once, reload if it had newer data ---------- */
(() => {
  const ses = JSON.parse(
    localStorage.getItem('cx_session') || sessionStorage.getItem('cx_session') || 'null',
  );
  const user = ses && ses.user;
  const onLoginPage = document.body && document.body.classList.contains('auth-body');
  if (!cloudFor(user) || onLoginPage) return;

  cloudSync(user)
    .then(result => {
      if (result === 'applied') location.reload();
    })
    .catch(() => {});
  // Closed the page before the 0.6 second wait ended: remember to send everything next time
  addEventListener('pagehide', () => {
    if (Object.keys(cloudPending).length) localStorage.setItem(`cx_${user}_dirty`, '1');
  });
})();
