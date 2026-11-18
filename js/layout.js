/* layout.js: loaded on EVERY page.
   Inserts the navigation bar, the feature strip and the footer, and handles dark mode and logout. */
(() => {
  const html = document.documentElement;
  const ses = JSON.parse(
    localStorage.getItem('cx_session') || sessionStorage.getItem('cx_session') || 'null',
  );
  const isAuth = document.body.classList.contains('auth-body');
  const file = location.pathname.split('/').pop() || 'index.html';

  /* ---------- Menu items: [file, label, Font Awesome icon] ---------- */
  const PAGES = [
    ['index.html', 'Dashboard', 'fa-gauge'],
    ['trips.html', 'My Trips', 'fa-suitcase-rolling'],
    ['expenses.html', 'Expenses', 'fa-wallet'],
    ['itinerary.html', 'Itinerary', 'fa-route'],
    ['destinations.html', 'Destinations', 'fa-compass'],
    ['map.html', 'World Map', 'fa-earth-asia'],
    ['budget.html', 'Budget & Currency', 'fa-coins'],
    ['packing.html', 'Packing', 'fa-bag-shopping'],
  ];

  /* ---------- Navigation bar: same links on every page (top bar on mobile, sidebar on desktop) ---------- */
  const navLinks = PAGES.map(
    ([href, label, icon]) => `
      <li class="nav-item">
        <a class="nav-link ${href === file ? 'active' : ''}" href="${href}">
          <i class="fa-solid ${icon} me-2"></i>${label}
        </a>
      </li>`,
  ).join('');

  if (ses && !isAuth) {
    document.body.classList.add('has-nav');
    document.body.insertAdjacentHTML(
      'afterbegin',
      `<nav class="navbar navbar-expand-lg sticky-top app-nav" aria-label="Main menu">
        <div class="container-fluid px-lg-4">
          <a class="navbar-brand fw-bold" href="index.html">
            <i class="fa-solid fa-earth-asia me-2"></i>Conan Travel Planner
          </a>
          <button class="navbar-toggler" data-bs-toggle="collapse" data-bs-target="#menu" aria-label="Toggle menu">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="menu">
            <ul class="navbar-nav">${navLinks}</ul>
            <div class="nav-foot">
              <div class="small text-white-50 mb-2"><i class="fa-solid fa-circle-user me-1"></i>${ses.user}</div>
              <div class="d-flex gap-2">
                <button id="themeBtn" class="btn btn-outline-light btn-sm rounded-pill" aria-label="Toggle dark mode"></button>
                <button id="logout" class="btn btn-outline-light btn-sm rounded-pill flex-grow-1">
                  <i class="fa-solid fa-right-from-bracket me-1"></i>Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>`,
    );
  } else {
    document.body.insertAdjacentHTML(
      'beforeend',
      '<button id="themeBtn" class="btn btn-light btn-sm rounded-circle theme-fab shadow" aria-label="Toggle dark mode"></button>',
    );
  }

  /* ---------- Feature summary strip (identical on every page) ---------- */
  const FEATURES = [
    ['fa-route', 'Plan trips and itineraries'],
    ['fa-wallet', 'Track expenses and budgets'],
    ['fa-gem', 'Discover hidden gems'],
    ['fa-bag-shopping', 'Pack smarter'],
  ];
  const featureCols = FEATURES.map(
    ([icon, text]) => `
      <div class="col-6 col-lg-3">
        <div class="feat"><i class="fa-solid ${icon}"></i><span>${text}</span></div>
      </div>`,
  ).join('');
  document.body.insertAdjacentHTML(
    'beforeend',
    `<section class="feature-strip" aria-label="What you can do">
      <div class="container-xl"><div class="row g-3">${featureCols}</div></div>
    </section>`,
  );

  /* ---------- Footer (identical on every page) ---------- */
  document.body.insertAdjacentHTML(
    'beforeend',
    `<footer class="site-footer">
      <p class="mb-1"><strong>DISCLAIMER:</strong> This website is NOT the official website of Conan Travel Planner.
        This website was developed strictly for learning purposes (IMS 566).</p>
      <p class="mb-0">© 2026 Muhammad Harith Iqbal | Recommended browser : Google Chrome |
        Recommended Resolution : 1366×768 | Last Update : 15 November 2026</p>
    </footer>`,
  );

  /* ---------- Dark mode: saved in localStorage and applied before paint by a small script in each page head ---------- */
  const paintThemeButtons = () =>
    document.querySelectorAll('#themeBtn').forEach(b => {
      b.innerHTML =
        html.dataset.bsTheme === 'dark'
          ? '<i class="fa-solid fa-sun"></i>'
          : '<i class="fa-solid fa-moon"></i>';
    });
  paintThemeButtons();

  document.addEventListener('click', e => {
    if (e.target.closest('#themeBtn')) {
      html.dataset.bsTheme = html.dataset.bsTheme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('cx_theme', html.dataset.bsTheme);
      paintThemeButtons();
      if (window.Chart) location.reload();
    }
    if (e.target.closest('#logout')) {
      localStorage.removeItem('cx_session');
      sessionStorage.removeItem('cx_session');
      location.href = 'login.html';
    }
  });
})();
