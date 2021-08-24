const path = require("path")
require('dotenv').config()

const express = require("express"),
    app = express(),
    server = require("http").createServer(app),
    io = require("socket.io")(server) // , { cors: { origin: "*" } }

const passport = require("passport"),
    googleStrategy = require("passport-google-oauth20")

const mongoose = require("mongoose"),
    User = require(path.join(__dirname, "/models/user-model"))

const cookieSession = require("cookie-session")


passport.serializeUser((user, done) => {
    done(null, user.googleId)
})

passport.deserializeUser(async (id, done) => {
    user = await User.findOne({ googleId: id })
    done(null, user)
})

passport.use(
    new googleStrategy({
        callbackURL: "/redirect",
        clientID: process.env.GOOGLE_AUTH_ID,
        clientSecret: process.env.GOOGLE_AUTH_SECRET
    }, async (accessToken, refreshToken, profile, done) => {
        let currentUser = await User.findOne({ googleId: profile.id })
        if (currentUser) {
            console.log("User is: " + currentUser.name)
            done(null, currentUser)
        } else {
            let newUser = await new User({
                name: profile.displayName,
                googleId: profile.id,
                email: profile._json.email,
                thumbnail: profile._json.picture
            }).save()
            console.log("New user: " + profile.displayName)
            done(null, newUser)
        }
    })
)

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
mongoose.connection.once("open", () => {
    console.log("connected to db")
})

let submitQueue = []
let votingQueue = []

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

app.get("/admin", checkIfLoggedIn, checkIfAdmin, (req, res) => {
    res.render("admin", { submitQueue: submitQueue })
})

app.get("/submit", checkIfLoggedIn, (req, res) => {
    res.render("submit")
})

function addToVoting(video) {
    let voteElement = { votes: 0, video: video }
    votingQueue.push(voteElement)
    io.sockets.emit("updateVotingQueue", voteElement)
}

app.get("/admin/:option/:id", checkIfLoggedIn, checkIfAdmin, (req, res) => {
    let id = decodeURIComponent(req.params.id)
    let index = submitQueue.findIndex(value => {
        return value.id == id
    })
    if (index == -1) return res.status(500).send()
    let video = submitQueue.splice(index, 1)[0]
    switch (req.params.option) {
        case "accept":
            console.log("accepting " + video.id)
            addToVoting(video)
            break;

        case "deny":
            console.log("denying " + video.id)
            break;

        default:
            return res.status(500).send()
    }
    io.to("admin").emit("removeSubmit", video.id)
})

function checkIfSubmitted(video) {
    if ((votingQueue.findIndex(value => {
        return value.video.id == video.id
    }) == -1) && (submitQueue.findIndex(value => {
        return value.id == video.id
    }) == -1)) return false
    return true
}

function handleSubmition(video) {
    let response = {}
    submitQueue.push(video)
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
            return item.duration < MAX_DURATION && !checkIfSubmitted(item)
        })
        if (videos.items.length)
            res.json(videos)
        else
            res.json({ code: "noVideoFound" })
    } else {
        res.json({ code: "noVideoFound" })
    }
})

app.post("/submit/post", (req, res) => { // TODO: validate data & check if submitted
    console.log(req.body)
    res.json(handleSubmition(req.body))
})

app.get("/vote/:id", checkIfLoggedIn, async (req, res) => {
    let id = decodeURIComponent(req.params.id)
    let index = votingQueue.findIndex(value => {
        return id == value.video.id
    })
    if (index == -1) return res.status(500).send()
    let votedVideoId = votingQueue[index].video.id
    //if (req.user.votes.includes(votedVideoId)) return res.status(500).send()
    await User.findOneAndUpdate({ googleId: req.user.googleId }, { $push: { votes: votedVideoId } })
    votingQueue[index].votes++
    res.status(200).send(votingQueue[index].votes.toString())
})


app.use(function (req, res) {
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

server.listen(80, () => {
    console.log("Server running...")
})
