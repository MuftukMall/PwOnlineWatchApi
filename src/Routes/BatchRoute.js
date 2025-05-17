const { Router } = require('express');
const batchModel = require('../Models/BatchModel');

const batchRouter = Router();


batchRouter.get("/", (req, res) => {
    try {
        const { name, batchId, token, refreshToken, rendomId } = req.body;

        console.log(req.body);



    } catch (error) {
        res.status(400).send({ sccuess: false, message: error.message })
    }
})



module.exports = batchRouter;