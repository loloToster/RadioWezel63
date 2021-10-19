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

router.get("/", async (req, res) => {
    if (!playerSocket) {
        playerKey = generateKey()
        res.render("player", { playerKey: playerKey })
    } else {
        res.status(404).render("error")
    }
})

router.get("/current", async (req, res) => {
    res.json(current)
})

router.get("/song", async (req, res) => {
    let mostPopular = await VoteElement.findOne({}).sort("-votes")
    res.json(mostPopular)
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
                io.emit("updateDuration", current)
            })
        } else {
            socket.disconnect()
        }
    }
})

function onUpdate(arg) {
    current = arg
    /* if (current.video.ytid != arg.video.ytid || current.duration < arg.currentDuration) */
    io.emit("updateDuration", arg)
}


module.exports = router
