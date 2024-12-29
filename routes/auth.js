// routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();

// Registration Route
router.get("/register", (req, res) => res.render("register"));
// Registration Route
router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).send("Username and password are required");
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.redirect("/login");
  } catch (error) {
    console.error("Error creating user:", error);

    // Check for duplicate username error
    if (error.code === 11000) {
      return res.status(400).send("Username already exists");
    }

    res.status(500).send("Failed to create user");
  }
});

// Login Route
router.get("/login", (req, res) => res.render("login"));
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  console.log(user);
  if (user && (await bcrypt.compare(password, user.password))) {
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    if (user.isAdmin) {
      res.cookie("token", token).redirect("/admin");
    } else {
      res.cookie("token", token).redirect("/user");
    }
  } else {
    res.status(400).send("Invalid credentials");
  }
});

module.exports = router;
