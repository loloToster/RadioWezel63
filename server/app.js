// git subtree push --prefix server heroku master
const path = require("path")
require('dotenv').config()

const logger = require(path.join(__dirname, "/config/winston-setup"))

const express = require("express"),
    app = express(),
    server = require("http").createServer(app),
    io = require("socket.io")(server) // , { cors: { origin: "*" } }

const passport = require("passport"),
    passportSetup = require(path.join(__dirname, "/config/passport-setup"))

const mongoose = require("mongoose"),
    User = require(path.join(__dirname, "/models/user-model")),
    Submition = require(path.join(__dirname, "/models/submition-model")),
    voteElement = require(path.join(__dirname, "/models/voteElement-model"))

const cookieSession = require("cookie-session")

const PY_SECRET = process.env.PY_SECRET
const COOKIE_SECRET = process.env.COOKIE_SECRET
const MONGO_URL = process.env.MONGO_URL
const MAX_DURATION = 300

app.use(express.static(path.join(__dirname, "public")))
app.use(express.urlencoded({ extended: false }))

app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))
app.use(cookieSession({
    maxAge: 24 * 60 * 60 * 1000,
    keys: [COOKIE_SECRET]
}))

app.use(passport.initialize())
app.use(passport.session())

app.use(express.json());

mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false })
mongoose.connection.once("open", async () => {
    logger.info("Connected to db")
    await User.updateMany({}, { votes: [] })
    logger.info("Cleared votes")
})

//var submitQueue = []
var votingQueue = []

function checkIfLoggedIn(req, res, next) {
    if (!req.user) res.status(500).send()
    else next()
}

function checkIfAdmin(req, res, next) {
    if (req.user.role == "admin") next()
    else res.status(500).send()
}

app.get("/", (req, res) => {
    res.render("index", { votingQueue: votingQueue, user: req.user })
})

app.get("/profile", checkIfLoggedIn, (req, res) => {
    res.render("profile", { user: req.user })
})

app.get("/login", passport.authenticate("google", {
    scope: ["profile", "email"]
}))

app.get("/logout", (req, res) => {
    req.logout()
    res.redirect("/")
})

app.get("/redirect", passport.authenticate("google"), (req, res) => {
    res.redirect("/")
})

app.get("/admin", checkIfLoggedIn, checkIfAdmin, async (req, res) => {
    let submitions = await Submition.find({})
    res.render("admin", { submitQueue: submitions })
})

app.get("/submit", checkIfLoggedIn, (req, res) => {
    res.render("submit")
})

function addToVoting(video) {
    let voteElement = { votes: 0, video: video }
    votingQueue.push(voteElement)
    io.sockets.emit("updateVotingQueue", voteElement)
}

app.get("/admin/:option/:id", checkIfLoggedIn, checkIfAdmin, async (req, res) => {
    let id = decodeURIComponent(req.params.id)
    let video = await Submition.findOneAndDelete({ ytid: id })
    if (!video) return res.status(500).send()
    switch (req.params.option) {
        case "accept":
            logger.info(`${req.user.name}#${req.user.googleId} accepted: ${video.title} (${video.ytid})`)
            addToVoting(video)
            break;

        case "deny":
            logger.info(`${req.user.name}#${req.user.googleId} denied: ${video.title} (${video.ytid})`)
            break;

        default:
            return res.status(500).send()
    }
    io.to("admin").emit("removeSubmit", video.ytid)
})

async function checkIfSubmitted(video) {
    let submitions = await Submition.find({})
    if ((votingQueue.findIndex(value => {
        return value.video.ytid == video.ytid
    }) == -1) && (submitions.findIndex(value => {
        return value.ytid == video.ytid
    }) == -1)) return false
    return true
}

async function handleSubmition(video) {
    let response = {}
    // submitQueue.push(video) // delete
    await new Submition(video).save()
    io.to("admin").emit("addSubmit", video)
    response.code = "success"
    response.video = video
    return response
}

const queryToVideos = require("./modules/query-to-video")

app.get("/submit/search/:query", checkIfLoggedIn, async (req, res) => {
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

app.post("/submit/post", async (req, res) => { // TODO: validate data & check if submitted
    logger.info(`${req.user.googleId} submitted: ${req.body.title} (${req.body.ytid})`)
    res.json(await handleSubmition(req.body))
})

app.get("/vote/:id", checkIfLoggedIn, async (req, res) => {
    let id = decodeURIComponent(req.params.id)
    let index = votingQueue.findIndex(value => {
        return id == value.video.ytid
    })
    if (index == -1) return res.status(500).send()
    let votedVideoId = votingQueue[index].video.ytid
    if (req.user.votes.includes(votedVideoId)) return res.status(500).send()
    await User.findOneAndUpdate({ googleId: req.user.googleId }, { $push: { votes: votedVideoId } })
    votingQueue[index].votes++
    res.status(200).send(votingQueue[index].votes.toString())
    io.emit("updateVotes", votedVideoId, votingQueue[index].votes)
})


app.use((req, res) => {
    res.status(404).render('error')
})

io.on("connection", socket => {
    console.log(socket.id + " connected")
    let auth = socket.handshake.auth
    switch (auth.role) {
        case "admin":
            socket.join("admin")
            break;

        case "python":
            if (auth.key == PY_SECRET)
                socket.join("python")
            break;

        default:
            break;
    }
})

io.on("disconnection", socket => {
    console.log(socket.id + " disconnected")
})

const PORT = process.env.PORT || 80
server.listen(PORT, () => {
    logger.info("Server running on port: " + PORT)
})
