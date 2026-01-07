// Fade-in animation on scroll
document.addEventListener("DOMContentLoaded", function () {
  const fadeElements = document.querySelectorAll(".fade-in");
  const options = { threshold: 0.1 };

  const observer = new IntersectionObserver(function (entries, observer) {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("opacity-100", "translate-y-0");
      entry.target.classList.remove("opacity-0", "translate-y-10");
      observer.unobserve(entry.target);
    });
  }, options);

  fadeElements.forEach((el) => {
    el.classList.add("transition-all", "duration-1000", "opacity-0", "translate-y-10");
    observer.observe(el);
  });
});

// Dynamic Listings on Homepage
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("listing-cards");
  if (!container) return;

  fetch("listing.json")
    .then((res) => res.json())
    .then((listings) => {
      // Clear existing (avoid duplicates on hot reload)
      container.innerHTML = "";

      const valid = listings.filter((l) => l && l.id); // must have id

      valid.forEach((listing) => {
        const cover =
          listing.image ||
          (Array.isArray(listing.images) && listing.images.length ? listing.images[0] : "");

        // Skip cards that have no image (optional: you can allow placeholder)
        if (!cover) {
          console.warn("Skipping listing with no image:", listing);
          return;
        }

        const card = document.createElement("div");
        card.className = "swiper-slide";

        card.innerHTML = `
          <a href="listing.html?id=${encodeURIComponent(listing.id)}"
             class="w-72 border rounded overflow-hidden shadow hover:shadow-lg transition duration-300 block mx-auto">
            <img src="${cover}" alt="${listing.title || "Listing"}" class="w-full h-48 object-cover">
            <div class="bg-green-900 text-white px-4 py-4 text-left space-y-2">
              <h4 class="text-lg font-semibold leading-snug">${listing.title || "Untitled Listing"}</h4>
              <p class="text-xl font-bold">${listing.price || ""}</p>
              <div class="flex space-x-4 text-sm opacity-80">
                <span>🛏 ${listing.bedrooms ?? ""}</span>
                <span>🛁 ${listing.bathrooms ?? ""}</span>
                <span>📐 ${listing.area || "N/A"}</span>
              </div>
            </div>
          </a>
        `;
        container.appendChild(card);
      });

      // Init Swiper after injecting slides
      if (typeof Swiper !== "undefined") {
        new Swiper(".mySwiper", {
          loop: true,
          slidesPerView: 1,
          spaceBetween: 20,
          autoplay: { delay: 3000, disableOnInteraction: false },
          pagination: { el: ".swiper-pagination", clickable: true },
          navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" },
          breakpoints: {
            640: { slidesPerView: 2 },
            768: { slidesPerView: 3 },
            1024: { slidesPerView: 4 },
          },
        });
      }
    })
    .catch((err) => console.error("Error loading listings:", err));
});
