// script/listing.js
const urlParams = new URLSearchParams(window.location.search);
const listingId = urlParams.get("id");

if (!listingId) {
  document.getElementById("listing-container").innerHTML = "<p class='text-red-500'>No listing ID provided in the URL.</p>";
} else {
  fetch("listings/listings.json")
    .then((res) => res.json())
    .then((listings) => {
      const listing = listings.find((l) => l.id === listingId);
      if (!listing) throw new Error("Listing not found");

      renderListing(listing);
    })
    .catch(() => {
      document.getElementById("listing-container").innerHTML = "<p class='text-red-500'>Failed to load listing data.</p>";
    });
}

function renderListing(listing) {
  document.getElementById("listing-container").innerHTML = `
    <h1 class="text-2xl font-bold">${listing.address}</h1>
    <p class="text-green-600 text-xl mb-4">${listing.price}</p>
    <div class="flex gap-4 overflow-auto mb-6">
      ${listing.images.map((img) => `<img class="h-48 rounded" src="${img}" alt="${listing.address}" />`).join("")}
    </div>
    <h2 class="text-xl font-semibold mb-2">About this property</h2>
    <p class="mb-4">${listing.summary}</p>

    <h2 class="text-xl font-semibold mb-2">Room Information</h2>
    <table class="w-full text-left border">
      <thead class="bg-gray-200"><tr><th>Floor</th><th>Room</th><th>Size</th><th>Details</th></tr></thead>
      <tbody>
        ${listing.rooms.map(room => `<tr class="border-t"><td>${room.floor}</td><td>${room.room}</td><td>${room.size}</td><td>${room.details}</td></tr>`).join("")}
      </tbody>
    </table>

    <h2 class="text-xl font-semibold mt-6 mb-2">Neighborhood Amenities Nearby</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      ${listing.neighborhood.map(n => `
        <div>
          <img class="rounded h-32 object-cover w-full" src="${n.image}" alt="${n.title}">
          <p class="text-center mt-2">${n.title}</p>
        </div>
      `).join("")}
    </div>

    <h2 class="text-xl font-semibold mt-6 mb-2">Book a Showing</h2>
    <form class="bg-white p-4 rounded shadow-md">
      <input class="w-full p-2 mb-2 border" type="text" placeholder="Your Name" />
      <input class="w-full p-2 mb-2 border" type="email" placeholder="Your Email" />
      <input class="w-full p-2 mb-2 border" type="tel" placeholder="Your Phone" />
      <textarea class="w-full p-2 mb-2 border" rows="4" placeholder="Your Message"></textarea>
      <button class="bg-green-700 text-white py-2 px-4 rounded" type="submit">Send</button>
    </form>
  `;
}
