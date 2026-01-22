(() => {
  const DATA_URL = "./listing.json"; // keep listing.json in same folder as index.html
  const MAX_CARDS = 6;

  // --- helpers ---
  const $ = (id) => document.getElementById(id);

  function normStr(v) {
    return String(v || "").trim();
  }

  function normLower(v) {
    return normStr(v).toLowerCase();
  }

  function inferSaleOrLease(item) {
    // 1) Explicit flag (recommended)
    const sol = normLower(item.saleOrLease);
    if (sol.includes("sale")) return "sale";
    if (sol.includes("lease") || sol.includes("rent")) return "lease";

    // 2) Other common fields
    const t = normLower(item.transactionType || item.listingType || item.type);
    if (t.includes("sale")) return "sale";
    if (t.includes("lease") || t.includes("rent")) return "lease";

    // 3) Status fallback
    const s = normLower(item.status);
    if (s.includes("leased") || s.includes("rent")) return "lease";
    if (s.includes("sold")) return "sale";

    // 4) Price string fallback (your JSON often stores "For Lease $X...")
    const p = normLower(item.price);
    if (p.includes("for lease") || p.includes("lease") || p.includes("rent")) return "lease";
    if (p.includes("for sale") || p.includes("sale")) return "sale";

    // Default (safe): lease
    return "lease";
  }

  function getTitle(item) {
    return (
      normStr(item.title) ||
      [item.address, item.city].filter(Boolean).join(", ") ||
      "Property"
    );
  }

  function getSubtitle(item) {
    // Your JSON often has price like: "For Lease $1,800 | 1 Year"
    const price = normStr(item.price);
    const beds = normStr(item.beds);
    const baths = normStr(item.baths);

    const bb = [beds && `${beds} bd`, baths && `${baths} ba`].filter(Boolean).join(" | ");
    if (price && bb) return `${price} • ${bb}`;
    return price || bb || "";
  }

  function getImage(item) {
    if (Array.isArray(item.images) && item.images.length) return item.images[0];
    if (item.image) return item.image;
    return "assets/images/placeholder.jpg";
  }

  function escapeHtml(str) {
    return String(str || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function buildCard(item) {
    const title = escapeHtml(getTitle(item));
    const subtitle = escapeHtml(getSubtitle(item));
    const img = escapeHtml(getImage(item));

    return `
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div class="aspect-[4/3] bg-gray-100">
          <img src="${img}" alt="${title}" class="w-full h-full object-cover" loading="lazy">
        </div>
        <div class="p-3">
          <div class="font-semibold text-sm text-gray-900 truncate">${title}</div>
          <div class="text-xs text-gray-600 truncate">${subtitle}</div>
        </div>
      </div>
    `;
  }

  function renderGrid(containerId, items) {
    const el = $(containerId);
    if (!el) return;

    const slice = items.slice(0, MAX_CARDS);
    if (!slice.length) {
      el.innerHTML = `<div class="col-span-3 text-sm text-gray-500">No listings yet.</div>`;
      return;
    }

    el.innerHTML = slice.map(buildCard).join("");
  }

  function setText(id, value) {
    const el = $(id);
    if (el) el.textContent = String(value);
  }

  // --- main ---
  async function init() {
    try {
      const res = await fetch(DATA_URL, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to fetch ${DATA_URL}: ${res.status}`);

      let data = await res.json();
      if (data && !Array.isArray(data) && Array.isArray(data.listings)) data = data.listings;
      if (!Array.isArray(data)) throw new Error("listing.json must be an array of listings");

      const sale = [];
      const lease = [];

      for (const item of data) {
        const type = inferSaleOrLease(item);
        if (type === "sale") sale.push(item);
        else lease.push(item);
      }

      // counts
      setText("sale-count", sale.length);
      setText("rent-count", lease.length);

      // totals line
      setText("count-total-sale", sale.length);
      setText("count-total-rent", lease.length);

      // render grids
      renderGrid("sale-grid", sale);
      renderGrid("rent-grid", lease);

      // buttons
      const saleBtn = $("saleViewAll");
      if (saleBtn) saleBtn.addEventListener("click", () => {
        window.location.href = "properties.html?type=sale";
      });

      const rentBtn = $("rentViewAll");
      if (rentBtn) rentBtn.addEventListener("click", () => {
        window.location.href = "properties.html?type=lease";
      });

    } catch (err) {
      console.error("home-categories.js error:", err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
