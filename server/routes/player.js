const express = require("express"),
    router = express.Router()

const PLAYER_SECRET = process.env.PLAYER_SECRET

const VoteElement = require("../models/voteElement")

let playerSocket = null
let current = { duration: -1 }

router.get("/", async (req, res) => {
    if (!playerSocket)
        res.render("player")
    else
        res.status(404).render("error")
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
    if (auth.role == "player") {
        if (!playerSocket) {
            playerSocket = socket.id
            socket.join("player")
            logger.info("player connected")
            socket.on("update", onUpdate)
            socket.on("disconnect", () => {
                console.log("disconnect")
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
    /* if (current.video.ytid != arg.video.ytid || current.duration < arg.currentDuration)*/
    io.emit("updateDuration", arg)
}


module.exports = router
