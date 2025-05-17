const axios = require("axios");
const express = require("express");
const batchRouter = express.Router();

batchRouter.post("/", async (req, res) => {
    try {
        const { Token, RefreshToken, userId, mobileNumber, rendomId } = req.body;

        let allBatches = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
            const response = await axios.get(
                `https://api.penpencil.co/batch-service/v1/batches/purchased-batches?page=${page}&type=ALL`,
                {
                    headers: { Authorization: `Bearer ${Token}` },
                }
            );

            const batches = response.data?.data || [];

            if (batches.length === 0) {
                hasMore = false;
            } else {
                allBatches = allBatches.concat(batches);
                page += 1;
            }
        }


        res.status(200).send({ success: true, total: allBatches.length });

    } catch (error) {
        res.status(400).send({ success: false, message: error.message });
    }
});

module.exports = batchRouter;
