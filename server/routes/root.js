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
        user: req.user,
        currentDuration: global.duration ? JSON.stringify(global.duration) : '{"currentDuration":-1}'
    })
})

router.get("/vote/:id", checkIfLoggedIn, async (req, res) => {
    let id = decodeURIComponent(req.params.id)
    if (req.user.votes.includes(id)) return res.status(500).send()
    let element = await VoteElement.findOneAndUpdate({ 'video.ytid': id }, { $inc: { votes: 1 } })
    console.log(element)
    if (!element) return res.status(500).send()
    await User.findOneAndUpdate({ googleId: req.user.googleId }, { $push: { votes: id } })
    let votes = element.votes + 1
    res.status(200).send(votes.toString())
    global.io.emit("updateVotes", id, votes)
})

module.exports = router
