// Home page category counts + previews
// Requires: listing.json in the same folder as index.html

const LISTINGS_JSON_URL = "./listing.json";

// Determine category ("sale" | "rent") from the listing object
function getCategory(listing) {
  const explicit = String(
    listing.saleOrLease || listing.transactionType || listing.listingType || listing.status || ""
  ).toLowerCase();

  const price = String(listing.price || "").toLowerCase();

  // If explicitly set
  if (explicit.includes("rent") || explicit.includes("lease")) return "rent";
  if (explicit.includes("sale")) return "sale";

  // Infer from price text (works with "$899,000" vs "For Lease $2,500 | 1 Year")
  if (
    price.includes("for lease") ||
    price.includes("lease") ||
    price.includes("for rent") ||
    price.includes("rent")
  ) {
    return "rent";
  }

  // Default: sale
  return "sale";
}

function isSale(listing) {
  return getCategory(listing) === "sale";
}

function isRent(listing) {
  return getCategory(listing) === "rent";
}

function getMainImage(listing) {
  return listing.image || (Array.isArray(listing.images) ? listing.images[0] : "") || "";
}

function createThumb(listing) {
  const a = document.createElement("a");
  a.href = `listing.html?id=${encodeURIComponent(listing.id || "")}`;
  a.className =
    "block overflow-hidden rounded-lg border border-gray-200 hover:shadow-md transition bg-white";

  const img = document.createElement("img");
  img.src = getMainImage(listing) || "assets/images/placeholder.jpg";
  img.alt = listing.title || "Listing";
  img.className = "w-full h-28 object-cover";

  const meta = document.createElement("div");
  meta.className = "p-2 text-xs text-gray-700";
  meta.innerHTML = `
    <div class="font-semibold truncate">${listing.title || ""}</div>
    <div class="truncate">${listing.price || ""}</div>
  `;

  a.appendChild(img);
  a.appendChild(meta);
  return a;
}

async function loadListings() {
  const url = new URL(LISTINGS_JSON_URL, window.location.href).toString();
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch ${url} (${res.status})`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("listing.json is not an array");
  return data;
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function renderThumbs(containerId, listings, limit = 6) {
  const el = document.getElementById(containerId);
  if (!el) return;

  el.innerHTML = "";
  el.className = "grid grid-cols-2 md:grid-cols-3 gap-3 mt-4";

  listings.slice(0, limit).forEach((l) => el.appendChild(createThumb(l)));
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const listings = await loadListings();

    const saleListings = listings.filter(isSale);
    const rentListings = listings.filter(isRent);

    // Header line counts
    setText("sale-count", saleListings.length);
    setText("rent-count", rentListings.length);

    // Card counts
    setText("sale-count-2", saleListings.length);
    setText("rent-count-2", rentListings.length);

    // Thumbnails
    renderThumbs("sale-grid", saleListings, 6);
    renderThumbs("rent-grid", rentListings, 6);

    // View all links (optional if present in HTML)
    const saleView = document.getElementById("sale-viewall");
    if (saleView) saleView.href = "properties.html?type=sale";
    const rentView = document.getElementById("rent-viewall");
    if (rentView) rentView.href = "properties.html?type=rent";
  } catch (err) {
    console.error("Home categories error:", err);
    setText("sale-count", 0);
    setText("rent-count", 0);
    setText("sale-count-2", 0);
    setText("rent-count-2", 0);
  }
});
