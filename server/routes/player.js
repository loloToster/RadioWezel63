const express = require("express"),
    router = express.Router()

const PLAYER_SECRET = process.env.PLAYER_SECRET

const VoteElement = require("../models/voteElement")

let playerSocket = null
let duration = { current: -1 }

router.get("/", async (req, res) => {
    if (!playerSocket)
        res.render("player")
    else
        res.status(404).render("error")
})

router.get("/duration", async (req, res) => {
    res.json(duration)
})

router.get("/song", async (req, res) => {
    let mostPopular = await VoteElement.findOne({}).sort("-votes")
    res.json(mostPopular)
})

global.io.on("connection", socket => {
    let auth = socket.handshake.auth
    if (auth.role == "player") {
        if (!playerSocket) {
            playerSocket = socket.id
            socket.join("player")
            logger.info("player connected")
            socket.on("update", onUpdate)
            socket.on("disconnect", () => {
                console.log("disconnect")
                playerSocket = null
            })
        } else {
            socket.disconnect()
        }
    }
})

function onUpdate(arg) {
    duration = arg
    if (duration.video.ytid != arg.video.ytid || duration.currentDuration < arg.currentDuration)
        io.emit("updateDuration", arg)
}


module.exports = router
