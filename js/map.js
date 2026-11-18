/* map.js: Google Maps with a search box.
   Type a full address, landmark or place name and the map moves there. */
(() => {
  const mapUrl = q =>
    q
      ? `https://maps.google.com/maps?q=${encodeURIComponent(q)}&output=embed`
      : 'https://maps.google.com/maps?ll=20,10&z=2&t=m&output=embed';

  const startQuery = new URLSearchParams(location.search).get('q') || '';

  view(`
    ${head('World Map', 'Search a full address, landmark or place name and Google Maps will show it. Drag and zoom the map as usual.')}
    <div class="card-box p-2">
      <form id="sf" class="d-flex gap-2 mb-2">
        <input id="sq" class="form-control" placeholder="Full address or place, e.g. Jalan Ampang, Kuala Lumpur"
          aria-label="Search address or place" value="${esc(startQuery)}">
        <button class="btn btn-primary" aria-label="Search"><i class="fa-solid fa-magnifying-glass"></i></button>
      </form>
      <iframe id="gm" title="Google Maps" src="${mapUrl(startQuery)}" class="map-frame"
        loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
    </div>
    <p class="small text-muted mt-2">Map provided by Google Maps.</p>`);

  $('#sf').onsubmit = e => {
    e.preventDefault();
    const q = $('#sq').value.trim();
    if (!q) return toast('Type an address or place first.', 'warning');
    $('#gm').src = mapUrl(q);
  };
})();
