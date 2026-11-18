/* expenses.js: Travel Expenses data page with a budget summary on top. */

const expensesTop = () => {
  const spent = D.expenses.reduce((sum, x) => sum + x.amt, 0);
  const budget = D.trips.reduce((sum, t) => sum + t.budget, 0);
  const cards = [
    ['Total spent', rm(spent)],
    ['Total trip budget', rm(budget)],
    ['Remaining', rm(budget - spent)],
    ['Budget used', (budget ? Math.round((spent / budget) * 100) : 0) + '%'],
  ];
  return (
    photo(
      'photo-expenses',
      'fa-wallet',
      'Keep every ringgit on track',
      'Log what you spend and watch your budget.',
    ) +
    `<div class="row g-3 mb-4">${cards
      .map(
        ([label, value]) => `
        <div class="col-6 col-lg-3">
          <div class="card-box"><small class="text-muted">${label}</small><div class="fs-5 fw-bold text-primary">${value}</div></div>
        </div>`,
      )
      .join('')}</div>`
  );
};

crud({
  title: 'Travel Expenses',
  desc: 'Record what you spend on each trip. The dashboard charts use these records.',
  key: 'expenses',
  add: 'Add expense',
  icon: 'fa-wallet',
  empty: 'No expenses recorded',
  top: expensesTop,
  opts: CATS,
  match: x => x.cat,
  text: x => x.desc + tripName(x.tid),
  sort: (a, b) => b.date.localeCompare(a.date),
  heads: ['Description', 'Category', 'Date', 'Trip', 'Amount'],
  keys: [x => x.desc, x => x.cat, x => x.date, x => tripName(x.tid), x => x.amt],
  row: x => `
    <td class="fw-semibold">${esc(x.desc)}</td>
    <td>${x.cat}</td>
    <td>${x.date}</td>
    <td>${esc(tripName(x.tid))}</td>
    <td>${rm(x.amt)}</td>`,
  fields: () => [
    {k: 'tid', l: 'Trip', o: tripOptions()},
    {k: 'desc', l: 'Description'},
    {k: 'cat', l: 'Category', o: CATS},
    {k: 'date', l: 'Date', t: 'date'},
    {k: 'amt', l: 'Amount (RM)', t: 'number'},
  ],
  check: d =>
    !d.tid ? 'Add a trip in My Trips first.' : +d.amt <= 0 ? 'Amount must be more than RM 0.' : '',
  build: (d, id) => ({...d, id, tid: +d.tid, amt: +d.amt}),
});
