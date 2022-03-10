module.exports = io => {
    const express = require("express"),
        router = express.Router()

    const VoteElement = require("./../models/voteElement"),
        KeyValue = require("./../models/keyValue")

    function checkIfLoggedIn(req, res, next) {
        if (!req.user) res.status(403).send()
        else next()
    }

    router.get("/", async (req, res) => {
        // sort by length of votes
        let currentVoteElements = await VoteElement.aggregate([
            { $project: { votes: 1, video: 1, length: { $size: "$votes" } } },
            { $sort: { length: -1 } }
        ])
        res.render("index", {
            votingQueue: currentVoteElements,
            user: req.user,
            blockSubmitting: await KeyValue.get("block-submitting")
        })
    })

    router.put("/vote/:id", checkIfLoggedIn, async (req, res) => {
        let id = decodeURIComponent(req.params.id)
        let votes = await req.user.vote(id)
        if (!votes) return res.status(500).send()
        res.status(200).send(votes.toString())
        io.emit("updateVotes", id, votes)
    })

    router.delete("/vote/:id", checkIfLoggedIn, async (req, res) => {
        let id = decodeURIComponent(req.params.id)
        let votes = await req.user.unvote(id)
        if (votes < 0) return res.status(500).send()
        res.status(200).send(votes.toString())
        io.emit("updateVotes", id, votes)
    })

    return router
}
