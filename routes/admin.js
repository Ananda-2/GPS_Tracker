const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const redis = require("redis");

const router = express.Router();

// Configure Redis
const redisClient = redis.createClient();
redisClient.connect();

// Middleware to check if the user is an admin
const isAdminLoggedIn = async (req, res, next) => {
  const token = req.cookies.token; // Assuming token is stored in cookies

  if (!token) {
    return res.redirect("/login");
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    // Check if the user exists and is an admin
    if (!user || !user.isAdmin) {
      return res.redirect("/login");
    }

    req.user = user;
    next();
  } catch (error) {
    return res.redirect("/login");
  }
};

// Admin Dashboard
router.get("/", isAdminLoggedIn, async (req, res) => {
  const cacheKey = "admin_users";

  try {
    // Check cache
    const cachedUsers = await redisClient.get(cacheKey);
    if (cachedUsers) {
      console.log("cachedData----------------")
      return res.render("admin", { users: JSON.parse(cachedUsers) });
    }

    // Query database if cache is empty
    const users = await User.find({ isAdmin: false }, "username");

    // Store result in cache
    await redisClient.set(cacheKey, JSON.stringify(users), { EX: 3600 }); // Cache for 1 hour

    res.render("admin", { users });
  } catch (error) {
    res.status(500).send("Server Error");
  }
});

// View Location Logs
router.get("/logs/:id", isAdminLoggedIn, async (req, res) => {
  const cacheKey = `user_logs_${req.params.id}`;

  try {
    // Check cache
    const cachedLogs = await redisClient.get(cacheKey);
    if (cachedLogs) {
      console.log("cachedLog--------");
      return res.render("logs", { logs: JSON.parse(cachedLogs) });
    }
    // console.log("UncachedLog++++++++++++++++++");

    // Query database if cache is empty
    const user = await User.findById(req.params.id);

    // Store result in cache
    await redisClient.set(cacheKey, JSON.stringify(user.locationLogs), {
      EX: 3600,
    }); // Cache for 1 hour

    res.render("logs", { logs: user.locationLogs });
  } catch (error) {
    res.status(500).send("Server Error");
  }
});

module.exports = router;
