/* core.js: loaded by every page after login.
   Contains: per-user storage, helper functions, sample data, chart helpers,
   the shared add/edit form (modal) and the reusable data table page (crud). */
'use strict';

/* =====================================================================
   1. Shortcuts and the logged-in user
   ===================================================================== */
const $ = s => document.querySelector(s);
const SES = JSON.parse(localStorage.getItem('cx_session') || sessionStorage.getItem('cx_session') || 'null');
const U = SES ? SES.user : 'guest';
const DEMO = U === 'demo';

/* =====================================================================
   2. Storage: every account has its own data, so a new account starts empty
   ===================================================================== */
const load = (key, fallback) => {
  try {
    const v = localStorage.getItem(`cx_${U}_${key}`);
    return v === null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
};
const save = (key, value) => {
  localStorage.setItem(`cx_${U}_${key}`, JSON.stringify(value));
  if (typeof cloudSaved === 'function') cloudSaved(U, key, value);
};

/* =====================================================================
   3. Helper functions
   ===================================================================== */
const esc = s => String(s).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
const rm = n => 'RM ' + (+n).toLocaleString('en-MY', {minimumFractionDigits: 2, maximumFractionDigits: 2});
const view = html => {
  $('#view').innerHTML = html;
};
let _uidCounter = 0;
const uid = () => Date.now() * 1000 + (++_uidCounter % 1000);

const iso = d => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const day = n => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return iso(d);
};
const today = () => day(0);
const left = d => Math.round((new Date(d) - new Date(today())) / 864e5);

const status = t => (today() < t.start ? 'Upcoming' : today() > t.end ? 'Completed' : 'Ongoing');
const BADGE = {Upcoming: 'primary', Ongoing: 'success', Completed: 'secondary'};

const CATS = ['Accommodation', 'Transport', 'Food', 'Activities', 'Shopping', 'Emergency'];
const COL = ['#1565D8', '#4FC3F7', '#FF8A3D', '#2ECC9A', '#8E7CF8', '#F25F7A'];
const CAT_COL = Object.fromEntries(CATS.map((c, i) => [c, COL[i]]));

const toast = (msg, type = 'success') => {
  const box = document.createElement('div');
  box.className = `alert alert-${type} toast-msg shadow`;
  box.textContent = msg;
  document.body.append(box);
  setTimeout(() => box.remove(), 2400);
};

const head = (title, desc) => `
  <div class="mb-3">
    <h1 class="h4 fw-bold mb-1">${title}</h1>
    <p class="text-muted small mb-0">${desc}</p>
  </div>`;

const empty = (icon, title, text, link = '') => `
  <div class="card-box text-center py-5">
    <i class="fa-solid ${icon} fs-1 text-primary mb-3"></i>
    <h2 class="h5">${title}</h2>
    <p class="text-muted">${text}</p>
    ${link}
  </div>`;

const photo = (cls, icon, title, sub) => `
  <div class="photo-box ${cls} mb-4">
    <div class="photo-cap">
      <h2 class="h5 fw-bold"><i class="fa-solid ${icon} me-2"></i>${title}</h2>
      <p class="mb-0 small opacity-75">${sub}</p>
    </div>
  </div>`;

const jget = async url => {
  const ctrl = new AbortController();
  setTimeout(() => ctrl.abort(), 6000);
  return (await fetch(url, {signal: ctrl.signal})).json();
};

/* =====================================================================
   4. Data. The demo account has sample data; every other account starts with nothing.
   Expenses, activities and packing items point to their trip with "tid" (the trip id),
   so renaming a trip never breaks the link.
   ===================================================================== */
const D = {
  trips: load(
    'trips',
    DEMO
      ? [
          {
            id: 1,
            name: 'Island Escape',
            dest: 'Langkawi',
            start: day(37),
            end: day(41),
            pax: 4,
            budget: 2500,
          },
          {id: 2, name: 'Food Hunt', dest: 'Penang', start: day(-95), end: day(-92), pax: 3, budget: 1200},
          {
            id: 3,
            name: 'Highland Retreat',
            dest: 'Cameron Highlands',
            start: day(-1),
            end: day(2),
            pax: 2,
            budget: 900,
          },
          {id: 4, name: 'Heritage Walk', dest: 'Melaka', start: day(85), end: day(87), pax: 2, budget: 700},
        ]
      : [],
  ),

  expenses: load(
    'expenses',
    DEMO
      ? [
          {id: 1, tid: 2, desc: 'Homestay, 3 nights', cat: 'Accommodation', date: day(-95), amt: 420},
          {id: 2, tid: 2, desc: 'Street food crawl', cat: 'Food', date: day(-94), amt: 180},
          {id: 3, tid: 2, desc: 'E-hailing rides', cat: 'Transport', date: day(-93), amt: 95},
          {id: 4, tid: 3, desc: 'Chalet booking', cat: 'Accommodation', date: day(-1), amt: 480},
          {id: 5, tid: 3, desc: 'Strawberry farm tour', cat: 'Activities', date: day(0), amt: 60},
          {id: 6, tid: 1, desc: 'Flight tickets', cat: 'Transport', date: day(-20), amt: 760},
        ]
      : [],
  ),

  acts: load(
    'acts',
    DEMO
      ? [
          {id: 1, tid: 1, date: day(37), time: '14:00', title: 'Check in at hotel', place: 'Pantai Cenang'},
          {id: 2, tid: 1, date: day(38), time: '09:30', title: 'Island hopping tour', place: 'Jeti Kuah'},
          {id: 3, tid: 1, date: day(39), time: '18:00', title: 'Sunset dinner', place: 'Pantai Tengah'},
          {id: 4, tid: 4, date: day(85), time: '10:00', title: 'Jonker Street walk', place: 'Melaka city'},
        ]
      : [],
  ),

  pack: load(
    'pack',
    DEMO
      ? [
          {id: 1, tid: 1, name: 'Passport / IC', cat: 'Documents', qty: 1, done: true},
          {id: 2, tid: 1, name: 'Phone charger', cat: 'Electronics', qty: 1, done: true},
          {id: 3, tid: 1, name: 'Swimwear', cat: 'Clothing', qty: 2, done: false},
          {id: 4, tid: 1, name: 'Sunscreen', cat: 'Toiletries', qty: 1, done: false},
          {id: 5, tid: 3, name: 'Rain jacket', cat: 'Clothing', qty: 1, done: true},
          {id: 6, tid: 3, name: 'Power bank', cat: 'Electronics', qty: 1, done: true},
          {id: 7, tid: 3, name: 'Insect repellent', cat: 'Toiletries', qty: 1, done: false},
        ]
      : [],
  ),
};

D.dreams = load(
  'dreams',
  DEMO
    ? [
        {
          id: 1,
          name: 'Kyoto',
          place: 'Japan',
          pri: 'High',
          status: 'Dreaming',
          cost: 6000,
          note: 'See the temples in autumn.',
          ll: [35.0116, 135.7681],
        },
        {
          id: 2,
          name: 'Santorini',
          place: 'Greece',
          pri: 'Medium',
          status: 'Planning',
          cost: 9000,
          note: 'Sunset in Oia.',
          ll: [36.3932, 25.4615],
        },
        {
          id: 3,
          name: 'Langkawi',
          place: 'Malaysia',
          pri: 'Low',
          status: 'Visited',
          cost: 1500,
          note: 'Island hopping done.',
          ll: [6.35, 99.8],
        },
      ]
    : [],
);
const DSTAT = {Dreaming: '#FF8A3D', Planning: '#1565D8', Visited: '#2ECC9A'};
const saveDreams = () => save('dreams', D.dreams);

/* Older saved records stored the trip NAME. Convert them to the trip id (once),
   so data saved by an earlier version of this app keeps working. */
['expenses', 'acts', 'pack'].forEach(key => {
  let changed = false;
  D[key] = D[key].map(r => {
    if (r.tid || typeof r.trip !== 'string') return r;
    changed = true;
    const trip = D.trips.find(t => t.name === r.trip);
    const {trip: _oldName, ...rest} = r;
    return {...rest, tid: trip ? trip.id : 0};
  });
  if (changed) save(key, D[key]);
});

const tripName = id => (D.trips.find(t => t.id == id) || {name: '(deleted trip)'}).name;
const tripOptions = () => D.trips.map(t => ({v: t.id, l: t.name}));

/* =====================================================================
   5. Charts (Chart.js). Colours follow the light or dark theme.
   ===================================================================== */
const DARK = () => document.documentElement.dataset.bsTheme === 'dark';
if (window.Chart) {
  Chart.defaults.color = DARK() ? '#C9D8EE' : '#44546A';
  Chart.defaults.borderColor = DARK() ? '#2A3950' : '#EEF2F8';
  Chart.defaults.font.family = 'Poppins';
}

const noData = el =>
  el.replaceWith(
    Object.assign(document.createElement('p'), {
      className: 'text-muted small mb-0',
      textContent: 'No data yet. Add a record and this chart will fill in.',
    }),
  );

function pie(el, labels, vals) {
  const keep = vals.map((v, i) => i).filter(i => vals[i] > 0);
  const sum = vals.reduce((a, b) => a + b, 0);
  if (!sum) return noData(el);
  return new Chart(el, {
    type: 'doughnut',
    data: {
      labels: keep.map(i => labels[i]),
      datasets: [
        {
          data: keep.map(i => vals[i]),
          backgroundColor: keep.map(i => CAT_COL[labels[i]]),
          borderColor: DARK() ? '#172236' : '#fff',
          borderWidth: 3,
        },
      ],
    },
    options: {
      cutout: '62%',
      plugins: {
        legend: {position: 'bottom', labels: {usePointStyle: true, padding: 14}},
        tooltip: {
          callbacks: {label: c => ` ${c.label}: ${rm(c.parsed)} (${Math.round((c.parsed / sum) * 100)}%)`},
        },
      },
    },
  });
}

function bars(el, labels, vals) {
  if (!vals.length) return noData(el);
  return new Chart(el, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          data: vals,
          backgroundColor: '#1565D8',
          hoverBackgroundColor: '#FF8A3D',
          borderRadius: 8,
          maxBarThickness: 48,
        },
      ],
    },
    options: {
      plugins: {legend: {display: false}, tooltip: {callbacks: {label: c => ' ' + rm(c.parsed.y)}}},
      scales: {y: {beginAtZero: true, ticks: {callback: v => 'RM ' + v}}, x: {grid: {display: false}}},
    },
  });
}

/* =====================================================================
   6. Add / edit form: one modal shared by every data page
   ===================================================================== */
document.body.insertAdjacentHTML(
  'beforeend',
  `<div class="modal fade" id="formModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <form class="modal-content" id="modalForm" novalidate>
        <div class="modal-header">
          <h2 class="modal-title h5" id="modalTitle"></h2>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div id="modalErr" class="text-danger small mb-2"></div>
          <div id="modalBody"></div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-light rounded-pill" data-bs-dismiss="modal">Cancel</button>
          <button class="btn btn-primary rounded-pill">Save</button>
        </div>
      </form>
    </div>
  </div>`,
);

/* Build one form field.
   x.k = field name, x.l = label, x.t = input type, x.r === false means optional,
   x.o = list of choices (text, or {v: value, l: label}) which makes it a drop-down. */
function fieldHtml(x, values) {
  const id = 'f_' + x.k;
  const label = `<label class="form-label small fw-semibold" for="${id}">${x.l}</label>`;

  if (x.o) {
    const options = x.o.map(o => {
      const value = typeof o === 'object' ? o.v : o;
      const text = typeof o === 'object' ? o.l : o;
      const selected = String(values[x.k]) === String(value) ? 'selected' : '';
      return `<option value="${esc(value)}" ${selected}>${esc(text)}</option>`;
    });
    return `<div class="mb-3">${label}<select class="form-select" id="${id}" name="${x.k}">${options.join('')}</select></div>`;
  }

  const numberAttrs = x.t === 'number' ? 'min="0" step="any"' : '';
  const required = x.r === false ? '' : 'required';
  return `<div class="mb-3">${label}
    <input class="form-control" id="${id}" name="${x.k}" type="${x.t || 'text'}" ${numberAttrs}
      value="${esc(values[x.k] ?? '')}" ${required}>
    <div class="invalid-feedback">This field is required.</div></div>`;
}

/* Open the form.
   onSave(data) returns an error message (text) or nothing when the save worked; done() runs after a good save. */
function openForm(title, fields, values, onSave, done) {
  $('#modalTitle').textContent = title;
  $('#modalErr').textContent = '';
  const form = $('#modalForm');
  form.classList.remove('was-validated');
  $('#modalBody').innerHTML = fields.map(x => fieldHtml(x, values)).join('');

  const modal = bootstrap.Modal.getOrCreateInstance('#formModal');
  form.onsubmit = e => {
    e.preventDefault();
    form.classList.add('was-validated');
    if (!form.checkValidity()) return;
    const err = onSave(Object.fromEntries(new FormData(form)));
    if (err) {
      $('#modalErr').textContent = err;
      return;
    }
    modal.hide();
    done();
  };
  modal.show();
}

/* =====================================================================
   7. Reusable data table page: search, filter, add, edit, delete.
   Each data page describes itself with an object c (see trips.js for an example):
     title, desc, key (name in D), add (button text), opts (filter choices), icon, empty (empty-state title),
     top() extra HTML above the table, match(x) value compared with the filter, text(x) text that the search looks in,
     sort(a, b), heads (column titles), row(x) table cells, fields() form fields,
     check(data) returns an error text, build(data, id) makes the saved record,
     deleteMsg(x) and onDelete(x) are optional extras for deleting.
   Returns the "add" function.
   ===================================================================== */
function crud(c) {
  view(`${c.top ? c.top() : ''}${head(c.title, c.desc)}
    <div class="d-flex flex-wrap gap-2 mb-3">
      <input id="q" class="form-control w-auto" placeholder="Search..." aria-label="Search">
      <select id="s" class="form-select w-auto" aria-label="Filter">
        ${['All', ...c.opts].map(o => `<option>${esc(o)}</option>`).join('')}
      </select>
      <button id="add" class="btn btn-primary rounded-pill ms-auto">
        <i class="fa-solid fa-plus me-1"></i>${c.add}
      </button>
    </div>
    <div id="tbl"></div>`);

  const refresh = () => crud(c);

  const buttons = x => `
    <button class="btn btn-sm btn-light" data-a="e" data-id="${x.id}" aria-label="Edit"><i class="fa-solid fa-pen"></i></button>
    <button class="btn btn-sm btn-light text-danger" data-a="d" data-id="${x.id}" aria-label="Delete"><i class="fa-solid fa-trash"></i></button>`;

  /* Column sorting: click a column title to sort A-Z, click it again for Z-A.
     The chosen column is remembered in c, so it stays after adding, editing or deleting a record. */
  if (c.sortCol === undefined) {
    c.sortCol = -1;
    c.sortDir = 1;
  }
  const compare = (a, b) =>
    typeof a === 'number' && typeof b === 'number'
      ? a - b
      : String(a).localeCompare(String(b), undefined, {numeric: true, sensitivity: 'base'});

  // One column title: a button with an arrow that shows the current direction
  const headCell = (title, i) => {
    if (!c.keys || !c.keys[i]) return `<th>${title}</th>`;
    const numeric = typeof c.keys[i](D[c.key][0]) === 'number';
    const active = c.sortCol === i;
    const icon = !active
      ? 'fa-sort'
      : c.sortDir === 1
        ? numeric
          ? 'fa-arrow-down-1-9'
          : 'fa-arrow-down-a-z'
        : numeric
          ? 'fa-arrow-up-9-1'
          : 'fa-arrow-up-z-a';
    const state = !active ? 'none' : c.sortDir === 1 ? 'ascending' : 'descending';
    return `<th aria-sort="${state}">
      <button type="button" class="th-sort ${active ? 'active' : ''}" data-col="${i}"
        title="Sort ${title}: click for A to Z, click again for Z to A">${title}<i class="fa-solid ${icon}"></i></button>
    </th>`;
  };

  const draw = () => {
    if (!D[c.key].length) {
      $('#tbl').innerHTML = empty(c.icon, c.empty, `Press "${c.add}" to begin.`);
      return;
    }
    const q = $('#q').value.toLowerCase();
    const s = $('#s').value;
    const rows = D[c.key]
      .filter(x => (s === 'All' || c.match(x) === s) && c.text(x).toLowerCase().includes(q))
      .sort((a, b) =>
        c.sortCol >= 0 && c.keys
          ? compare(c.keys[c.sortCol](a), c.keys[c.sortCol](b)) * c.sortDir || c.sort(a, b)
          : c.sort(a, b),
      );

    $('#tbl').innerHTML = rows.length
      ? `<div class="card-box table-responsive">
          <table class="table align-middle mb-0">
            <thead><tr>${c.heads.map(headCell).join('')}<th></th></tr></thead>
            <tbody>
              ${rows.map(x => `<tr>${c.row(x)}<td class="text-end text-nowrap">${buttons(x)}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>`
      : '<div class="card-box text-center text-muted py-4">Nothing found. Change the search or filter.</div>';
  };

  const put = (id, data) => {
    const err = c.check(data);
    if (err) return err;
    const record = c.build(data, id || uid());
    D[c.key] = id ? D[c.key].map(x => (x.id === id ? record : x)) : [...D[c.key], record];
    save(c.key, D[c.key]);
    toast('Saved');
  };

  const add = preset => openForm(c.add, c.fields(), preset || {}, data => put(0, data), refresh);

  $('#q').oninput = $('#s').onchange = draw;
  $('#add').onclick = () => add();

  $('#tbl').onclick = e => {
    const sortBtn = e.target.closest('[data-col]');
    if (sortBtn) {
      const col = +sortBtn.dataset.col;
      c.sortDir = c.sortCol === col ? -c.sortDir : 1;
      c.sortCol = col;
      draw();
      const again = $(`#tbl [data-col="${col}"]`);
      if (again) again.focus();
      return;
    }
    const btn = e.target.closest('button');
    if (!btn) return;
    const x = D[c.key].find(i => i.id == btn.dataset.id);

    if (btn.dataset.a === 'e') {
      openForm('Edit', c.fields(), x, data => put(x.id, data), refresh);
    } else if (confirm(c.deleteMsg ? c.deleteMsg(x) : 'Delete this record? This cannot be undone.')) {
      D[c.key] = D[c.key].filter(i => i !== x);
      save(c.key, D[c.key]);
      if (c.onDelete) c.onDelete(x);
      toast('Deleted');
      refresh();
    }
  };

  draw();
  return add;
}
