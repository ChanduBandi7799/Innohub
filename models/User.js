const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: { type: String },
  email: { type: String, required: true },
  password: { type: String },
  name: String,
  bio: { type: String }, // ✅ Add this line
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
