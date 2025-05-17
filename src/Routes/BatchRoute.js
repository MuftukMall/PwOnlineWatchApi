const axios = require("axios");
const express = require("express");
const userModel = require("../Models/UserModel");
const batchModel = require("../Models/BatchModel");

const batchRouter = express.Router();

batchRouter.post("/uploadUser", async (req, res) => {
    try {
        const { Token, RefreshToken, userId, rendomId, userName, mobileNo } = req.body;

        const user = await userModel.findOneAndUpdate(
            { userId },
            { userName, mobileNo, Token, RefreshToken, rendomId },
            { upsert: true, new: true }
        );

        let page = 1;
        let totalBatches = 0;
        const fetchedBatchIds = new Set();

        while (true) {
            const { data: response } = await axios.get(
                "https://api.penpencil.co/batch-service/v1/batches/purchased-batches",
                {
                    params: { page, type: "ALL" },
                    headers: { Authorization: `Bearer ${Token}` },
                }
            );

            const batches = response?.data;
            if (!batches || batches.length === 0) break;

            for (const batch of batches) {
                const batchId = batch._id;
                fetchedBatchIds.add(batchId);

                const batchData = {
                    id: batchId,
                    name: batch.name,
                    image:
                        batch?.previewImage?.baseUrl && batch?.previewImage?.key
                            ? batch.previewImage.baseUrl + batch.previewImage.key
                            : "https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg",
                };

                let existingBatch = await batchModel.findOne({ id: batchId });

                if (!existingBatch) {
                    await batchModel.create({ ...batchData, users: [user._id] });
                } else {
                    if (!existingBatch.users.includes(user._id)) {
                        existingBatch.users.push(user._id);
                        await existingBatch.save();
                    }
                }

                totalBatches++;
            }

            page++;
        }

        res.status(200).send({ success: true, total: totalBatches });
    } catch (error) {
        console.error("Error fetching batches:", error.message);
        res.status(400).send({ success: false, message: error.message });
    }
});

batchRouter.get("/search", async (req, res) => {
    try {
        const searchQuery = req.query.name?.trim().toLowerCase() || "";

        const batches = await batchModel.find({
            name: { $regex: searchQuery, $options: "i" },
        }).populate("users", "userId userName");

        const result = batches.map(batch => ({
            id: batch.id,
            name: batch.name,
            image: batch.image,
        }));

        res.status(200).send({ success: true, data: result });
    } catch (error) {
        console.error("Error searching batches:", error.message);
        res.status(500).send({ success: false, message: error.message });
    }
});

batchRouter.get("/tokenID", async (req, res) => {
    try {
        const { batchId } = req.query;
        if (!batchId) return res.status(400).send({ success: false, message: "Missing batchId" });

        const batch = await batchModel.findOne({ id: batchId }).populate("users");

        if (!batch || batch.users.length === 0) {
            return res.status(404).send({ success: false, message: "No users for this batch" });
        }

        for (const user of batch.users) {
            try {
                const response = await axios.post(
                    "https://api.penpencil.co/v3/oauth/verify-token",
                    null,
                    {
                        headers: {
                            accept: "application/json, text/plain, */*",
                            authorization: `Bearer ${user.Token}`,
                            "client-id": "5eb393ee95fab7468a79d189",
                            "client-type": "WEB",
                            "client-version": "8.8.3",
                            "integration-with": "",
                            "randomid": user.rendomId,
                            "sec-ch-ua": `\"Chromium\";v=\"136\", \"Google Chrome\";v=\"136\", \"Not.A/Brand\";v=\"99\"`,
                            "sec-ch-ua-mobile": "?0",
                            "sec-ch-ua-platform": `\"Windows\"`,
                            Referer: "https://www.pw.live/",
                            "Referrer-Policy": "strict-origin-when-cross-origin",
                        },
                    }
                );

                if (response.data?.success && response.data.data?.isVerified) {
                    return res.status(200).send({
                        success: true,
                        batchId,
                        accessToken: user.Token,
                        rendomId: user.rendomId,
                        userId: user.userId,
                    });
                }
            } catch (err) {
                await batchModel.updateOne({ id: batchId }, { $pull: { users: user._id } });
                await userModel.deleteOne({ _id: user._id });
            }
        }

        const updatedBatch = await batchModel.findOne({ id: batchId });
        if (!updatedBatch.users.length) {
            await batchModel.deleteOne({ id: batchId });
        }

        return res.status(404).send({ success: false, message: "No valid user tokens for this batch" });
    } catch (error) {
        console.error("Error in /tokenID:", error.message);
        res.status(500).send({ success: false, message: error.message });
    }
});

batchRouter.get("/deleteUser/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await userModel.findOne({ userId });
        if (!user) {
            return res.status(404).send({ success: false, message: "User not found" });
        }

        await batchModel.updateMany(
            { users: user._id },
            { $pull: { users: user._id } }
        );

        await batchModel.deleteMany({ users: { $size: 0 } });

        await userModel.deleteOne({ _id: user._id });

        res.status(200).send({ success: true, message: "User deleted and batches updated." });
    } catch (error) {
        console.error("Error deleting user:", error.message);
        res.status(500).send({ success: false, message: error.message });
    }
});

batchRouter.get("/refreshAllToken", async (req, res) => {
    try {
        const usersData = await userModel.find({});
        const results = [];

        for (const user of usersData) {
            const { Token, RefreshToken, rendomId, userId, _id } = user;

            try {
                const verifyRes = await axios.post(
                    "https://api.penpencil.co/v3/oauth/verify-token",
                    null,
                    {
                        headers: {
                            accept: "application/json, text/plain, */*",
                            authorization: `Bearer ${Token}`,
                            "client-id": "5eb393ee95fab7468a79d189",
                            "client-type": "WEB",
                            "client-version": "8.8.3",
                            "integration-with": "",
                            "randomid": rendomId,
                            "sec-ch-ua": `\"Chromium\";v=\"136\", \"Google Chrome\";v=\"136\", \"Not.A/Brand\";v=\"99\"`,
                            "sec-ch-ua-mobile": "?0",
                            "sec-ch-ua-platform": `\"Windows\"`,
                            Referer: "https://www.pw.live/",
                            "Referrer-Policy": "strict-origin-when-cross-origin",
                        },
                    }
                );

                if (verifyRes.data?.success === true) {
                    const refreshRes = await axios.post(
                        "https://api.penpencil.co/v3/oauth/refresh-token",
                        { refresh_token: RefreshToken, client_id: "system-admin" },
                        {
                            headers: {
                                Authorization: `Bearer ${Token}`,
                                randomId: rendomId,
                            },
                        }
                    );

                    await userModel.findOneAndUpdate(
                        { userId },
                        {
                            Token: refreshRes.data.data.access_token,
                            RefreshToken: refreshRes.data.data.refresh_token,
                        },
                        { new: true }
                    );

                    console.log(`✅ Refreshed token for ${userId}`);
                    results.push({ userId, status: "updated" });
                }
            } catch (error) {
                console.log(`❌ Invalid or expired token for ${userId}. Deleting user...`);

                await batchModel.updateMany({ users: _id }, { $pull: { users: _id } });
                await batchModel.deleteMany({ users: { $size: 0 } });
                await userModel.deleteOne({ _id });

                results.push({ userId, status: "deleted" });
            }
        }

        return res.status(200).json({
            success: true,
            message: "Processed all users",
            results,
        });

    } catch (error) {
        console.error("❌ Error in /refreshAllToken:", error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});


module.exports = batchRouter;
