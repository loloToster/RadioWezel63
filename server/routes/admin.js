const express = require("express"),
    router = express.Router()

const Submition = require("./../models/submition"),
    VoteElement = require("./../models/voteElement")

const lyricsClient = require("lyrics-finder")

router.use((req, res, next) => {
    if (!req.user || !(req.user.role == "admin")) res.status(404).render("error")
    else next()
})

router.get("/", async (req, res) => {
    res.render("admin", { submitQueue: await Submition.find({}) })
})

router.put("/verdict", async (req, res) => {
    let id = req.body.id
    let video = await Submition.findOneAndDelete({ ytid: id })
    if (!video) return res.status(500).send()
    switch (req.body.option) {
        case "accept":
            global.logger.info(`${req.user.name}#${req.user.googleId} accepted: ${video.title} (${video.ytid})`)
            global.io.sockets.emit("updateVotingQueue", (await VoteElement.add(video)).video)
            break

        case "deny":
            global.logger.info(`${req.user.name}#${req.user.googleId} denied: ${video.title} (${video.ytid})`)
            break

        default:
            return res.status(500).send()
    }
    global.io.to("admin").emit("removeSubmit", video.ytid)
})

function clearTitle(title) {
    const list = ["official", "official video", "official lyric video", "official music video"]
    title = title.toLowerCase()
    title = title.replace(/\(.*\)|\[.*\]/g, "")
    list.forEach(element => {
        title = title.replace(element, "")
    })
    title = title.trim()
    return title
}

router.get("/lyrics/:title", async (req, res) => {
    let title = clearTitle(decodeURIComponent(req.params.title))
    console.log("requesting lyrics for:", title)
    res.send(await lyricsClient(title) || "Nie znalazłem takiej piosenki")
})

router.delete("/voteelement/:id", async (req, res) => {
    res.send()
    let id = decodeURIComponent(req.params.id)
    global.logger.info(`${req.user.name}#${req.user.googleId} deleted: ${id}`)
    let dbRes = await VoteElement.deleteOne({ "video.ytid": id })
    if (!dbRes.deletedCount) return
    global.io.emit("removeVoteElement", id)
})

router.get("/reset", async (req, res) => {
    global.logger.info(`${req.user.name}#${req.user.googleId} reseted data`)
    await Submition.deleteMany({})
    await VoteElement.deleteMany({})
    res.json({ code: "success" })
})

global.io.on("connection", socket => {
    let auth = socket.handshake.auth
    if (auth.role == "admin")
        socket.join("admin")
})

module.exports = router
