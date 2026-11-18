/* dashboard.js: landing page after login.
   Shows summary cards, the next journey, reminders and two charts (calculated from the saved data). */
(() => {
  const T = D.trips;
  const E = D.expenses;
  const spent = E.reduce((sum, x) => sum + x.amt, 0);

  /* ---------- Next journey: a trip happening now, otherwise the nearest upcoming trip ---------- */
  const upcoming = T.filter(t => status(t) === 'Upcoming').sort((a, b) => a.start.localeCompare(b.start));
  const nx = T.find(t => status(t) === 'Ongoing') || upcoming[0];

  const stat = (icon, value, label) => `
    <div class="col-6 col-lg-3">
      <div class="card-box stat">
        <i class="fa-solid ${icon}"></i>
        <div><div class="fs-4 fw-bold lh-1">${value}</div><small class="text-muted">${label}</small></div>
      </div>
    </div>`;

  const reminders = T.filter(t => status(t) !== 'Completed')
    .sort((a, b) => a.start.localeCompare(b.start))
    .map(
      t => `
      <li class="d-flex justify-content-between py-2 border-bottom">
        <span>${esc(t.name)} in ${esc(t.dest)}</span>
        <span class="text-muted">${status(t) === 'Ongoing' ? 'Happening now' : left(t.start) + ' days left'}</span>
      </li>`,
    )
    .join('');

  let next = `<p class="text-muted">No upcoming trips yet.</p>
    <a href="trips.html?new=1" class="btn btn-sm btn-primary rounded-pill">Plan your first trip</a>`;
  if (nx) {
    const items = D.pack.filter(p => p.tid === nx.id);
    const packed = items.filter(p => p.done).length;
    const pct = items.length ? Math.round((packed / items.length) * 100) : 0;
    const when = status(nx) === 'Ongoing' ? 'Happening now' : left(nx.start) + ' days to go';
    next = `
      <p class="fs-4 fw-bold text-primary mb-0">${esc(nx.dest)}</p>
      <p class="text-muted small">${nx.start} to ${nx.end}</p>
      <span class="badge rounded-pill bg-warning text-dark fs-6">${when}</span>
      <a href="itinerary.html" class="btn btn-sm btn-primary rounded-pill ms-2">View itinerary</a>
      <hr>
      <h2 class="h6 fw-bold">Packing progress</h2>
      <div class="progress mb-1"><div class="progress-bar" style="width:${pct}%"></div></div>
      <small class="text-muted">${
        items.length
          ? `${packed} of ${items.length} items packed (${pct}%)`
          : 'No packing list yet. Open Packing to generate one.'
      }</small>`;
  }

  /* ---------- Page layout ---------- */
  const dateText = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  view(`
    <div class="banner mb-4">
      <h1 class="h3 fw-bold">Hello, ${esc(U)}!</h1>
      <p class="mb-3">${dateText}. ${T.length ? 'Where to next?' : 'Your planner is empty. Start with your first trip.'}</p>
      <div>
        <a href="${T.length ? 'destinations.html' : 'trips.html?new=1'}" class="btn btn-light rounded-pill fw-semibold">
          ${T.length ? 'Find ideas' : 'Add a trip'}
        </a>
      </div>
    </div>

    <div class="row g-3 mb-4">
      ${stat('fa-suitcase-rolling', T.length, 'Total trips')}
      ${stat('fa-plane-departure', upcoming.length, 'Upcoming')}
      ${stat('fa-wallet', rm(spent), 'Total spent')}
      ${stat('fa-heart', D.dreams.length, 'Dream places')}
    </div>

    <div class="row g-3 mb-4">
      <div class="col-lg-5"><div class="card-box h-100"><h2 class="h6 fw-bold">Next journey</h2>${next}</div></div>
      <div class="col-lg-7">
        <div class="card-box h-100">
          <h2 class="h6 fw-bold">Reminders</h2>
          <ul class="list-unstyled mb-0">${reminders || '<li class="text-muted">Nothing coming up.</li>'}</ul>
        </div>
      </div>
    </div>

    <div class="row g-3">
      <div class="col-md-5">
        <div class="card-box">
          <h2 class="h6 fw-bold mb-0">Spending by category</h2>
          <small class="text-muted d-block mb-3">Where your money went across all trips</small>
          <canvas id="c1"></canvas>
        </div>
      </div>
      <div class="col-md-7">
        <div class="card-box">
          <h2 class="h6 fw-bold mb-0">Monthly spending</h2>
          <small class="text-muted d-block mb-3">Total spent per month. Months without spending show RM 0.</small>
          <canvas id="c2"></canvas>
        </div>
      </div>
    </div>`);

  /* ---------- Chart 1: spending by category (calculated from the saved expenses) ---------- */
  pie(
    $('#c1'),
    CATS,
    CATS.map(c => E.filter(x => x.cat === c).reduce((sum, x) => sum + x.amt, 0)),
  );

  /* ---------- Chart 2: spending per month, including months with no spending ---------- */
  const perMonth = {};
  E.forEach(x => {
    const key = x.date.slice(0, 7);
    perMonth[key] = (perMonth[key] || 0) + x.amt;
  });
  const keys = Object.keys(perMonth).sort();
  const months = [];
  if (keys.length) {
    let [y, m] = keys[0].split('-').map(Number);
    const [lastY, lastM] = keys[keys.length - 1].split('-').map(Number);
    while (y < lastY || (y === lastY && m <= lastM)) {
      months.push(`${y}-${String(m).padStart(2, '0')}`);
      if (++m > 12) {
        m = 1;
        y++;
      }
    }
  }
  bars(
    $('#c2'),
    months.map(k => new Date(k + '-15').toLocaleDateString('en-US', {month: 'short', year: 'numeric'})),
    months.map(k => perMonth[k] || 0),
  );
})();
