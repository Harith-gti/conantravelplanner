/* budget.js: budget planner by category (with a chart) and a converter for every currency (live rate API). */
(() => {
  /* ---------- Saved budget: total + amount planned for each category ---------- */
  const B = load(
    'budget',
    DEMO ? {total: 3000, al: [1200, 600, 500, 300, 200, 100]} : {total: 0, al: [0, 0, 0, 0, 0, 0]},
  );
  const spent = CATS.map(c => D.expenses.filter(x => x.cat === c).reduce((sum, x) => sum + x.amt, 0));
  let R = null;

  /* ---------- Page layout ---------- */
  const categoryRows = CATS.map(
    (c, i) => `
    <div class="d-flex align-items-center gap-2 mb-2">
      <span class="dot" style="background:${COL[i]}"></span>
      <label class="small flex-grow-1">${c}<br><span class="text-muted">Spent ${rm(spent[i])}</span></label>
      <input type="number" min="0" class="form-control form-control-sm al w-auto" style="max-width:110px"
        value="${B.al[i]}" aria-label="${c}">
    </div>`,
  ).join('');

  view(`
    ${head('Budget & Currency', 'Step 1: decide how much to spend on each category in Ringgit (RM). Step 2: convert your money to any currency in the world.')}
    <div class="row g-3">
      <div class="col-lg-5">
        <div class="card-box h-100">
          <h2 class="h6 fw-bold mb-3">1. Plan your budget (RM)</h2>
          <label class="form-label small fw-semibold" for="bt">Total budget</label>
          <input id="bt" type="number" min="0" class="form-control mb-3" value="${B.total}">
          <p class="small text-muted">Split it across these categories. The grey text shows what you have already spent.</p>
          ${categoryRows}
        </div>
      </div>
      <div class="col-lg-7">
        <div class="card-box mb-3">
          <div class="row text-center mb-2">
            <div class="col"><small class="text-muted">Allocated</small><div class="fs-5 fw-bold" id="ba"></div></div>
            <div class="col"><small class="text-muted">Left to allocate</small><div class="fs-5 fw-bold" id="br"></div></div>
          </div>
          <div id="bw"></div>
        </div>
        <div class="card-box">
          <h2 class="h6 fw-bold mb-3">2. Convert your money</h2>
          <label class="form-label small fw-semibold" for="ca">Amount</label>
          <input id="ca" type="number" min="0" value="100" class="form-control">
          <div class="d-flex gap-2 align-items-center my-3">
            <select id="cf" class="form-select" aria-label="Convert from" disabled></select>
            <button id="sw" class="btn btn-outline-primary rounded-circle" aria-label="Swap currencies">
              <i class="fa-solid fa-arrow-right-arrow-left"></i>
            </button>
            <select id="ct" class="form-select" aria-label="Convert to" disabled></select>
          </div>
          <div class="fs-3 fw-bold text-primary" id="cr">...</div>
          <small class="text-muted d-block mb-2" id="cs">Loading exchange rates...</small>
          <button id="cb" class="btn btn-sm btn-outline-primary rounded-pill">Use my total budget</button>
        </div>
      </div>
    </div>`);

  /* ---------- Part 1: budget planner. Recalculates and saves on every change ---------- */
  const calc = () => {
    B.total = +$('#bt').value || 0;
    B.al = [...document.querySelectorAll('.al')].map(i => +i.value || 0);
    const allocated = B.al.reduce((sum, x) => sum + x, 0);
    const remaining = B.total - allocated;

    $('#ba').textContent = rm(allocated);
    $('#br').textContent = remaining < 0 ? 'Over by ' + rm(-remaining) : rm(remaining);
    $('#br').className = 'fs-5 fw-bold ' + (remaining < 0 ? 'text-danger' : 'text-success');

    $('#bw').innerHTML = '<canvas></canvas>';
    pie($('#bw canvas'), CATS, B.al);
    save('budget', B);
  };

  /* ---------- Part 2: currency converter ---------- */
  async function getRates() {
    const cached = JSON.parse(localStorage.getItem('cx_rates') || 'null');
    if (cached && Date.now() - cached.t < 432e5) return cached;
    try {
      const json = await (await fetch('https://open.er-api.com/v6/latest/MYR')).json();
      if (json.result !== 'success') throw 0;
      const fresh = {t: Date.now(), rates: json.rates, date: json.time_last_update_utc.slice(0, 16)};
      localStorage.setItem('cx_rates', JSON.stringify(fresh));
      return fresh;
    } catch {
      return cached;
    }
  }

  const convert = () => {
    if (!R) return;
    const amount = +$('#ca').value || 0;
    const from = $('#cf').value;
    const to = $('#ct').value;
    const rate = R.rates[to] / R.rates[from];
    $('#cr').textContent = `${(amount * rate).toLocaleString('en-MY', {maximumFractionDigits: 2})} ${to}`;
    $('#cs').textContent =
      `1 ${from} = ${rate.toLocaleString('en-MY', {maximumFractionDigits: 6})} ${to}. ` +
      `Rates updated ${R.date}. Source: open.er-api.com`;
  };

  getRates().then(rates => {
    if (!rates) {
      $('#cr').textContent = 'Unavailable';
      $('#cs').textContent =
        'Exchange rates could not be loaded. Check your internet connection and refresh.';
      return;
    }
    R = rates;
    let names = null;
    try {
      names = new Intl.DisplayNames(['en'], {type: 'currency'});
    } catch {}
    const nameOf = code => {
      try {
        return names.of(code);
      } catch {
        return code;
      }
    };
    const usable = code => nameOf(code) !== code && !/\(\d{4}/.test(nameOf(code));
    const options = Object.keys(R.rates)
      .filter(code => code === 'MYR' || usable(code))
      .sort()
      .map(c => `<option value="${c}">${c} - ${nameOf(c)}</option>`)
      .join('');
    $('#cf').innerHTML = $('#ct').innerHTML = options;
    $('#cf').value = 'MYR';
    $('#ct').value = 'USD';
    $('#cf').disabled = $('#ct').disabled = false;
    convert();
  });

  /* ---------- Events ---------- */
  document.querySelectorAll('#bt, .al').forEach(i => (i.oninput = calc));
  ['ca', 'cf', 'ct'].forEach(id => ($('#' + id).oninput = convert));
  $('#sw').onclick = () => {
    const from = $('#cf').value;
    $('#cf').value = $('#ct').value;
    $('#ct').value = from;
    convert();
  };
  $('#cb').onclick = () => {
    if (!R) return;
    $('#ca').value = B.total;
    $('#cf').value = 'MYR';
    convert();
  };

  calc();
})();
