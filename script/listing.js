// ===================================
// listing.js (gallery + details stable)
// - Main image: object-contain (no crop)
// - Thumbs: small, scrollable, clickable
// - Arrows + swipe supported
// - Works with both "old" and "new" JSON shapes
// ===================================

(function () {
  // ---------- Helpers ----------
  const qs = (sel, root = document) => root.querySelector(sel);

  const escapeHtml = (str) =>
    String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const isValidId = (id) => id && id !== "undefined" && id !== "null";

  function injectGalleryStylesOnce() {
    if (qs("#listing-gallery-styles")) return;

    const style = document.createElement("style");
    style.id = "listing-gallery-styles";
    style.textContent = `
      /* Main gallery area: keep image contained + show side padding gaps */
      .listing-gallery-main {
        height: 480px;
        max-height: 70vh;
      }
      @media (max-width: 640px) {
        .listing-gallery-main {
          height: 300px;
          max-height: 55vh;
        }
      }

      /* Thumbnails */
      .listingThumbsSwiper {
        padding: 6px 2px;
      }
      .listingThumbsSwiper .swiper-slide {
        width: 110px;
        height: 78px;
        opacity: 0.55;
        cursor: pointer;
      }
      @media (max-width: 640px) {
        .listingThumbsSwiper .swiper-slide {
          width: 90px;
          height: 64px;
        }
      }
      .listingThumbsSwiper .swiper-slide-thumb-active {
        opacity: 1;
      }

      /* Make Swiper arrows more visible but not huge */
      .listingMainSwiper .swiper-button-next,
      .listingMainSwiper .swiper-button-prev {
        color: #0f4c3a;
        transform: scale(0.9);
      }
    `;
    document.head.appendChild(style);
  }

  function normalizeListing(listing) {
    const out = { ...listing };

    // images: prefer "images", else "image"
    const imgs = Array.isArray(out.images) ? out.images : [];
    out.images = imgs.length ? imgs : out.image ? [out.image] : [];

    // old vs new structures
    out.rooms = Array.isArray(out.rooms) ? out.rooms : [];
    out.amenities = Array.isArray(out.amenities) ? out.amenities : [];

    out.features = Array.isArray(out.features) ? out.features : [];
    out.interiorFeatures = Array.isArray(out.interiorFeatures) ? out.interiorFeatures : [];
    out.specialDesignations = Array.isArray(out.specialDesignations) ? out.specialDesignations : [];
    out.waterfront = Array.isArray(out.waterfront) ? out.waterfront : [];
    out.includedInLease = Array.isArray(out.includedInLease) ? out.includedInLease : [];
    out.washrooms = Array.isArray(out.washrooms) ? out.washrooms : [];

    out.listingInformation = out.listingInformation && typeof out.listingInformation === "object" ? out.listingInformation : null;
    out.propertyInformation = out.propertyInformation && typeof out.propertyInformation === "object" ? out.propertyInformation : null;

    out.status = out.status || "Active";
    out.mlsNum = out.mlsNum || "N/A";
    out.homeStyle = out.homeStyle || "";
    out.propertyType = out.propertyType || "";

    // quick facts (optional)
    out.quickFacts = out.quickFacts && typeof out.quickFacts === "object" ? out.quickFacts : null;

    // links (optional)
    out.links = out.links && typeof out.links === "object" ? out.links : null;

    // map (optional)
    out.map = out.map && typeof out.map === "object" ? out.map : null;

    // contract (optional)
    out.contract = out.contract && typeof out.contract === "object" ? out.contract : null;

    return out;
  }

  function renderKeyValueSection(title, obj) {
    if (!obj || typeof obj !== "object") return "";
    const entries = Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== "");
    if (!entries.length) return "";

    return `
      <section class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-semibold mb-4">${escapeHtml(title)}</h3>
        <div class="grid md:grid-cols-2 gap-x-10 gap-y-3 text-sm">
          ${entries
            .map(
              ([k, v]) => `
                <div class="flex gap-3">
                  <div class="w-48 text-gray-600 font-semibold">${escapeHtml(k)}</div>
                  <div class="text-gray-900">${escapeHtml(v)}</div>
                </div>`
            )
            .join("")}
        </div>
      </section>
    `;
  }

  function renderChipListSection(title, items) {
    if (!Array.isArray(items) || !items.length) return "";
    return `
      <section>
        <h3 class="text-lg font-semibold mb-3">${escapeHtml(title)}</h3>
        <div class="flex flex-wrap gap-2">
          ${items
            .filter(Boolean)
            .map(
              (x) => `
              <span class="inline-flex items-center px-3 py-1 rounded-full bg-white shadow text-sm text-gray-800 border">
                ${escapeHtml(x)}
              </span>`
            )
            .join("")}
        </div>
      </section>
    `;
  }

  function buildQuickFactsLine(listing) {
    // Prefer new shape
    if (listing.quickFacts) {
      const q = listing.quickFacts;
      const parts = [
        q.style,
        q.beds != null ? `${q.beds} Beds` : null,
        q.baths != null ? `${q.baths} Bath` : null,
        q.rooms != null ? `${q.rooms} Rooms` : null,
        q.parking != null ? `${q.parking} Tot prk spcs` : null,
        q.sqft,
        q.dom != null ? `${q.dom} DOM` : null,
      ].filter(Boolean);

      return parts.length
        ? `<p class="text-gray-600 text-sm">${parts.map(escapeHtml).join(" &nbsp;•&nbsp; ")}</p>`
        : "";
    }

    // Fallback old shape
    const parts = [];
    if (listing.homeStyle) parts.push(listing.homeStyle);
    if (listing.bedrooms != null) parts.push(`${listing.bedrooms} Beds`);
    if (listing.bathrooms != null) parts.push(`${listing.bathrooms} Bath`);
    if (listing.area) parts.push(listing.area);

    return parts.length
      ? `<p class="text-gray-600 text-sm">${parts.map(escapeHtml).join(" &nbsp;•&nbsp; ")}</p>`
      : "";
  }

  function buildLinks(listing) {
    const links = listing.links;
    if (!links) return "";

    const btn = (href, label) => {
      if (!href) return "";
      return `
        <a href="${escapeHtml(href)}" target="_blank" rel="noopener"
           class="inline-flex items-center justify-center px-5 py-2 rounded border border-blue-500 text-blue-600 bg-white hover:bg-blue-50 text-sm font-semibold">
          ${escapeHtml(label)}
        </a>
      `;
    };

    const out = [
      btn(links.directions, "Directions"),
      btn(links.neighbourhoodGuide, "Neighbourhood Guide"),
      btn(links.addressGuide, "Address Guide"),
    ].filter(Boolean);

    if (!out.length) return "";

    return `
      <section class="space-y-3">
        <h3 class="text-lg font-semibold">Links</h3>
        <div class="flex flex-wrap gap-3">${out.join("")}</div>
      </section>
    `;
  }

  function buildRoomsTable(listing) {
    // Supports your existing rooms table (floor/type/size/details)
    if (!Array.isArray(listing.rooms) || !listing.rooms.length) return "";

    return `
      <section>
        <h3 class="text-lg font-semibold mb-3">Room Information:</h3>
        <div class="overflow-x-auto">
          <table class="min-w-full bg-white border border-gray-200 rounded shadow text-sm">
            <thead class="bg-gray-100 text-gray-700">
              <tr>
                <th class="py-2 px-3 border-b text-left">Floor</th>
                <th class="py-2 px-3 border-b text-left">Type</th>
                <th class="py-2 px-3 border-b text-left">Size</th>
                <th class="py-2 px-3 border-b text-left">Other</th>
              </tr>
            </thead>
            <tbody>
              ${listing.rooms
                .map(
                  (r) => `
                  <tr>
                    <td class="py-2 px-3 border-b">${escapeHtml(r.floor)}</td>
                    <td class="py-2 px-3 border-b">${escapeHtml(r.type)}</td>
                    <td class="py-2 px-3 border-b">${escapeHtml(r.size)}</td>
                    <td class="py-2 px-3 border-b">${escapeHtml(r.details)}</td>
                  </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  function renderRoomInfoTable(roomInfo) {
  if (!Array.isArray(roomInfo) || !roomInfo.length) return "";

  return `
    <section class="bg-white p-6 rounded-lg shadow">
      <h3 class="text-lg font-semibold mb-3">Room Info</h3>
      <div class="overflow-x-auto">
        <table class="min-w-full bg-white border border-gray-200 rounded shadow text-sm">
          <thead class="bg-gray-100 text-gray-700">
            <tr>
              <th class="py-2 px-3 border-b text-left">Room</th>
              <th class="py-2 px-3 border-b text-left">Level</th>
              <th class="py-2 px-3 border-b text-left">Dimensions</th>
              <th class="py-2 px-3 border-b text-left">Notes</th>
            </tr>
          </thead>
          <tbody>
            ${roomInfo
              .map((r) => {
                const room = r.room || r.roomRows || ""; // supports your current JSON ("roomRows")
                const level = r.level || "";
                const dimensions = r.dimensions || r.size || "";
                const notes = r.notes || r.details || "";
                return `
                  <tr>
                    <td class="py-2 px-3 border-b">${escapeHtml(room)}</td>
                    <td class="py-2 px-3 border-b">${escapeHtml(level)}</td>
                    <td class="py-2 px-3 border-b">${escapeHtml(dimensions)}</td>
                    <td class="py-2 px-3 border-b">${escapeHtml(notes)}</td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}



  function buildWashroomsTable(listing) {
    if (!Array.isArray(listing.washrooms) || !listing.washrooms.length) return "";
    return `
      <section class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-semibold mb-3">Washroom Info</h3>
        <div class="overflow-x-auto">
          <table class="min-w-full bg-white border border-gray-200 rounded text-sm">
            <thead class="bg-gray-100 text-gray-700">
              <tr>
                <th class="py-2 px-3 border-b text-left"># of Washrooms</th>
                <th class="py-2 px-3 border-b text-left">Pieces</th>
                <th class="py-2 px-3 border-b text-left">Level</th>
              </tr>
            </thead>
            <tbody>
              ${listing.washrooms
                .map(
                  (w) => `
                  <tr>
                    <td class="py-2 px-3 border-b">${escapeHtml(w.count ?? "")}</td>
                    <td class="py-2 px-3 border-b">${escapeHtml(w.pieces ?? "")}</td>
                    <td class="py-2 px-3 border-b">${escapeHtml(w.level ?? "")}</td>
                  </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  function buildMapEmbed(listing) {
    const q =
      (listing.map && listing.map.query) ||
      (listing.links && listing.links.directions) ||
      "";

    // If they gave a google maps URL, embed via query as best-effort
    let query = "";
    if (q.includes("google.com") && q.includes("q=")) {
      try {
        const u = new URL(q);
        query = u.searchParams.get("q") || "";
      } catch (_) {}
    } else {
      query = q;
    }

    if (!query) return "";

    const src = `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;

    return `
      <section class="bg-white p-6 rounded-lg shadow space-y-3">
        <h3 class="text-lg font-semibold">Nearby</h3>
        <div class="text-sm text-blue-700 font-semibold">Map & Transit</div>
        <div class="rounded overflow-hidden border">
          <iframe
            title="Map"
            src="${src}"
            width="100%"
            height="320"
            style="border:0;"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"></iframe>
        </div>
      </section>
    `;
  }

  function buildGallery(listing) {
    if (!listing.images.length) return "";

    injectGalleryStylesOnce();

    // Main + thumbs
    const slidesMain = listing.images
      .map(
        (img) => `
        <div class="swiper-slide">
          <div class="w-full h-full flex items-center justify-center bg-gray-100 p-4">
            <img src="${escapeHtml(img)}" alt=""
                 class="max-w-full max-h-full object-contain rounded" />
          </div>
        </div>`
      )
      .join("");

    const slidesThumbs = listing.images
      .map(
        (img) => `
        <div class="swiper-slide">
          <div class="w-full h-full rounded overflow-hidden border bg-gray-100">
            <img src="${escapeHtml(img)}" alt="" class="w-full h-full object-cover" />
          </div>
        </div>`
      )
      .join("");

    const showThumbs = listing.images.length > 1;

    return `
      <section class="bg-white p-4 rounded-lg shadow">
        <div class="swiper listingMainSwiper rounded-lg overflow-hidden border listing-gallery-main">
          <div class="swiper-wrapper">
            ${slidesMain}
          </div>
          <div class="swiper-button-next"></div>
          <div class="swiper-button-prev"></div>
        </div>

        ${
          showThumbs
            ? `
          <div class="swiper listingThumbsSwiper mt-3">
            <div class="swiper-wrapper">
              ${slidesThumbs}
            </div>
          </div>`
            : ""
        }
      </section>
    `;
  }

  function initGallerySwiper(imagesCount) {
    if (typeof Swiper === "undefined") return;

    // If only 1 image, Swiper is still fine, but no need for thumbs/loop.
    const hasThumbs = imagesCount > 1;

    let thumbsSwiper = null;

    if (hasThumbs) {
      thumbsSwiper = new Swiper(".listingThumbsSwiper", {
        spaceBetween: 10,
        slidesPerView: "auto",
        freeMode: true,
        watchSlidesProgress: true,
      });
    }

    new Swiper(".listingMainSwiper", {
      loop: imagesCount > 1,
      spaceBetween: 10,
      navigation: {
        nextEl: ".listingMainSwiper .swiper-button-next",
        prevEl: ".listingMainSwiper .swiper-button-prev",
      },
      thumbs: hasThumbs
        ? { swiper: thumbsSwiper }
        : undefined,
    });
  }

  // ---------- Boot ----------
  const urlParams = new URLSearchParams(window.location.search);
  const listingId = urlParams.get("id");
  const container = qs("#listing-container");

  if (!container) return;

  if (!isValidId(listingId)) {
    container.innerHTML =
      "<p class='text-red-600'>No valid listing ID provided. Go back and click a listing again (your listings page is generating id=undefined).</p>";
    return;
  }

  // cache-bust during dev to avoid 304 confusion
  fetch(`listing.json?v=${Date.now()}`)
    .then((res) => res.json())
    .then((listings) => {
      const listingRaw = Array.isArray(listings)
        ? listings.find((l) => l && l.id === listingId)
        : null;

      if (!listingRaw) throw new Error("Listing not found for id=" + listingId);

      const listing = normalizeListing(listingRaw);

      container.innerHTML = `
        <!-- Top Info -->
        <section class="space-y-2">
          <div class="flex items-start justify-between gap-4">
            <div class="space-y-1">
              <h1 class="text-2xl md:text-3xl font-bold text-gray-900">${escapeHtml(listing.title)}</h1>
              <p class="text-gray-500">${escapeHtml(listing.neighborhood || "")}</p>
              ${buildQuickFactsLine(listing)}
              ${
                listing.price
                  ? `<div class="text-green-700 text-xl md:text-2xl font-semibold">${escapeHtml(listing.price)}</div>`
                  : ""
              }
            </div>
            <button onclick="window.print()" class="mt-1 text-sm text-gray-500 hover:text-green-700 whitespace-nowrap">🖨 Print</button>
          </div>
        </section>

        <!-- Gallery (contained + thumbs) -->
        ${buildGallery(listing)}

        <!-- Links -->
        ${buildLinks(listing)}

        <!-- Client Remarks -->
        ${
          listing.description
            ? `
          <section class="bg-white p-6 rounded-lg shadow">
            <h2 class="text-xl font-semibold mb-4">Client Remarks:</h2>
            <p class="text-gray-700 leading-relaxed">${escapeHtml(listing.description)}</p>
          </section>`
            : ""
        }

        <!-- Neighborhood Amenities -->
        ${
          listing.amenities.length
            ? `
          <section>
            <h2 class="text-xl font-semibold mb-4">Neighborhood Amenities Nearby:</h2>
            <div class="grid md:grid-cols-3 gap-6">
              ${listing.amenities
                .map(
                  (a) => `
                <div class="bg-white p-4 rounded shadow text-center">
                  <div class="text-4xl mb-2">🏫</div>
                  <h3 class="font-bold">${escapeHtml(a.title)}</h3>
                  <p class="text-sm text-gray-600">${escapeHtml(a.description)}</p>
                </div>`
                )
                .join("")}
            </div>
          </section>`
            : ""
        }

        <!-- Listing Summary + Listing Info -->
        <section class="grid md:grid-cols-2 gap-6">
          <div class="bg-white p-6 rounded shadow">
            <h3 class="text-lg font-semibold mb-3">Listing Summary:</h3>
            <ul class="space-y-1 text-sm text-gray-700">
              <li><strong>Status:</strong> ${escapeHtml(listing.status)}</li>
              <li><strong>MLS® Num:</strong> ${escapeHtml(listing.mlsNum)}</li>
              <li><strong>Bathrooms:</strong> ${escapeHtml(listing.bathrooms ?? "")}</li>
              <li><strong>Bedrooms:</strong> ${escapeHtml(listing.bedrooms ?? "")}</li>
              <li><strong>Prop. Type:</strong> ${escapeHtml(listing.propertyType)}</li>
            </ul>
          </div>

          <div class="bg-white p-6 rounded shadow">
            <h3 class="text-lg font-semibold mb-3">Listing Info:</h3>
            <ul class="space-y-1 text-sm text-gray-700">
              <li><strong>Price:</strong> ${escapeHtml(listing.price ?? "")}</li>
              <li><strong>Offer Price:</strong> ${escapeHtml(listing.offer_price ?? "")}</li>
              <li><strong>Home Style:</strong> ${escapeHtml(listing.homeStyle ?? "")}</li>
              <li><strong>Status:</strong> ${escapeHtml(listing.status)}</li>
              <li><strong>Bedrooms:</strong> ${escapeHtml(listing.bedrooms ?? "")}</li>
              <li><strong>MLS® Num:</strong> ${escapeHtml(listing.mlsNum)}</li>
            </ul>
          </div>
        </section>

        <!-- New: Listing Information / Property Information -->
        ${renderKeyValueSection("Listing Information", listing.listingInformation)}
        ${renderKeyValueSection("Property Information", listing.propertyInformation)}

        <!-- New: Feature buckets -->
        ${renderChipListSection("Features", listing.features)}
        ${renderChipListSection("Interior Features", listing.interiorFeatures)}
        ${renderChipListSection("Special Designations", listing.specialDesignations)}
        ${renderChipListSection("Waterfront", listing.waterfront)}

        
        <!-- NEW: Room Info (dynamic) -->
        ${renderRoomInfoTable(listing.roomInfo)}

        <!-- Washroom Info -->
        ${buildWashroomsTable(listing)}

        <!-- Included in Lease -->
        ${renderChipListSection("Included In Lease", listing.includedInLease)}

        <!-- Map -->
        ${buildMapEmbed(listing)}

        <!-- Contracted With -->
        ${
          listing.contract && (listing.contract.brokerage || listing.contract.phone)
            ? `
          <section class="bg-white p-6 rounded-lg shadow">
            <h3 class="text-lg font-semibold mb-3">Listing Contracted With</h3>
            <div class="text-sm text-gray-800 space-y-1">
              ${listing.contract.brokerage ? `<div>${escapeHtml(listing.contract.brokerage)}</div>` : ""}
              ${listing.contract.phone ? `<div>${escapeHtml(listing.contract.phone)}</div>` : ""}
            </div>
          </section>`
            : ""
        }

        <!-- Contact Form 
        <section class="bg-white p-6 rounded-lg shadow space-y-4">
          <h3 class="text-lg font-semibold mb-4">Want more info?</h3>
          <form class="space-y-3">
            <input type="text" placeholder="Your name *" class="w-full border border-gray-300 rounded px-3 py-2" required />
            <input type="email" placeholder="Your email *" class="w-full border border-gray-300 rounded px-3 py-2" required />
            <input type="tel" placeholder="Your phone #" class="w-full border border-gray-300 rounded px-3 py-2" />
            <input type="text" placeholder="Subject: RE: ${escapeHtml(listing.title)}" class="w-full border border-gray-300 rounded px-3 py-2" />
            <textarea rows="4" placeholder="Message" class="w-full border border-gray-300 rounded px-3 py-2"></textarea>
            <button type="submit" class="bg-green-900 hover:bg-green-800 text-white px-6 py-2 rounded font-semibold w-full md:w-auto">Send</button>
          </form>
        </section> -->

        <section id="contact" class="fade-in py-20 bg-white text-black">
          <div class="max-w-5xl mx-auto px-4 text-center">
          <h2 class="text-3xl font-bold mb-6">Let’s Connect</h2>

          <div class="w-full">
          <iframe
          src="https://docs.google.com/forms/d/e/1FAIpQLSesNFZoDavvj09RIWqzg-AKALLveTAUsaa0RSIZcz29VrLLsg/viewform?embedded=true"
          class="w-full"
          height="900"
          frameborder="0"
          marginheight="0"
            marginwidth="0"
            >Loading…</iframe>  
          </div>
          </div>
          </section>

      `;

      // Init Swiper after DOM injected
      initGallerySwiper(listing.images.length);
    })
    .catch((err) => {
      console.error("Error loading listing:", err);
      container.innerHTML = "<p class='text-red-600'>Failed to load listing details. Check console + listing.json.</p>";
    });
})();
