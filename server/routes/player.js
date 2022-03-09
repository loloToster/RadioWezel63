module.exports = (io, logger) => {
    const express = require("express"),
        router = express.Router()

    const Submition = require("./../models/submition"),
        VoteElement = require("./../models/voteElement"),
        HistoryElement = require("./../models/history")

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
        if (req.user && req.user.role.level > 1) next()
        else res.status(404).render("error")
    })

    // check if there is no other player connected
    router.use((req, res, next) => {
        if (playerSocket && req.query.key != playerKey) res.status(405).render("player-used")
        else next()
    })

    router.get("/", async (req, res) => {
        playerKey = generateKey()
        res.render("admin", { player: true, submitQueue: await Submition.find({}), user: req.user })
    })

    router.get("/frame", async (req, res) => {
        playerKey = generateKey()
        res.render("player-frame", { playerKey: playerKey })
    })

    router.get("/song", async (req, res) => {
        let mostPopular = await VoteElement.mostPopular()
        logger.info(`${req.user.name}#${req.user.googleId} requested next song: ${mostPopular.video.title}`)
        res.json(mostPopular)
        if (!mostPopular) {
            current = {}
            return
        }
        await mostPopular.delete()
        io.emit("removeVoteElement", mostPopular.video.ytid)
        await HistoryElement.add({ votes: mostPopular.votes, video: mostPopular.video })
    })

    io.on("connection", socket => {
        let auth = socket.handshake.auth
        if (auth.role == "player" && auth.key == playerKey) {
            if (!playerSocket) {
                playerSocket = socket.id
                socket.on("update", onUpdate)
                socket.on("disconnect", () => {
                    playerSocket = null
                    io.emit("updateDuration", { playerConnected: false })
                })
            } else {
                socket.disconnect()
            }
        }
    })

    function onUpdate(arg) {
        arg.playerConnected = true
        if (arg.rewound || // if the video was rewound
            current.paused != arg.paused || // if the video was paused or resumed
            JSON.stringify(current.video) != JSON.stringify(arg.video)) { // if the video is diffrent
            io.emit("updateDuration", arg)
        }
        current = arg
    }

    return router
}
