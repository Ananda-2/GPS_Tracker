// routes/user.js
const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();

// Middleware to verify token
function verifyToken(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.redirect("/login");
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.redirect("/login");
    req.userId = decoded.id;
    next();
  });
}

// User Dashboard
router.get("/", verifyToken, (req, res) => {
  res.render("user", { userId: req.userId });
});

// Location Tracking
router.post("/track", verifyToken, async (req, res) => {
  const { latitude, longitude } = req.body;
  await User.findByIdAndUpdate(req.userId, {
    $push: { locationLogs: { latitude, longitude } },
  });
  res.sendStatus(200);
});

module.exports = router;
