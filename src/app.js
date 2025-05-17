require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const batchRouter = require("./Routes/BatchRoute");

const app = express();
app.use(express.json());
app.use(cors());
const PORT = process.env.PORT || 7854;

app.use("/api/batches", batchRouter)

const startServer = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        app.listen(PORT, () => {
            console.log(`Server is running on Port: ${PORT}`);
        });
    } catch (error) {
        console.error("Mongoose Connection Error: ", error.message);
        process.exit(1);
    }
};

startServer();


module.exports = app;
