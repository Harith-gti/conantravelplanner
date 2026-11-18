/* packing.js: smart packing checklist.
   Generates a list from the trip length and travel style, then you tick items off. */
(() => {
  const PC = ['Clothing', 'Electronics', 'Documents', 'Toiletries', 'Medication', 'Other'];

  /* ---------- Smart list rules: [item, category, quantity]. Quantity 'd' = one per day of the trip (maximum 7) ---------- */
  const BASE = [
    ['Passport / IC', 'Documents', 1],
    ['Booking confirmations', 'Documents', 1],
    ['Wallet and cash', 'Documents', 1],
    ['Phone charger', 'Electronics', 1],
    ['Power bank', 'Electronics', 1],
    ['Toothbrush and toothpaste', 'Toiletries', 1],
    ['Medication / first aid', 'Medication', 1],
    ['T-shirts', 'Clothing', 'd'],
    ['Underwear', 'Clothing', 'd'],
    ['Socks', 'Clothing', 'd'],
  ];
  const STYLE = {
    Beach: [
      ['Swimwear', 'Clothing', 2],
      ['Sunscreen', 'Toiletries', 1],
      ['Sunglasses', 'Other', 1],
      ['Beach towel', 'Other', 1],
      ['Waterproof phone pouch', 'Electronics', 1],
    ],
    Hiking: [
      ['Hiking shoes', 'Clothing', 1],
      ['Rain jacket', 'Clothing', 1],
      ['Insect repellent', 'Toiletries', 1],
      ['Water bottle', 'Other', 1],
      ['Torchlight', 'Electronics', 1],
    ],
    City: [
      ['Walking shoes', 'Clothing', 1],
      ['Umbrella', 'Other', 1],
      ['Day bag', 'Other', 1],
      ['Camera', 'Electronics', 1],
      ['Travel adapter', 'Electronics', 1],
    ],
    Family: [
      ['Snacks', 'Other', 1],
      ['Wet wipes', 'Toiletries', 1],
      ["Kids' medication", 'Medication', 1],
      ['Extra clothes', 'Clothing', 'd'],
      ['Games / entertainment', 'Other', 1],
    ],
  };

  if (!D.trips.length) {
    return view(`${head('Packing Checklist', 'A smart checklist for every trip.')}
      ${empty(
        'fa-bag-shopping',
        'Add a trip first',
        'Packing lists belong to a trip, so create your first trip to begin.',
        '<a href="trips.html?new=1" class="btn btn-primary rounded-pill">Add a trip</a>',
      )}`);
  }

  let tripId = D.trips[0].id;
  let showFilter = 'All';
  const mine = () => D.pack.filter(p => p.tid === tripId);
  const trip = () => D.trips.find(t => t.id === tripId);
  const tripDays = () => Math.round((new Date(trip().end) - new Date(trip().start)) / 864e5) + 1;

  /* ---------- Page layout ---------- */
  view(`
    ${head('Packing Checklist', 'Choose a trip and a travel style, press Generate, then tick items off as you pack. Each trip has its own list.')}
    <div class="row g-3 mb-3">
      <div class="col-lg-8">
        <div class="card-box h-100">
          <div class="d-flex flex-wrap gap-2 align-items-center mb-3">
            <label class="small fw-semibold" for="pt">Trip</label>
            <select id="pt" class="form-select w-auto">
              ${D.trips.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('')}
            </select>
            <label class="small fw-semibold" for="gs">Style</label>
            <select id="gs" class="form-select w-auto">${Object.keys(STYLE)
              .map(s => `<option>${s}</option>`)
              .join('')}</select>
            <button id="gen" class="btn btn-primary rounded-pill">
              <i class="fa-solid fa-wand-magic-sparkles me-1"></i>Generate smart list
            </button>
          </div>
          <small class="text-muted" id="gi"></small>
        </div>
      </div>
      <div class="col-lg-4">
        <div class="card-box h-100 d-flex align-items-center gap-3">
          <div class="ring" id="ring"><span id="rt"></span></div>
          <div><div class="fw-bold" id="pc"></div><small class="text-muted" id="ps"></small></div>
        </div>
      </div>
    </div>

    <div class="card-box mb-3">
      <form id="pf" class="d-flex flex-wrap gap-2 mb-3">
        <input id="pn" class="form-control w-auto flex-grow-1" placeholder="Add your own item" required aria-label="Item name">
        <select id="pk" class="form-select w-auto" aria-label="Category">${PC.map(c => `<option>${c}</option>`).join('')}</select>
        <input id="pq" type="number" min="1" value="1" class="form-control qty-input" aria-label="Quantity">
        <button class="btn btn-outline-primary rounded-pill">Add</button>
      </form>
      <div class="d-flex flex-wrap gap-2 align-items-center">
        <label class="small fw-semibold" for="ps2">Show</label>
        <select id="ps2" class="form-select form-select-sm w-auto"><option>All</option><option>To pack</option><option>Packed</option></select>
        <button id="cp" class="btn btn-sm btn-light rounded-pill ms-auto"><i class="fa-regular fa-copy me-1"></i>Copy list</button>
        <button id="ur" class="btn btn-sm btn-light rounded-pill">Untick all</button>
        <button id="rp" class="btn btn-sm btn-light text-danger rounded-pill">Remove packed</button>
      </div>
    </div>
    <div class="row g-3" id="pl"></div>`);

  /* ---------- Drawing the list ---------- */
  const itemHtml = p => `
    <div class="d-flex align-items-center gap-2 py-1">
      <input type="checkbox" class="form-check-input mt-0" data-id="${p.id}" ${p.done ? 'checked' : ''} aria-label="Packed">
      <span class="me-auto ${p.done ? 'text-decoration-line-through text-muted' : ''}">
        ${esc(p.name)} <span class="badge text-bg-light">x${p.qty}</span>
      </span>
      <button class="btn btn-sm text-primary" data-e="${p.id}" aria-label="Rename"><i class="fa-solid fa-pen"></i></button>
      <button class="btn btn-sm text-danger" data-d="${p.id}" aria-label="Remove"><i class="fa-solid fa-xmark"></i></button>
    </div>`;

  function draw() {
    const all = mine();
    const packed = all.filter(p => p.done).length;
    const pct = all.length ? Math.round((packed / all.length) * 100) : 0;
    const days = tripDays();

    $('#gi').textContent =
      `${trip().dest}, ${days} day${days > 1 ? 's' : ''}, ${trip().pax} traveller${trip().pax > 1 ? 's' : ''}. ` +
      'Clothing quantities follow the trip length (up to 7 days).';
    $('#ring').style.setProperty('--p', pct);
    $('#rt').textContent = pct + '%';
    $('#pc').textContent = `${packed} of ${all.length} packed`;
    $('#ps').textContent = all.length ? `${all.length - packed} items to go` : 'No items yet';

    const shown = all.filter(p => showFilter === 'All' || (showFilter === 'Packed') === p.done);

    $('#pl').innerHTML =
      PC.filter(c => shown.some(p => p.cat === c))
        .map(c => {
          const inCat = all.filter(p => p.cat === c);
          return `
            <div class="col-md-6 col-xl-4">
              <div class="card-box h-100">
                <h2 class="h6 fw-bold d-flex justify-content-between">${c}
                  <span class="badge text-bg-light">${inCat.filter(p => p.done).length}/${inCat.length}</span>
                </h2>
                ${shown
                  .filter(p => p.cat === c)
                  .map(itemHtml)
                  .join('')}
              </div>
            </div>`;
        })
        .join('') ||
      empty(
        'fa-bag-shopping',
        all.length ? 'Nothing to show' : 'This list is empty',
        all.length ? 'Change the Show filter.' : 'Press "Generate smart list" or add your own item.',
      );
  }

  const commit = () => {
    save('pack', D.pack);
    draw();
  };

  /* ---------- Events ---------- */
  $('#pt').onchange = e => {
    tripId = +e.target.value;
    draw();
  };
  $('#ps2').onchange = e => {
    showFilter = e.target.value;
    draw();
  };

  $('#gen').onclick = () => {
    const days = Math.min(7, Math.max(1, tripDays()));
    let added = 0;
    [...BASE, ...STYLE[$('#gs').value]].forEach(([name, cat, qty]) => {
      if (mine().some(p => p.name === name)) return;
      D.pack.push({id: uid(), tid: tripId, name, cat, qty: qty === 'd' ? days : qty, done: false});
      added++;
    });
    commit();
    toast(added ? `${added} items added` : 'Your list already has these items');
  };

  $('#pf').onsubmit = e => {
    e.preventDefault();
    const name = $('#pn').value.trim();
    if (!name) return;
    D.pack.push({
      id: uid(),
      tid: tripId,
      name,
      cat: $('#pk').value,
      qty: Math.max(1, +$('#pq').value || 1),
      done: false,
    });
    $('#pn').value = '';
    commit();
  };

  $('#cp').onclick = () => {
    const lines = mine()
      .map(p => `${p.done ? '[x]' : '[ ]'} ${p.name} x${p.qty} (${p.cat})`)
      .join('\n');
    if (!lines) return toast('The list is empty.', 'warning');
    navigator.clipboard.writeText(`Packing list: ${trip().name}\n${lines}`).then(
      () => toast('List copied'),
      () => toast('Copy failed', 'danger'),
    );
  };

  $('#ur').onclick = () => {
    mine().forEach(p => (p.done = false));
    commit();
  };
  $('#rp').onclick = () => {
    if (!confirm('Remove all packed items from this trip?')) return;
    D.pack = D.pack.filter(p => !(p.tid === tripId && p.done));
    commit();
  };

  $('#pl').onclick = e => {
    const el = e.target.closest('input,button');
    if (!el) return;
    const p = D.pack.find(x => x.id == (el.dataset.id || el.dataset.e || el.dataset.d));
    if (!p) return;

    if (el.dataset.d) {
      D.pack = D.pack.filter(x => x !== p);
    } else if (el.dataset.e) {
      const name = prompt('Rename item', p.name);
      if (name && name.trim()) p.name = name.trim();
    } else {
      p.done = el.checked;
    }
    commit();
  };

  draw();
})();
