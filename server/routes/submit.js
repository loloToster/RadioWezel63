const express = require("express"),
    router = express.Router()

const YT_KEYS = process.env.YT_KEYS.split(" ")
const MAX_DURATION = 300

const User = require("./../models/user"),
    Submition = require("./../models/submition"),
    VoteElement = require("./../models/voteElement")

function checkIfLoggedIn(req, res, next) {
    if (!req.user) res.status(500).send()
    else next()
}

router.use(checkIfLoggedIn)

router.get("/", (req, res) => {
    res.render("submit")
})

async function checkIfSubmitted(video) {
    if ((await Submition.findOne({ ytid: video.ytid })) || (await VoteElement.findOne({ 'video.ytid': video.ytid }))) return true
    return false
}

async function handleSubmition(video) {
    let response = {}
    await new Submition(video).save()
    global.io.to("admin").emit("addSubmit", video)
    response.code = "success"
    response.video = video
    return response
}

const queryToVideos = require("./../modules/query-to-video")

router.get("/search/:query", async (req, res) => {
    let query = decodeURIComponent(req.params.query)
    let videos = await queryToVideos(query, YT_KEYS)
    if (videos.code == "success") {
        videos.items = videos.items.filter(item => {
            return item.duration < MAX_DURATION
        })
        if (videos.items.length) {
            let possibleSubmits = []
            for (let i = 0; i < videos.items.length; i++) {
                let submitted = await checkIfSubmitted(videos.items[i])
                if (!submitted) possibleSubmits.push(videos.items[i])
                videos.items[i].submitted = submitted
            }
            await User.updateOne({ googleId: req.user.googleId }, { possibleSubmits: possibleSubmits })
            res.json(videos)
        } else { res.json({ code: "noVideoFound" }) }
    } else { res.json({ code: "noVideoFound" }) }
})

router.post("/post", async (req, res) => { // ✔️ TODO: validate data & check if submitted
    const inPossibleSumbits = req.user.possibleSubmits.some(obj => obj.ytid === req.body.ytid && obj.title === req.body.title && obj.thumbnail === req.body.thumbnail && obj.duration === req.body.duration)
    if (inPossibleSumbits) {
        await User.updateOne({ googleId: req.user.googleId }, { possibleSubmits: [] })
        global.logger.info(`${req.user.googleId} submitted: ${req.body.title} (${req.body.ytid})`)
        res.json(await handleSubmition(req.body))
    } else {
        res.status(500).send()
    }
})

module.exports = router
