import http from "k6/http";
import { check, sleep } from "k6";

// Define the base URL
const BASE_URL = "http://localhost:3000";

export const options = {
  scenarios: {
    user_scenario: {
      executor: "constant-vus",
      vus: 300, // Simulating 300 users sending location updates
      duration: "2m", // Duration of 2 minutes
    },
    admin_scenario: {
      executor: "per-vu-iterations",
      vus: 5, // Simulating 5 admin users
      iterations: 10, // Each admin performs 10 actions
      startTime: "30s", // Admin actions start after 30 seconds
    },
  },
};

export default function () {
  const randomUserId = "6771271d9f5660fa841154a2"; // Replace with a valid user ID from your database

  if (__ITER % 3 === 0) {
    // Test user sending location to /user
    const payload = JSON.stringify({
      latitude: Math.random() * 90, // Random latitude
      longitude: Math.random() * 180, // Random longitude
    });
    const headers = { "Content-Type": "application/json" };
    const res = http.post(`${BASE_URL}/user`, payload, { headers });

    check(res, {
      "status is 200": (r) => r.status === 200,
    });
  } else if (__ITER % 3 === 1) {
    // Test admin accessing /admin
    const res = http.get(`${BASE_URL}/admin`);

    check(res, {
      "status is 200": (r) => r.status === 200,
    });
  } else {
    // Test admin accessing /admin/logs/:id
    const res = http.get(`${BASE_URL}/admin/logs/${randomUserId}`);

    check(res, {
      "status is 200": (r) => r.status === 200,
    });
  }

  // Wait for a random time between requests
  sleep(Math.random() * 2);
}
