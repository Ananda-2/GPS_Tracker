// const express = require("express");
// const socketio = require("socket.io");
// const http = require("http");
// const path = require("path");
// const bodyParser = require("body-parser");
// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");
// const { Pool } = require("pg");
// const mongoose = require("mongoose");

// const app = express();
// const server = http.createServer(app);
// const io = socketio(server);

// app.set("view engine", "ejs");
// app.set(express.static(path.join(__dirname, "public")));
// app.use(express.static("public"));
// app.use(bodyParser.json());

// // MongoDB connection
// mongoose.connect("mongodb://localhost:27017/location_tracker", {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

// // User Model
// const User = mongoose.model("User", {
//   username: { type : String , unique : true , required: true  } ,
//   password:  { type: String , required: true },
//   isAdmin: { type: Boolean, default: false },
// });

// // Location Model
// const Location = mongoose.model("Location", {
//   userId: mongoose.Schema.Types.ObjectId,
//   latitude: Number,
//   longitude: Number,
//   timestamp: { type: Date, default: Date.now },
// });

// // Authentication middleware
// const requireLogin = (req, res, next) => {
//   if (req.session.userId) {
//     next();
//   } else {
//     res.redirect("/login");
//   }
// };

// const requireAdmin = async (req, res, next) => {
//   if (req.session.userId) {
//     const user = await User.findById(req.session.userId);
//     if (user && user.isAdmin) {
//       next();
//     } else {
//       res.status(403).send("Unauthorized");
//     }
//   } else {
//     res.redirect("/login");
//   }
// };

// io.on("connection", function (socket) {
//   console.log("connected");
//   socket.on("send-location", function (data) {
//     console.log(data);
//     io.emit("recive-location", {
//       id: socket.id,
//       ...data,
//     });
//   });
//   socket.on("disconnect", function () {
//     io.emit("user-disconnected", socket.id);
//   });
// });

// //////////////////////////////////////   ROUTES   //////////////////////////////////////////////////////
// // Routes
// app.get("/", (req, res) => {
//   res.redirect("/login");
// });

// app.get("/register", (req, res) => {
//   res.render("register");
// });

// app.post("/register", async (req, res) => {
//   try {
//     const hashedPassword = await bcrypt.hash(req.body.password, 10);
//     const user = new User({
//       username: req.body.username,
//       password: hashedPassword,
//     });
//     await user.save();
//     res.redirect("/login");
//   } catch (error) {
//     res.status(500).send("Error registering user");
//   }
// });

// app.get("/login", (req, res) => {
//   res.render("login");
// });

// app.post("/login", async (req, res) => {
//   try {
//     const user = await User.findOne({ username: req.body.username });
//     if (user && (await bcrypt.compare(req.body.password, user.password))) {
//       // req.session.userId = user._id;
//       if (user.isAdmin) {
//         res.redirect("/admin");
//       } else {
//         console.log(user)
//         res.redirect("/dashboard");
//       }
//     } else {
//       res.redirect("/login");
//     }
//   } catch (error) {
//     res.status(500).send("Error logging in");
//   }
// });

// app.get("/dashboard", requireLogin, (req, res) => {
//   res.render("dashboard");
// });

// app.get("/admin", requireAdmin, async (req, res) => {
//   const users = await User.find({ isAdmin: false });
//   res.render("admin", { users });
// });

// app.get("/admin/user/:userId/locations", requireAdmin, async (req, res) => {
//   const locations = await Location.find({ userId: req.params.userId })
//     .sort({ timestamp: -1 })
//     .limit(100);
//   res.render("locations", { locations });
// });

// app.listen(3000, () => {
//   console.log("Server running on port 3000");
// });

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const socketIo = require("socket.io");
const User = require("./models/User")

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static("public"));
app.use(express.json());
app.set("view engine", "ejs");

// Database Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1); // Exit the process if the database isn't connected
  });

// Routes
app.use("/", authRoutes);
app.use("/user", userRoutes);
app.use("/admin", adminRoutes);

// Start Server
const server = app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);

// Socket.io for Location Tracking
const io = socketIo(server);
io.on("connection", (socket) => {
  socket.on("location", ({ userId, latitude, longitude }) => {
    User.findByIdAndUpdate(userId, {
      $push: { locationLogs: { latitude, longitude } },
    }).exec();
    console.log("first");
  });
});