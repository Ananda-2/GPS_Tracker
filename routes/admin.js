const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();

// Middleware to check if the user is an admin
const isAdminLoggedIn = async (req, res, next) => {
  const token = req.cookies.token; // Assuming token is stored in cookies

  if (!token) {
    return res.redirect("/login"); // Redirect to login page if no token is found
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
  const users = await User.find({ isAdmin: false }, "username"); // Exclude admins
  res.render("admin", { users });
});

// View Location Logs
router.get("/logs/:id", isAdminLoggedIn, async (req, res) => {
  const user = await User.findById(req.params.id);
  res.render("logs", { logs: user.locationLogs });
});

module.exports = router;
