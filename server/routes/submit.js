const express = require("express"),
    router = express.Router()

const YT_KEYS = process.env.YT_KEYS.split(" ")
const MAX_DURATION = 300

const User = require("./../models/user"),
    Submition = require("./../models/submition")

function checkIfLoggedIn(req, res, next) {
    if (!req.user) res.status(500).send()
    else next()
}

router.use(checkIfLoggedIn)

router.get("/", (req, res) => {
    res.render("submit")
})

async function handleSubmition(video) {
    if (!(await Submition.submitted(video))) {
        await new Submition(video).save()
        global.io.to("admin").emit("addSubmit", video)
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
        await User.updateOne({ googleId: req.user.googleId }, { possibleSubmits: possibleSubmits })
        res.json(videos)
    } else { res.json({ code: "noVideoFound" }) }
})

router.post("/post", async (req, res) => {
    if (User.canSubmit(req.body, req.user)) {
        await User.updateOne({ googleId: req.user.googleId }, { possibleSubmits: [] })
        global.logger.info(`${req.user.googleId} submitted: ${req.body.title} (${req.body.ytid})`)
        res.json(await handleSubmition(req.body))
    } else {
        res.status(405).send()
    }
})

module.exports = router
