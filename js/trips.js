/* trips.js: My Trips data page (table with search, filter, add, edit, delete). Uses crud() from core.js. */
const addTrip = crud({
  title: 'My Trips',
  desc: 'All your planned, current and past trips. Status updates automatically from your travel dates.',
  key: 'trips',
  add: 'New trip',
  icon: 'fa-suitcase-rolling',
  empty: 'No trips yet',
  opts: ['Upcoming', 'Ongoing', 'Completed'],
  match: status,
  text: t => t.name + t.dest,
  sort: (a, b) => a.start.localeCompare(b.start),
  heads: ['Trip', 'Destination', 'Dates', 'Travellers', 'Budget', 'Status'],
  keys: [t => t.name, t => t.dest, t => t.start, t => t.pax, t => t.budget, status],
  row: t => `
    <td class="fw-semibold">${esc(t.name)}</td>
    <td>${esc(t.dest)}</td>
    <td>${t.start} to ${t.end}</td>
    <td>${t.pax}</td>
    <td>${rm(t.budget)}</td>
    <td><span class="badge rounded-pill text-bg-${BADGE[status(t)]}">${status(t)}</span></td>`,
  fields: () => [
    {k: 'name', l: 'Trip name'},
    {k: 'dest', l: 'Destination'},
    {k: 'start', l: 'Departure date', t: 'date'},
    {k: 'end', l: 'Return date', t: 'date'},
    {k: 'pax', l: 'Travellers', t: 'number'},
    {k: 'budget', l: 'Budget (RM)', t: 'number'},
  ],
  check: d => (d.end < d.start ? 'Return date must be on or after the departure date.' : ''),
  build: (d, id) => ({...d, id, pax: +d.pax, budget: +d.budget}),

  deleteMsg: t =>
    `Delete "${t.name}"? Its expenses, itinerary activities and packing items will be deleted too.`,
  onDelete: t =>
    ['expenses', 'acts', 'pack'].forEach(key => {
      D[key] = D[key].filter(r => r.tid != t.id);
      save(key, D[key]);
    }),
});

const qs = new URLSearchParams(location.search);
if (qs.has('dest') || qs.has('new')) addTrip({dest: qs.get('dest') || ''});
