const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true }, // your unique user identifier
  userName: String,
  mobileNo: String,
  Token: String,
  RefreshToken: String,
  rendomId: String,
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
