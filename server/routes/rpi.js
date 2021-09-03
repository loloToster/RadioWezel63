const express = require("express"),
    router = express.Router()

const RPI_SECRET = process.env.RPI_SECRET

const VoteElement = require("./../models/voteElement")

router.use((req, res, next) => {
    if (req.get("auth") == RPI_SECRET)
        next()
    else
        res.status(404).render('error')
})

router.get("/songs", async (req, res) => {
    res.json(await VoteElement.find({}))
})

module.exports = router
