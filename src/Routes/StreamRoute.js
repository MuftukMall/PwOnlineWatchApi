const { default: axios } = require("axios");
const { Router } = require("express");

const streamRoute = Router();


streamRoute.post("/", async (req, res) => {
    try {
        const { childId, parentId } = req.query;
        const { authorization, randomId } = req.body;
        const url = `https://api.penpencil.co/v1/videos/video-url-details?type=BATCHES&videoContainerType=DASH&reqType=query&childId=${childId}&parentId=${parentId}&clientVersion=201`
        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${authorization}`,
                "client-type": "WEB",
                "client-id": "5eb393ee95fab7468a79d189",
                "randomid": randomId
            }
        })
        const url_master = response.data.data.url.replace("master.mpd", "hls/480/main.m3u8") + response.data.data.signedUrl
        const mainM3u8 = await axios.get(url_master);

        const pattern = /(\d{3,4}\.ts)/g;

        const transformedM3u8 = mainM3u8.data.replace(pattern, (match) => {
            const tsUrl = url_master.replace("main.m3u8", match);
            return tsUrl;

        }).replace(/URI="[^"]*"/, `URI="${url_master.replace("480/main.m3u8", "enc.key")}"`);


        res.send(transformedM3u8)
    } catch (error) {
        res.status(400).send({ success: false, message: error.message })
        console.log(error.message);

    }
})


module.exports = streamRoute