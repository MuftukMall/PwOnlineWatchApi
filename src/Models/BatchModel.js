const mongoose = require("mongoose");
const { Schema } = mongoose;

const accessSchema = new Schema({
    token: { type: String },
    refreshToken: { type: String },
    rendomId: { type: String },
});

const batchSchema = new Schema({
    name: { type: String },
    batch: { type: String },
    access: [accessSchema]
});

const batchModel = mongoose.model("Batch", batchSchema);
module.exports = batchModel;
