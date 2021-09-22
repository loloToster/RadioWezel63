const express = require("express"),
    router = express.Router()

const PLAYER_SECRET = process.env.PLAYER_SECRET

const VoteElement = require("../models/voteElement")

router.use((req, res, next) => {
    if (req.get("auth") == PLAYER_SECRET)
        next()
    else
        res.status(404).render('error')
})

router.get("/songs", async (req, res) => {
    res.json(await VoteElement.find({}))
})

router.delete("/remove/:id", async (req, res) => {
    global.logger.info("removing " + req.params.id)
    res.status(200).send()
})

module.exports = router
