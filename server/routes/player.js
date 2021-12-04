const express = require("express"),
    router = express.Router()

const Submition = require("./../models/submition"),
    VoteElement = require("./../models/voteElement")

//https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
function generateKey(length = 5) {
    const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let result = ""
    for (let i = 0; i < length; i++)
        result += CHARS.charAt(Math.floor(Math.random() * CHARS.length))
    return result
}

let playerSocket = null
let playerKey = generateKey()
let current = {}

router.get("/current", async (req, res) => {
    current.playerConnected = Boolean(playerSocket)
    res.json(current)
})

// check if user is admin
router.use((req, res, next) => {
    if (!req.user || !(req.user.role == "admin")) res.status(404).render("error")
    else next()
})

// check if there is no other player connected
router.use((req, res, next) => {
    if (playerSocket && req.query.key != playerKey) res.status(405).render("player-used")
    else next()
})

router.get("/", async (req, res) => {
    playerKey = generateKey()
    res.render("player", { playerKey: playerKey, submitQueue: await Submition.find({}) })
})

router.get("/song", async (req, res) => {
    let mostPopular = await VoteElement.mostPopular()
    res.json(mostPopular)
    if (!mostPopular) return
    await mostPopular.delete()
    global.io.emit("removeVoteElement", mostPopular.video.ytid)
})

global.io.on("connection", socket => {
    let auth = socket.handshake.auth
    if (auth.role == "player" && auth.key == playerKey) {
        if (!playerSocket) {
            playerSocket = socket.id
            logger.info(`player with id ${socket.id} connected with key: ${auth.key}`)
            socket.on("update", onUpdate)
            socket.on("disconnect", () => {
                logger.info(`player with id ${socket.id} disconnected`)
                playerSocket = null
                global.io.emit("updateDuration", { playerConnected: false })
            })
        } else {
            socket.disconnect()
        }
    }
})

function onUpdate(arg) {
    arg.playerConnected = true
    if (((!current.video != !arg.video) || // if the video is no longer null
        current.video?.ytid != arg.video?.ytid || // if the video is diffrent
        (arg.rewound) || // if the video was rewound
        current.paused != arg.paused) // if the video was paused or resumed
        && arg.video) { // if there is video
        global.io.emit("updateDuration", arg)
    }
    current = arg
}


module.exports = router
