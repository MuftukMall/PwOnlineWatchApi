const axios = require("axios");
const express = require("express");
const batchModel = require("../Models/BatchModel");
const batchRouter = express.Router();

batchRouter.post("/", async (req, res) => {
    try {
        const { Token, RefreshToken, userId, rendomId, userName, mobileNo } = req.body;

        const allBatches = [];
        let page = 1;

        while (true) {
            const response = await axios.get(
                `https://api.penpencil.co/batch-service/v1/batches/purchased-batches`,
                {
                    params: { page, type: "ALL" },
                    headers: { Authorization: `Bearer ${Token}` },
                }
            );

            const batches = response.data?.data;
            if (!batches || batches.length === 0) break;

            for (const batch of batches) {
                allBatches.push({
                    id: batch._id,
                    name: batch.name,
                    image: batch?.previewImage?.baseUrl && batch?.previewImage?.key ? batch.previewImage.baseUrl + batch.previewImage.key : "https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg",
                });
            }

            page++;
        }

        const data = {
            userId,
            userName,
            mobileNo,
            Token,
            RefreshToken,
            rendomId,
            batches: allBatches,
        };

        await batchModel.findOneAndUpdate(
            { userId },
            data,
            { upsert: true, new: true }).then((result) => {
                console.log("User Updated Sccuessfully");
            })

        res.status(200).send({ success: true, total: allBatches.length });
    } catch (error) {
        console.error("Error fetching batches:", error.message);
        res.status(400).send({ success: false, message: error.message });
    }
});

batchRouter.get("/search", async (req, res) => {
    try {
        const searchQuery = req.query.name || "";
        const allUsers = await batchModel.find({}, { batches: 1, _id: 0 });

        const allBatches = allUsers.flatMap(user =>
            user.batches.filter(batch =>
                batch.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
        );
        const uniqueBatchesMap = new Map();
        allBatches.forEach(batch => {
            if (!uniqueBatchesMap.has(batch.id)) {
                uniqueBatchesMap.set(batch.id, {
                    id: batch.id,
                    name: batch.name,
                    image: batch.image,
                });
            }
        });

        const uniqueBatches = Array.from(uniqueBatchesMap.values());

        res.status(200).send(
            uniqueBatches,
        );
    } catch (error) {
        console.error("Search batches:", error.message);
        res.status(400).send({ success: false, message: error.message });
    }
});

batchRouter.get("/tokenID", async (req, res) => {
    try {
        const { batchId } = req.query;

        if (!batchId) {
            return res.status(400).send({ success: false, message: "Missing batchId in query" });
        }

        const userWithBatch = await batchModel.findOne(
            { "batches.id": batchId },
            { Token: 1, rendomId: 1, _id: 0 }
        );

        if (!userWithBatch) {
            return res.status(404).send({ success: false, message: "Batch not found" });
        }

        res.status(200).send({
            success: true,
            batchId,
            accessToken: userWithBatch.Token,
            rendomId: userWithBatch.rendomId,
        });

    } catch (error) {
        console.error("Error fetching token by batch ID:", error.message);
        res.status(400).send({ success: false, message: error.message });
    }
});

module.exports = batchRouter;
