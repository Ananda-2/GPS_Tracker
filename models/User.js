// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  locationLogs: [
    {
      latitude: Number,
      longitude: Number,
      timestamp: { type: Date, default: Date.now },
    },
  ],
  isAdmin : {type : Boolean , default : false },
});

module.exports = mongoose.model('User', userSchema);
