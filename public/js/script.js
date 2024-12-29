const socket = io();

// Function to track location using geolocation with fallback to IP-based service
function trackLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
      ({ coords: { latitude, longitude } }) => {
        console.log("User position:", { latitude, longitude });
        socket.emit("send-location", { latitude, longitude });
      },
      (error) => {
        console.error("Geolocation error:", error.message);
        useIPFallback();
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 2500,
      }
    );
  } else {
    console.warn("Geolocation is not supported by this browser.");
    useIPFallback();
  }
}

// Fallback to IP-based location service
function useIPFallback() {
  fetch("https://ipapi.co/json/")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch IP-based location.");
      }
      return response.json();
    })
    .then(({ latitude, longitude }) => {
      console.log("IP-based location:", { latitude, longitude });
      socket.emit("send-location", { latitude, longitude });
    })
    .catch((error) => {
      console.error("IP-based location error:", error.message);
    });
}

// Initialize map
const map = L.map("map").setView([0, 0], 10);

// Add OpenStreetMap tile layer
L.tileLayer("https://a.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

const markers = {};

// Handle location updates from the server
socket.on("recive-location", ({ id, latitude, longitude }) => {
  map.setView([latitude, longitude], 15);

  if (markers[id]) {
    markers[id].setLatLng([latitude, longitude]);
  } else {
    markers[id] = L.marker([latitude, longitude]).addTo(map);
  }
});

// Handle user disconnection
socket.on("user-disconnected", (id) => {
  if (markers[id]) {
    map.removeLayer(markers[id]);
    delete markers[id];
    console.log(`User ${id} disconnected`);
  }
});

// Start tracking location
trackLocation();
