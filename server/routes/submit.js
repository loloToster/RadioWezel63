const express = require("express"),
    router = express.Router()

const YT_KEYS = process.env.YT_KEYS.split(" ")
const MAX_DURATION = 300

const Submition = require("./../models/submition"),
    VoteElement = require("./../models/voteElement"),
    KeyValue = require("./../models/keyValue")

function checkIfLoggedIn(req, res, next) {
    if (!req.user) res.status(500).send()
    else next()
}

router.use(checkIfLoggedIn)

router.get("/", (req, res) => {
    res.render("submit")
})

async function handleSubmition(video, user) {
    if (!(await Submition.submitted(video))) {
        if (user.role == "admin" && await KeyValue.get("self-accept-activated")) {
            global.logger.info(`${user.googleId} self-accepted: ${video.title} (${video.ytid})`)
            global.io.sockets.emit("updateVotingQueue", (await VoteElement.add(video)).video)
        } else {
            global.logger.info(`${user.googleId} submitted: ${video.title} (${video.ytid})`)
            await Submition.add(video)
            global.io.to("admin").emit("addSubmit", video)
        }
    }
    return video
}

const queryToVideos = require("./../modules/query-to-video")

router.get("/search/:query", async (req, res) => {
    let query = decodeURIComponent(req.params.query)
    let videos = await queryToVideos(query, YT_KEYS)
    if (videos.code == "success") {
        let possibleSubmits = []
        for (let i = 0; i < videos.items.length; i++) {
            let submitted = await Submition.submitted(videos.items[i])
            let toLong = videos.items[i].duration > MAX_DURATION
            if (!submitted && !toLong) possibleSubmits.push(JSON.stringify(videos.items[i]))
            videos.items[i].submitted = submitted
            videos.items[i].toLong = toLong
        }
        await req.user.setPossibleSubmits(possibleSubmits)
        res.json(videos)
    } else { res.json({ code: "noVideoFound" }) }
})

router.post("/post", async (req, res) => {
    if (req.user.canSubmit(req.body)) {
        await req.user.setPossibleSubmits([])
        res.json(await handleSubmition(req.body, req.user))
    } else {
        res.status(405).send()
    }
})

module.exports = router
