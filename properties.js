const LISTINGS_JSON_URL = "./listing.json";

function getTypeParam() {
  const params = new URLSearchParams(window.location.search);
  const t = (params.get("type") || "all").toLowerCase();
  if (t === "sale" || t === "rent" || t === "all") return t;
  return "all";
}

function getCategory(listing) {
  const explicit = String(
    listing.saleOrLease || listing.transactionType || listing.listingType || listing.status || ""
  ).toLowerCase();

  const price = String(listing.price || "").toLowerCase();

  if (explicit.includes("rent") || explicit.includes("lease")) return "rent";
  if (explicit.includes("sale")) return "sale";

  if (
    price.includes("for lease") ||
    price.includes("lease") ||
    price.includes("for rent") ||
    price.includes("rent")
  ) return "rent";

  return "sale";
}

function getMainImage(listing) {
  return listing.image || (Array.isArray(listing.images) ? listing.images[0] : "") || "";
}

function formatMeta(listing) {
  const beds = listing.bedrooms !== undefined ? `${listing.bedrooms} Beds` : "";
  const baths = listing.bathrooms !== undefined ? `${listing.bathrooms} Baths` : "";
  const sqft = listing.area ? listing.area : "";
  return [beds, baths, sqft].filter(Boolean).join(" • ");
}

function card(listing) {
  const a = document.createElement("a");
  a.href = `listing.html?id=${encodeURIComponent(listing.id || "")}`;
  a.className = "block rounded-xl overflow-hidden border hover:shadow-md transition bg-white";

  const img = document.createElement("img");
  img.src = getMainImage(listing) || "assets/images/placeholder.jpg";
  img.alt = listing.title || "Listing";
  img.className = "w-full h-48 object-cover";

  const body = document.createElement("div");
  body.className = "p-4";
  body.innerHTML = `
    <div class="text-sm text-gray-500">${getCategory(listing) === "rent" ? "For Rent" : "For Sale"}</div>
    <div class="font-bold text-lg mt-1">${listing.title || ""}</div>
    <div class="text-gray-700 mt-1">${listing.price || ""}</div>
    <div class="text-sm text-gray-500 mt-2">${formatMeta(listing)}</div>
  `;

  a.appendChild(img);
  a.appendChild(body);
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

function setActiveFilter(type) {
  const map = { all: "filterAll", sale: "filterSale", rent: "filterRent" };
  Object.entries(map).forEach(([t, id]) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (t === type) el.classList.add("bg-black", "text-white", "border-black");
    else el.classList.remove("bg-black", "text-white", "border-black");
  });
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function showError(msg) {
  const box = document.getElementById("errorBox");
  if (!box) return;
  box.textContent = msg;
  box.classList.remove("hidden");
}

document.addEventListener("DOMContentLoaded", async () => {
  const type = getTypeParam();
  setActiveFilter(type);

  try {
    const listings = await loadListings();
    const filtered =
      type === "all"
        ? listings
        : listings.filter((l) => getCategory(l) === type);

    setText("pageSubtitle", `${filtered.length} properties`);
    setText("pageTitle", type === "sale" ? "Properties For Sale" : type === "rent" ? "Properties For Rent" : "Properties");

    const grid = document.getElementById("grid");
    grid.innerHTML = "";
    filtered.forEach((l) => grid.appendChild(card(l)));
  } catch (err) {
    console.error(err);
    setText("pageSubtitle", "0 properties");
    showError(String(err));
  }
});
