/*
  home-categories.js
  - Loads listings from listing.json (or listings.json as fallback)
  - Calculates counts for Sale and Rent/Lease
  - Renders up to 6 Rent/Lease preview cards in #rent-grid
  - Updates multiple counters if present on the page
  - Works on GitHub Pages / local http.server (no backend)
*/

(function () {
  const DATA_URL_CANDIDATES = [
    './listing.json',
    './listings.json'
  ];

  // ---------- DOM helpers ----------
  function setTextByIds(ids, value) {
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = String(value);
    });
  }

  function setAttrById(id, attr, value) {
    const el = document.getElementById(id);
    if (el) el.setAttribute(attr, value);
  }

  function safeStr(v) {
    return (v == null) ? '' : String(v);
  }

  function normalizeType(listing) {
    // Prefer explicit field if present
    const lt = safeStr(listing.listingType).trim().toLowerCase();
    if (lt) {
      if (lt === 'sale' || lt === 'for sale') return 'sale';
      if (lt === 'rent' || lt === 'lease' || lt === 'for lease') return 'rent';
    }

    // Fall back to status-like fields
    const status = (
      safeStr(listing.statusText) + ' ' +
      safeStr(listing.status) + ' ' +
      safeStr(listing.transactionType)
    ).toLowerCase();

    if (status.includes('for sale') || status.includes('sale')) return 'sale';
    if (status.includes('for lease') || status.includes('lease') || status.includes('rent')) return 'rent';

    // Try to infer from price text (some feeds put it there)
    const price = safeStr(listing.price).toLowerCase();
    if (price.includes('lease') || price.includes('rent')) return 'rent';
    if (price.includes('sale')) return 'sale';

    return 'unknown';
  }

  function getCoverImage(listing) {
    // Attempt a few common fields
    const direct = listing.image || listing.coverImage || listing.thumbnail;
    if (direct) return direct;

    const images = listing.images || listing.gallery || listing.photos;
    if (Array.isArray(images) && images.length) {
      const first = images[0];
      if (typeof first === 'string') return first;
      if (first && typeof first === 'object') return first.url || first.src || first.image || '';
    }

    return 'assets/images/placeholder.jpg';
  }

  function getTitle(listing) {
    return listing.title || listing.address || listing.fullAddress || listing.name || 'Property';
  }

  function getSubline(listing) {
    // Prefer clean price + beds/baths
    const price = safeStr(listing.price);
    const beds = listing.beds != null ? `${listing.beds} bd` : '';
    const baths = listing.baths != null ? `${listing.baths} ba` : '';
    const sep = (beds || baths) ? ' | ' : '';
    const suffix = (beds || baths) ? `${beds}${beds && baths ? ' | ' : ''}${baths}` : '';
    return (price ? price : '') + (price && suffix ? sep : '') + suffix;
  }

  function makeCard(listing) {
    const a = document.createElement('a');
    a.href = listing.url || listing.link || 'properties.html';
    a.className = 'block bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition';

    const img = document.createElement('img');
    img.src = getCoverImage(listing);
    img.alt = getTitle(listing);
    img.className = 'w-full h-28 object-cover';

    const body = document.createElement('div');
    body.className = 'p-3';

    const t = document.createElement('div');
    t.className = 'text-sm font-semibold text-gray-900 truncate';
    t.textContent = getTitle(listing);

    const s = document.createElement('div');
    s.className = 'text-xs text-gray-600 truncate';
    const type = normalizeType(listing);
    const label = type === 'rent' ? 'For Lease' : (type === 'sale' ? 'For Sale' : 'Listing');
    const sub = getSubline(listing);
    s.textContent = sub ? `${label} ${sub}` : label;

    body.appendChild(t);
    body.appendChild(s);

    a.appendChild(img);
    a.appendChild(body);
    return a;
  }

  async function fetchFirstWorkingJson() {
    let lastErr = null;
    for (const url of DATA_URL_CANDIDATES) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
        const data = await res.json();
        // Accept either an array, or { listings: [...] }
        if (Array.isArray(data)) return { url, listings: data };
        if (data && Array.isArray(data.listings)) return { url, listings: data.listings };
        throw new Error(`Unexpected JSON shape in ${url}`);
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr || new Error('No data URLs worked');
  }

  function showError(err) {
    console.error('Listings load error:', err);
    setTextByIds(['sale-count', 'sale-count-2', 'count-total-sale'], 0);
    setTextByIds(['rent-count', 'rent-count-2', 'count-total-rent'], 0);

    const grid = document.getElementById('rent-grid');
    if (grid) {
      grid.innerHTML = '<div class="col-span-full text-sm text-gray-600">Unable to load listings. Check the JSON file path and open DevTools → Console.</div>';
    }
  }

  async function init() {
    const { listings } = await fetchFirstWorkingJson();

    const saleListings = [];
    const rentListings = [];

    for (const l of listings) {
      const t = normalizeType(l);
      if (t === 'sale') saleListings.push(l);
      else if (t === 'rent') rentListings.push(l);
    }

    const saleCount = saleListings.length;
    const rentCount = rentListings.length;

    // Update counters anywhere they exist
    setTextByIds(['sale-count', 'sale-count-2', 'count-total-sale'], saleCount);
    setTextByIds(['rent-count', 'rent-count-2', 'count-total-rent'], rentCount);

    // Sale preview image (if the page has one)
    if (saleCount > 0) {
      const img = getCoverImage(saleListings[0]);
      setAttrById('salePreviewImg', 'src', img);
    }

    // Rent/lease preview grid
    const rentGrid = document.getElementById('rent-grid');
    if (rentGrid) {
      rentGrid.innerHTML = '';
      const preview = rentListings.slice(0, 6);
      if (!preview.length) {
        rentGrid.innerHTML = '<div class="col-span-full text-sm text-gray-600">No lease listings found.</div>';
      } else {
        preview.forEach((l) => rentGrid.appendChild(makeCard(l)));
      }
    }

    // Make sure View All buttons work even if they are <button>
    const saleViewAll = document.getElementById('saleViewAll');
    if (saleViewAll && saleViewAll.tagName === 'BUTTON') {
      saleViewAll.addEventListener('click', () => window.location.href = 'properties.html?type=sale');
    }

    const rentViewAll = document.getElementById('rentViewAll');
    if (rentViewAll && rentViewAll.tagName === 'BUTTON') {
      rentViewAll.addEventListener('click', () => window.location.href = 'properties.html?type=rent');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    init().catch(showError);
  });
})();
