// script/main.js

// Fade-in animation on scroll using Intersection Observer
document.addEventListener("DOMContentLoaded", function () {
  const fadeElements = document.querySelectorAll(".fade-in");

  const options = {
    threshold: 0.1,
  };

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

// script/main.js
fetch("listings/listings.json")
  .then((res) => res.json())
  .then((data) => {
    const container = document.getElementById("listing-cards");
    data.forEach((listing) => {
      const card = document.createElement("div");
      card.className = "max-w-xs rounded overflow-hidden shadow-lg m-4";
      card.innerHTML = `
        <a href="listing.html?id=${listing.id}">
          <img class="w-full" src="${listing.images[0]}" alt="${listing.address}" />
          <div class="bg-green-900 text-white p-4">
            <p class="font-semibold">${listing.address}</p>
            <p class="text-lg">${listing.price}</p>
          </div>
        </a>
      `;
      container.appendChild(card);
    });
  })
  .catch((error) => {
    console.error("Failed to load listings:", error);
  });

