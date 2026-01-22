// home-categories.js
// Populates the "Properties" category cards (For Sale / For Rent) on the home page.
// Works on GitHub Pages + local dev server.

(() => {
  const LISTINGS_JSON_URL = new URL('listing.json', window.location.href).toString();

  // Heading counts
  const elTotalSale = document.getElementById('count-total-sale');
  const elTotalRent = document.getElementById('count-total-rent');

  // Counts (hero + cards)
  const elSaleCountHero = document.getElementById('sale-count');
  const elRentCountHero = document.getElementById('rent-count');
  const elSaleCountCard = document.getElementById('sale-count-2');
  const elRentCountCard = document.getElementById('rent-count-2');

  // Optional preview images (if present in HTML)
  const elSaleImg = document.getElementById('salePreviewImg');
  const elRentImg = document.getElementById('rentPreviewImg');

  // Links (if present)
  const saleLink = document.getElementById('saleViewAll');
  const rentLink = document.getElementById('rentViewAll');

  const normalize = (v) => (v === null || v === undefined ? '' : String(v));

  const inferType = (listing) => {
    // If you later add an explicit flag in JSON, this will use it.
    const explicit = normalize(listing.transactionType || listing.listingType || listing.type).toLowerCase();
    if (explicit) {
      if (explicit.includes('rent') || explicit.includes('lease')) return 'rent';
      if (explicit.includes('sale')) return 'sale';
    }

    // Otherwise infer from price/status text.
    const price = normalize(listing.price).toLowerCase();
    const status = normalize(listing.status).toLowerCase();
    const homeStyle = normalize(listing.homeStyle).toLowerCase();

    const leaseRegex = /for\s*lease|lease(d)?|rent(ed)?/i;
    const saleRegex = /for\s*sale|sold|sale|listed/i;

    if (leaseRegex.test(price) || leaseRegex.test(status) || leaseRegex.test(homeStyle)) return 'rent';
    if (saleRegex.test(price) || saleRegex.test(status) || saleRegex.test(homeStyle)) return 'sale';

    // Fallback: if unclear, treat as sale.
    return 'sale';
  };

  const setText = (el, text) => {
    if (!el) return;
    el.textContent = text;
  };

  const setPreview = (imgEl, listing) => {
    if (!imgEl) return;

    // Prefer listing.image, otherwise first in listing.images
    const img = listing?.image || (Array.isArray(listing?.images) ? listing.images[0] : '');
    if (!img) return;

    imgEl.src = img;
    imgEl.alt = listing?.title ? `${listing.title} photo` : 'Listing photo';
  };

  const showError = (msg) => {
    console.error('[home-categories]', msg);
    setText(elTotalSale, '0');
    setText(elTotalRent, '0');
    setText(elSaleCountHero, '0');
    setText(elRentCountHero, '0');
    setText(elSaleCountCard, '0');
    setText(elRentCountCard, '0');
  };

  // Optional: deep link to the grid page filtered by tab
  if (saleLink) saleLink.href = 'properties.html?type=sale';
  if (rentLink) rentLink.href = 'properties.html?type=rent';

  fetch(LISTINGS_JSON_URL, { cache: 'no-store' })
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load listing.json (${res.status})`);
      return res.json();
    })
    .then((json) => {
      const listings = Array.isArray(json) ? json : Array.isArray(json?.listings) ? json.listings : [];
      if (!Array.isArray(listings)) throw new Error('listing.json is not an array');

      const sale = [];
      const rent = [];

      for (const l of listings) {
        (inferType(l) === 'rent' ? rent : sale).push(l);
      }

      const saleCount = sale.length;
      const rentCount = rent.length;

      setText(elTotalSale, String(saleCount));
      setText(elTotalRent, String(rentCount));

      // Hero counters (numbers only)
      setText(elSaleCountHero, String(saleCount));
      setText(elRentCountHero, String(rentCount));

      // Card counters (numbers only; "listings" is already in the HTML)
      setText(elSaleCountCard, String(saleCount));
      setText(elRentCountCard, String(rentCount));

      if (saleCount) setPreview(elSaleImg, sale[0]);
      if (rentCount) setPreview(elRentImg, rent[0]);
    })
    .catch((err) => showError(err));
})();
