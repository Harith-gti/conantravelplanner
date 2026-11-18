/* itinerary.js: day-by-day activities, sorted by date and time. */
crud({
  title: 'Itinerary',
  desc: 'Plan what you will do each day of a trip. Activities are sorted by date and time.',
  key: 'acts',
  add: 'Add activity',
  icon: 'fa-route',
  empty: 'No activities planned',
  top: () =>
    photo('photo-itinerary', 'fa-route', 'Your trip, day by day', 'Plan every stop so nothing is missed.'),
  opts: D.trips.map(t => t.name),
  match: x => tripName(x.tid),
  text: x => x.title + x.place,
  sort: (a, b) => (a.date + a.time).localeCompare(b.date + b.time),
  heads: ['Date', 'Time', 'Activity', 'Location', 'Trip'],
  keys: [x => x.date, x => x.time, x => x.title, x => x.place, x => tripName(x.tid)],
  row: x => `
    <td>${x.date}</td>
    <td>${x.time}</td>
    <td class="fw-semibold">${esc(x.title)}</td>
    <td>${esc(x.place)}</td>
    <td>${esc(tripName(x.tid))}</td>`,
  fields: () => [
    {k: 'tid', l: 'Trip', o: tripOptions()},
    {k: 'date', l: 'Date', t: 'date'},
    {k: 'time', l: 'Time', t: 'time'},
    {k: 'title', l: 'Activity'},
    {k: 'place', l: 'Location'},
  ],
  check: d => (d.tid ? '' : 'Add a trip in My Trips first.'),
  build: (d, id) => ({...d, id, tid: +d.tid}),
});
