const express = require("express"),
    router = express.Router()

const VoteElement = require("../models/voteElement")

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
let current = { duration: -1 }

router.get("/current", async (req, res) => {
    res.json(current)
})

// check if user is admin
router.use((req, res, next) => {
    if (!req.user || !(req.user.role == "admin")) res.status(404).render("error")
    else next()
})

// check if there is no other player connected
router.use((req, res, next) => {
    if (playerSocket && req.query.key != playerKey) res.status(404).render("error")
    else next()
})

router.get("/", async (req, res) => {
    if (!playerSocket) {
        playerKey = generateKey()
        res.render("player", { playerKey: playerKey })
    } else {
        res.status(404).render("error")
    }
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
                current = { duration: -1 }
                global.io.emit("updateDuration", current)
            })
        } else {
            socket.disconnect()
        }
    }
})

function onUpdate(arg) {
    if ((!current.video != !arg.video) || // if the video is no longer null
        current.video?.ytid != arg.video?.ytid || // if the video is diffrent
        current.duration > arg.duration || // if the video was rewound backwards
        current.duration + 5 < arg.duration || // if the video was rewound forwards at least 5 sec
        current.paused != arg.paused) { // if the video was paused or resumed
        global.io.emit("updateDuration", arg)
    }
    current = arg
}


module.exports = router
