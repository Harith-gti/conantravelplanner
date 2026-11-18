/* destinations.js: two tabs.
   "My Dream List": a board of places you want to visit (Dreaming, Planning, Visited).
   "Get Ideas": 60+ places with photos and official tourism websites (data comes from data.js). */
(() => {
  /* =====================================================================
     Settings and helpers
     ===================================================================== */
  const ST = Object.keys(DSTAT);
  const PRI = ['High', 'Medium', 'Low'];
  const PB = {High: 'danger', Medium: 'warning', Low: 'secondary'};
  const SI = {Dreaming: 'fa-heart', Planning: 'fa-clipboard-list', Visited: 'fa-circle-check'};
  const THIS_MONTH = new Date().getMonth() + 1;

  const inSeason = d =>
    d.bm[0] <= d.bm[1]
      ? THIS_MONTH >= d.bm[0] && THIS_MONTH <= d.bm[1]
      : THIS_MONTH >= d.bm[0] || THIS_MONTH <= d.bm[1];
  const bestMonths = d =>
    d.bm[0] === 1 && d.bm[1] === 12 ? 'All year' : MON[d.bm[0] - 1] + ' to ' + MON[d.bm[1] - 1];
  const mapLink = (name, country) =>
    'map.html?q=' + encodeURIComponent([name, country].filter(Boolean).join(', '));

  let searchText = '';
  let priFilter = 'All';
  const f = {
    iq: '',
    ish: 'All places',
    ir: 'Anywhere',
    ity: 'All types',
    ib: '',
    idy: 5,
    iso: 'Shuffled order',
    ise: false,
  };

  view(`
    ${head('Destinations', 'Keep the places you really want to visit in your dream list. Not sure where to go? Open Get Ideas for inspiration.')}
    <ul class="nav nav-pills mb-3" id="tabs">
      <li class="nav-item"><button class="nav-link active" data-t="list"><i class="fa-solid fa-heart me-1"></i>My Dream List</button></li>
      <li class="nav-item"><button class="nav-link" data-t="ideas"><i class="fa-regular fa-lightbulb me-1"></i>Get Ideas</button></li>
    </ul>
    <div id="pane"></div>`);

  /* =====================================================================
     TAB 1: My Dream List
     ===================================================================== */
  const dreamFields = () => [
    {k: 'name', l: 'Place name'},
    {k: 'place', l: 'Country / region', r: false},
    {k: 'pri', l: 'Priority', o: PRI},
    {k: 'status', l: 'Status', o: ST},
    {k: 'cost', l: 'Estimated budget (RM)', t: 'number'},
    {k: 'note', l: 'Why do you want to go?', r: false},
  ];

  const putDream = (id, data) => {
    const record = {
      ...data,
      id: id || uid(),
      cost: +data.cost || 0,
      note: data.note || '',
      place: data.place || '',
    };
    D.dreams = id ? D.dreams.map(x => (x.id === id ? record : x)) : [...D.dreams, record];
    saveDreams();
    toast('Saved');
  };

  const dreamCard = x => `
    <div class="dream" style="--c:${DSTAT[x.status]}">
      <div class="d-flex gap-2">
        <img class="dream-ph d-none" alt="" data-ph="${x.id}" onerror="this.classList.add('d-none')">
        <div class="me-auto">
          <div class="fw-semibold">${esc(x.name)}</div>
          <small class="text-muted"><i class="fa-solid fa-location-dot me-1"></i>${esc(x.place || 'No country')}</small>
        </div>
        <span class="badge text-bg-${PB[x.pri]} align-self-start">${x.pri}</span>
      </div>
      ${x.note ? `<p class="small mt-2 mb-1">${esc(x.note)}</p>` : ''}
      <small class="text-muted d-block mb-2">Budget ${rm(x.cost)}</small>
      <div class="d-flex flex-wrap gap-1 align-items-center">
        <select class="form-select form-select-sm w-auto" data-s="${x.id}" aria-label="Status">
          ${ST.map(s => `<option ${s === x.status ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
        <a class="btn btn-sm btn-light" href="${mapLink(x.name, x.place)}" aria-label="Show on map"><i class="fa-solid fa-map-pin"></i></a>
        <a class="btn btn-sm btn-light" href="trips.html?dest=${encodeURIComponent(x.name)}" aria-label="Plan trip"><i class="fa-solid fa-suitcase-rolling"></i></a>
        <button class="btn btn-sm btn-light ms-auto" data-e="${x.id}" aria-label="Edit"><i class="fa-solid fa-pen"></i></button>
        <button class="btn btn-sm btn-light text-danger" data-d="${x.id}" aria-label="Delete"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>`;

  const drawBoard = () => {
    if (!D.dreams.length) {
      $('#board').innerHTML = `<div class="col-12">${empty(
        'fa-heart',
        'Your dream list is empty',
        'Add the places you really want to visit, or get ideas if you do not know where to go yet.',
        '<button class="btn btn-primary rounded-pill" id="goIdeas">Get ideas</button>',
      )}</div>`;
      return;
    }
    const shown = D.dreams.filter(
      x =>
        (priFilter === 'All' || x.pri === priFilter) &&
        (x.name + x.place + x.note).toLowerCase().includes(searchText.toLowerCase()),
    );
    $('#board').innerHTML = ST.map(s => {
      const inColumn = shown.filter(x => x.status === s);
      return `
        <div class="col-lg-4">
          <div class="card-box h-100">
            <h2 class="h6 fw-bold d-flex justify-content-between">
              <span><i class="fa-solid ${SI[s]} me-2" style="color:${DSTAT[s]}"></i>${s}</span>
              <span class="badge text-bg-light">${inColumn.length}</span>
            </h2>
            ${inColumn.map(dreamCard).join('') || '<p class="small text-muted mb-0">Nothing here.</p>'}
          </div>
        </div>`;
    }).join('');

    document.querySelectorAll('[data-ph]').forEach(img => {
      const x = D.dreams.find(i => i.id == img.dataset.ph);
      photoFor({n: x.name, co: x.place}).then(p => {
        img.src = p.src;
        img.classList.remove('d-none');
      });
    });
  };

  const miniStat = (icon, value, label) => `
    <div class="col-6">
      <div class="card-box stat">
        <i class="fa-solid ${icon}"></i>
        <div><div class="fs-5 fw-bold lh-1">${value}</div><small class="text-muted">${label}</small></div>
      </div>
    </div>`;

  function renderList() {
    const ds = D.dreams;
    const visited = ds.filter(x => x.status === 'Visited').length;
    const stillNeeded = ds.filter(x => x.status !== 'Visited').reduce((sum, x) => sum + x.cost, 0);
    const highPriority = ds.filter(x => x.pri === 'High' && x.status !== 'Visited').length;

    $('#pane').innerHTML = `
      <div class="row g-3 mb-3">
        <div class="col-lg-8">
          <div class="row g-3">
            ${miniStat('fa-heart', ds.length, 'Dream places')}
            ${miniStat('fa-fire', highPriority, 'High priority')}
            ${miniStat('fa-wallet', rm(stillNeeded), 'Budget still needed')}
            ${miniStat('fa-circle-check', `${visited} of ${ds.length}`, 'Dreams come true')}
          </div>
        </div>
        <div class="col-lg-4">
          <div class="card-box h-100">
            <h2 class="h6 fw-bold">Dreams by status</h2>
            <canvas id="dc" class="dream-chart"></canvas>
          </div>
        </div>
      </div>
      <div class="d-flex flex-wrap gap-2 mb-3">
        <input id="q" class="form-control w-auto" placeholder="Search your list" aria-label="Search">
        <select id="pf" class="form-select w-auto" aria-label="Priority">
          ${['All', ...PRI].map(p => `<option>${p}</option>`).join('')}
        </select>
        <button id="add" class="btn btn-primary rounded-pill ms-auto">
          <i class="fa-solid fa-plus me-1"></i>Add dream place
        </button>
      </div>
      <div class="row g-3" id="board"></div>`;

    $('#q').value = searchText;
    $('#pf').value = priFilter;

    if (ds.length) {
      new Chart($('#dc'), {
        type: 'doughnut',
        data: {
          labels: ST,
          datasets: [
            {
              data: ST.map(s => ds.filter(x => x.status === s).length),
              backgroundColor: ST.map(s => DSTAT[s]),
              borderColor: DARK() ? '#172236' : '#fff',
              borderWidth: 3,
            },
          ],
        },
        options: {cutout: '60%', plugins: {legend: {position: 'right', labels: {usePointStyle: true}}}},
      });
    } else {
      noData($('#dc'));
    }
    drawBoard();
  }

  /* =====================================================================
     TAB 2: Get Ideas
     ===================================================================== */
  const shuffle = list => {
    const a = [...list];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  let order = shuffle(DEST.map(d => d.id));
  let limit = 9;
  const tripDays = () => Math.max(1, +f.idy || 5);

  const matches = d => {
    const cost = estCost(d, tripDays());
    const budget = +f.ib;
    return (
      (f.ish === 'All places' || (f.ish === 'Hidden gems') === !!d.gem) &&
      (f.ir === 'Anywhere' || (f.ir === 'Malaysia') === (d.co === 'Malaysia')) &&
      (f.ity === 'All types' || d.t === f.ity) &&
      (!budget || cost === null || cost <= budget) &&
      (!f.ise || inSeason(d)) &&
      (d.n + d.st + d.co + d.d).toLowerCase().includes(f.iq.toLowerCase())
    );
  };

  const eligible = () => {
    const list = order
      .map(id => DEST.find(d => d.id === id))
      .filter(d => !D.dreams.some(x => x.name === d.n) && matches(d));
    if (f.iso === 'Cheapest first')
      list.sort((a, b) => (estCost(a, tripDays()) ?? 1e9) - (estCost(b, tripDays()) ?? 1e9));
    return list;
  };

  const ideaCard = d => {
    const cost = estCost(d, tripDays());
    const [color, icon] = TYPE[d.t];
    const [officialName, officialUrl] = officialFor(d.co);
    const withinBudget = +f.ib && cost !== null ? '<span class="badge bg-success">Within budget</span>' : '';
    const costText =
      cost === null
        ? 'Cost not rated for this country'
        : `About ${rm(cost)} per person for ${tripDays()} days`;
    const allYear = d.bm[0] === 1 && d.bm[1] === 12;

    return `
      <div class="col-sm-6 col-xl-4" id="d${d.id}">
        <div class="card-box p-0 overflow-hidden h-100 d-flex flex-column">
          <div class="dest-img" style="background:linear-gradient(135deg,${color},#0B2E5C)">
            <i class="fa-solid ${icon}"></i>
            <img class="photo d-none" alt="${esc(d.n)}, ${esc(d.co)}" loading="lazy" onerror="this.classList.add('d-none')">
            ${d.gem ? '<span class="badge bg-warning text-dark gem-tag"><i class="fa-solid fa-gem me-1"></i>Hidden gem</span>' : ''}
            <span class="credit d-none"></span>
          </div>
          <div class="p-3 d-flex flex-column flex-grow-1">
            <div class="mb-1"><span class="badge text-bg-light">${d.t}</span> <span class="badge text-bg-light">${COST[d.c - 1]}</span></div>
            <h2 class="h6 fw-bold mb-1">${esc(d.n)}</h2>
            <small class="text-muted"><i class="fa-solid fa-location-dot me-1"></i>${esc(d.st)}, ${esc(d.co)}</small>
            <p class="small mt-2 mb-2">${esc(d.d)}</p>
            <small class="mb-1 text-primary fw-semibold"><i class="fa-solid fa-coins me-1"></i>${costText} ${withinBudget}</small>
            ${allYear ? '' : `<small class="mb-2"><i class="fa-regular fa-calendar me-1"></i>Best: ${bestMonths(d)} ${inSeason(d) ? '<span class="badge bg-success">Good now</span>' : ''}</small>`}
            ${d.tip ? `<div class="tip mb-2"><i class="fa-regular fa-lightbulb me-1"></i>${d.tip}</div>` : ''}
            <small class="text-muted mb-2"><i class="fa-solid fa-circle-check text-success me-1"></i>Official source: ${esc(officialName)}</small>
            <div class="mt-auto d-flex flex-wrap gap-2 pt-1">
              <button class="btn btn-sm btn-primary rounded-pill" data-add="${d.id}"><i class="fa-solid fa-heart me-1"></i>Add to my list</button>
              <a href="${officialUrl}" target="_blank" rel="noopener" class="btn btn-sm btn-outline-primary rounded-pill"><i class="fa-solid fa-globe me-1"></i>Official site</a>
              <a href="${mapLink(d.n, d.co)}" class="btn btn-sm btn-light rounded-pill"><i class="fa-solid fa-map-pin me-1"></i>Map</a>
            </div>
          </div>
        </div>
      </div>`;
  };

  const loadPhotos = list =>
    list.slice(0, limit).forEach(d =>
      photoFor(d).then(p => {
        const card = $('#d' + d.id);
        if (!card) return;
        const img = card.querySelector('.photo');
        img.src = p.src;
        img.classList.remove('d-none');
        if (p.by) {
          const credit = card.querySelector('.credit');
          credit.innerHTML =
            `Photo by <a href="${esc(p.link)}" target="_blank" rel="noopener">${esc(p.by)}</a> on ` +
            '<a href="https://unsplash.com/?utm_source=conan_travel_planner&utm_medium=referral" target="_blank" rel="noopener">Unsplash</a>';
          credit.classList.remove('d-none');
        }
      }),
    );

  const drawIdeas = () => {
    const list = eligible();
    $('#ig').innerHTML =
      list.slice(0, limit).map(ideaCard).join('') ||
      `<div class="col-12">${empty('fa-earth-asia', 'No places match', 'Change the filters. Places already in your dream list are hidden here.')}</div>`;
    $('#icnt').textContent =
      `${list.length} place${list.length === 1 ? '' : 's'} match. Places already in your dream list are hidden.`;
    $('#more').classList.toggle('d-none', list.length <= limit);
    loadPhotos(list);
  };

  function renderIdeas() {
    const options = list => list.map(o => `<option>${o}</option>`).join('');
    $('#pane').innerHTML = `
      <p class="small text-muted">Press Shuffle for new ideas, or enter your budget and number of days to see the places you can afford. Every card links to the official tourism website of the country.</p>
      <div class="d-flex flex-wrap gap-2 align-items-center mb-2">
        <div class="input-group w-auto"><span class="input-group-text">RM</span>
          <input id="ib" type="number" min="0" class="form-control" placeholder="Budget per person" style="width:190px" aria-label="Budget per person"></div>
        <div class="input-group w-auto">
          <input id="idy" type="number" min="1" max="60" class="form-control" style="max-width:76px" aria-label="Days"><span class="input-group-text">days</span></div>
        <select id="iso" class="form-select w-auto" aria-label="Sort"><option>Shuffled order</option><option>Cheapest first</option></select>
        <select id="ir" class="form-select w-auto" aria-label="Region">${options(['Anywhere', 'Malaysia', 'International'])}</select>
        <select id="ity" class="form-select w-auto" aria-label="Type"><option>All types</option>${options(Object.keys(TYPE))}</select>
        <select id="ish" class="form-select w-auto" aria-label="Show">${options(['All places', 'Popular', 'Hidden gems'])}</select>
      </div>
      <div class="d-flex flex-wrap gap-2 align-items-center mb-3">
        <input id="iq" class="form-control w-auto" placeholder="Search ideas" aria-label="Search">
        <div class="form-check form-switch mb-0">
          <input class="form-check-input" type="checkbox" id="ise"><label class="form-check-label small" for="ise">Good this month</label>
        </div>
        <button id="sur" class="btn btn-primary rounded-pill ms-auto"><i class="fa-solid fa-shuffle me-1"></i>Shuffle</button>
      </div>
      <p class="small text-muted" id="icnt"></p>
      <div class="row g-3" id="ig"></div>
      <div class="text-center mt-3"><button id="more" class="btn btn-light rounded-pill d-none">Show more</button></div>`;

    Object.keys(f).forEach(k => {
      const el = $('#' + k);
      if (!el) return;
      if (k === 'ise') el.checked = f[k];
      else el.value = f[k];
    });
    drawIdeas();
  }

  /* =====================================================================
     Events (one set of handlers for both tabs)
     ===================================================================== */
  const setTab = t => {
    document
      .querySelectorAll('#tabs .nav-link')
      .forEach(b => b.classList.toggle('active', b.dataset.t === t));
    t === 'list' ? renderList() : renderIdeas();
  };
  $('#tabs').onclick = e => {
    const btn = e.target.closest('button');
    if (btn) setTab(btn.dataset.t);
  };

  $('#pane').addEventListener('input', e => {
    const el = e.target;
    if (el.id === 'q') {
      searchText = el.value;
      drawBoard();
    } else if (el.id === 'pf') {
      priFilter = el.value;
      drawBoard();
    } else if (el.dataset.s) {
      const x = D.dreams.find(i => i.id == el.dataset.s);
      x.status = el.value;
      saveDreams();
      renderList();
      toast('Moved to ' + x.status);
    } else if (el.id in f) {
      f[el.id] = el.id === 'ise' ? el.checked : el.value;
      limit = 9;
      drawIdeas();
    }
  });

  $('#pane').addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;

    if (btn.id === 'add') {
      openForm(
        'Add dream place',
        dreamFields(),
        {pri: 'Medium', status: 'Dreaming'},
        d => putDream(0, d),
        renderList,
      );
    } else if (btn.id === 'goIdeas') {
      setTab('ideas');
    } else if (btn.dataset.e) {
      const x = D.dreams.find(i => i.id == btn.dataset.e);
      openForm('Edit dream place', dreamFields(), x, d => putDream(x.id, d), renderList);
    } else if (btn.dataset.d) {
      if (confirm('Remove this place from your dream list?')) {
        D.dreams = D.dreams.filter(i => i.id != btn.dataset.d);
        saveDreams();
        renderList();
        toast('Removed');
      }
    } else if (btn.dataset.add) {
      const d = DEST.find(i => i.id == btn.dataset.add);
      D.dreams.push({
        id: uid(),
        name: d.n,
        place: d.co,
        pri: 'Medium',
        status: 'Dreaming',
        cost: 0,
        note: d.d,
      });
      saveDreams();
      drawIdeas();
      toast(d.n + ' added to your dream list');
    } else if (btn.id === 'sur') {
      order = shuffle(order);
      limit = 9;
      drawIdeas();
    } else if (btn.id === 'more') {
      limit += 9;
      drawIdeas();
    }
  });

  setTab(new URLSearchParams(location.search).get('tab') === 'ideas' ? 'ideas' : 'list');
})();
