/* auth.js: simulated login, register and password reset.
   Demo only, NOT production security. Accounts use username + password.
   Without cloud saving, accounts are kept in this browser (localStorage).
   With cloud saving ON (databaseUrl in js/config.js) accounts are also kept online (password stored only as a hash),
   so you can log in on any device and your data is loaded. */
const $ = s => document.querySelector(s);

/* ---------- Settings ---------- */
const DEMO = {u: 'demo', p: 'Demo@1234'}; // hard-coded demo account
const PW = /^(?=.*\d).{8,}$/; // password: 8+ characters with at least one number
const UN = /^[a-z0-9_]{3,20}$/; // username: 3 to 20 letters, numbers or underscore
const OFFLINE = 'Could not reach the online database. Check your internet connection and try again.';

/* ---------- Helpers ---------- */
const accts = () => {
  try {
    return JSON.parse(localStorage.getItem('cx_users')) || {};
  } catch {
    return {};
  }
};
// Show (or hide when msg is empty) a message in an alert box
const show = (id, msg) => {
  const box = $(id);
  box.textContent = msg;
  box.classList.toggle('d-none', !msg);
};
const tab = id => bootstrap.Tab.getOrCreateInstance(id).show();
// Disable the submit button while we wait for the online database, so it cannot be pressed twice
const busy = (form, on) => {
  const btn = form.querySelector('button:not([type]), button[type="submit"]');
  if (btn) btn.disabled = on;
};

// Already logged in? Go straight to the app.
if (localStorage.getItem('cx_session') || sessionStorage.getItem('cx_session'))
  location.replace('index.html');

/* ---------- Login: the hard-coded demo account first, then accounts made on the Register tab ---------- */
$('#paneLogin').addEventListener('submit', async e => {
  e.preventDefault();
  show('#lErr', '');
  show('#lOk', '');
  const form = e.target;
  const u = $('#lUser').value.trim().toLowerCase();
  const p = $('#lPass').value;

  if (!u || !p) return show('#lErr', 'Enter your username and password.');
  busy(form, true);
  try {
    let known = u === DEMO.u || u in accts();
    let correct = u === DEMO.u ? p === DEMO.p : accts()[u] === p;

    // Not found or not matching in this browser: check the online accounts (made on another device)
    if (!correct && CLOUD_ON && u !== DEMO.u) {
      const hash = await cloudGetAccount(u);
      if (hash) {
        known = true;
        correct = hash === (await cloudHash(u, p));
      }
    }
    if (!known) return show('#lErr', 'Username not found. Register a new account first.');
    if (!correct) return show('#lErr', 'Incorrect password. Please try again.');

    // Cloud saving: make sure the account exists online, then load the newest data before opening the app
    if (cloudFor(u)) {
      await cloudSetAccount(u, p).catch(() => {});
      await cloudSync(u).catch(() => {});
    }

    // "Remember me" keeps the session after the browser is closed
    const store = $('#remember').checked ? localStorage : sessionStorage;
    store.setItem('cx_session', JSON.stringify({user: u}));
    location.href = 'index.html';
  } catch {
    show('#lErr', OFFLINE);
  } finally {
    busy(form, false);
  }
});

/* ---------- Register: one clear error at a time ---------- */
$('#paneReg').addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target;
  const u = $('#rUser').value.trim().toLowerCase();
  const p = $('#rPass').value;
  let err = '';

  if (!UN.test(u)) err = 'Username must be 3 to 20 letters, numbers or underscores.';
  else if (u === DEMO.u || u in accts()) err = 'This username is already taken.';
  else if (!PW.test(p)) err = 'Password needs 8 or more characters, including a number.';
  else if (p !== $('#rConf').value) err = 'Passwords do not match.';
  if (err) return show('#rErr', err);

  busy(form, true);
  try {
    if (CLOUD_ON) {
      if (await cloudGetAccount(u)) return show('#rErr', 'This username is already taken.');
      await cloudSetAccount(u, p);
    }
    localStorage.setItem('cx_users', JSON.stringify({...accts(), [u]: p}));
    show('#rErr', '');
    form.reset();
    $('#lUser').value = u;
    show('#lOk', 'Account created. Log in to start planning.');
    tab('#tabLogin');
  } catch {
    show('#rErr', OFFLINE);
  } finally {
    busy(form, false);
  }
});

/* ---------- Forgot password (simulated): works for accounts made on the Register tab ---------- */
$('#paneReset').addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target;
  const u = $('#pUser').value.trim().toLowerCase();
  const p = $('#pPass').value;
  const users = accts();

  busy(form, true);
  try {
    const exists = u in users || (CLOUD_ON && u !== DEMO.u && !!(await cloudGetAccount(u)));
    let err = '';

    if (u === DEMO.u) err = 'The demo account password cannot be changed.';
    else if (!exists) err = 'Username not found. Register first.';
    else if (!PW.test(p)) err = 'Password needs 8 or more characters, including a number.';
    else if (p !== $('#pConf').value) err = 'Passwords do not match.';
    if (err) return show('#pErr', err);

    if (CLOUD_ON) await cloudSetAccount(u, p);
    users[u] = p;
    localStorage.setItem('cx_users', JSON.stringify(users));
    show('#pErr', '');
    form.reset();
    $('#lUser').value = u;
    show('#lOk', 'Password updated. Log in with your new password.');
    tab('#tabLogin');
  } catch {
    show('#pErr', OFFLINE);
  } finally {
    busy(form, false);
  }
});

/* ---------- Small buttons ---------- */
$('#toReset').onclick = () => tab('#tabReset');
$('#toLogin').onclick = () => tab('#tabLogin');
$('#useDemo').onclick = () => {
  $('#lUser').value = DEMO.u;
  $('#lPass').value = DEMO.p;
  show('#lErr', '');
};

// Show / hide password (the eye button)
document.querySelectorAll('.eye').forEach(btn => {
  btn.onclick = () => {
    const input = $('#' + btn.dataset.t);
    input.type = input.type === 'password' ? 'text' : 'password';
    btn.innerHTML = `<i class="fa-regular fa-eye${input.type === 'password' ? '' : '-slash'}"></i>`;
  };
});
