const express = require("express"),
    router = express.Router()

const VoteElement = require("./../models/voteElement"),
    User = require("./../models/user")


function checkIfLoggedIn(req, res, next) {
    if (!req.user) res.status(500).send()
    else next()
}

router.get("/", async (req, res) => {
    res.render("index", {
        votingQueue: await VoteElement.find({}),
        user: req.user
    })
})

router.get("/vote/:id", checkIfLoggedIn, async (req, res) => {
    let id = decodeURIComponent(req.params.id)
    if (req.user.votes.includes(id)) return res.status(500).send()
    let votes = await User.vote(id, req.user.googleId)
    if (!votes) return res.status(500).send()
    res.status(200).send(votes.toString())
    global.io.emit("updateVotes", id, votes)
})

module.exports = router
