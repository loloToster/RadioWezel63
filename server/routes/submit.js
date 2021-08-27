const express = require("express"),
    router = express.Router()

const MAX_DURATION = 300

const Submition = require("./../models/submition"),
    VoteElement = require("./../models/voteElement")

function checkIfLoggedIn(req, res, next) {
    if (!req.user) res.status(500).send()
    else next()
}

router.get("/", checkIfLoggedIn, (req, res) => {
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

router.get("/search/:query", checkIfLoggedIn, async (req, res) => {
    let query = decodeURIComponent(req.params.query)
    let videos = await queryToVideos(query)
    if (videos.code == "success") {
        videos.items = videos.items.filter(item => {
            return item.duration < MAX_DURATION
        })
        if (videos.items.length) {
            for (let i = 0; i < videos.items.length; i++) {
                videos.items[i].submitted = await checkIfSubmitted(videos.items[i])
            }
            res.json(videos)
        } else { res.json({ code: "noVideoFound" }) }
    } else { res.json({ code: "noVideoFound" }) }
})

router.post("/post", checkIfLoggedIn, async (req, res) => { // TODO: validate data & check if submitted
    global.logger.info(`${req.user.googleId} submitted: ${req.body.title} (${req.body.ytid})`)
    res.json(await handleSubmition(req.body))
})

module.exports = router
