const mongoose = require("mongoose");
const { Schema } = mongoose;

const accessSchema = new Schema({
    id: { type: String },
    name: { type: String },
    image: { type: String },
});

const batchSchema = new Schema({
    userId: { type: String },
    userName: { type: String },
    mobileNo: { type: String },
    Token: { type: String },
    Token: { type: String },
    RefreshToken: { type: String },
    rendomId: { type: String },
    batches: [accessSchema]
});

const batchModel = mongoose.model("Batch", batchSchema);
module.exports = batchModel;
