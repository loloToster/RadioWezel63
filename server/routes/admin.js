const express = require("express"),
    router = express.Router()

const User = require("./../models/user"),
    Submition = require("./../models/submition"),
    VoteElement = require("./../models/voteElement")

const Genius = require("genius-lyrics"),
    lyricsClient = new Genius.Client()

router.use((req, res, next) => {
    if (!req.user || !(req.user.role == "admin")) res.status(500).send()
    else next()
})

router.get("/", async (req, res) => {
    res.render("admin", { submitQueue: await Submition.find({}) })
})

async function addToVoting(video) {
    let element = {
        votes: 0, video: {
            ytid: video.ytid,
            title: video.title,
            thumbnail: video.thumbnail,
            duration: video.duration
        }
    }
    await new VoteElement(element).save()
    global.io.sockets.emit("updateVotingQueue", element)
}

router.put("/verdict", async (req, res) => {
    let id = req.body.id
    let video = await Submition.findOneAndDelete({ ytid: id })
    if (!video) return res.status(500).send()
    switch (req.body.option) {
        case "accept":
            global.logger.info(`${req.user.name}#${req.user.googleId} accepted: ${video.title} (${video.ytid})`)
            await addToVoting(video)
            break;

        case "deny":
            global.logger.info(`${req.user.name}#${req.user.googleId} denied: ${video.title} (${video.ytid})`)
            break;

        default:
            return res.status(500).send()
    }
    global.io.to("admin").emit("removeSubmit", video.ytid)
})

function clearTitle(title) {
    let list = ["official video", "official lyric video", "official music video"]
    title = title.toLowerCase()
    title = title.replace(/\(.*\)/, "")
    list.forEach(element => {
        title = title.replace(element, "")
    });
    return title
}

router.get("/lyrics/:title", async (req, res) => {
    let title = clearTitle(decodeURIComponent(req.params.title))
    console.log("requesting lyrics for:", title)
    try {
        let searches = await lyricsClient.songs.search(title)
        let topSong = searches[0]
        res.send(await topSong.lyrics())
    } catch (error) {
        res.send("Nie znalazłem takiej piosenki")
    }
})

router.get("/reset", async (req, res) => {
    global.logger.info(`${req.user.name}#${req.user.googleId} reseted data`)
    await User.updateMany({}, { votes: [] })
    await Submition.deleteMany({})
    await VoteElement.deleteMany({})
    res.json({ code: "success" })
})

module.exports = router
