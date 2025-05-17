const mongoose = require("mongoose");

const batchSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: String,
    image: String,
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true });

module.exports = mongoose.model("Batch", batchSchema);
