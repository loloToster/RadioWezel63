require('dotenv').config()
const { google } = require('googleapis')

const express = require("express")
const app = express()
const server = require("http").createServer(app)
const io = require("socket.io")(server) // , { cors: { origin: "*" } }

const path = require("path")
const iso = require("iso8601-duration")

const passport = require("passport")
const passportSetup = require("./config/passport-setup")
const mongoose = require("mongoose")
const cookieSession = require("cookie-session")

const YT_KEYS = process.env.YT_KEYS.split(" ")
const PY_SECRET = process.env.PY_SECRET
const COOKIE_SECRET = process.env.COOKIE_SECRET
const MONGO_URL = process.env.MONGO_URL
const MAX_DURATION = 300

app.use(express.static(path.join(__dirname, "public")))
app.use(express.urlencoded({ extended: false }))

app.set("view engine", "ejs")
//app.set("views", path.join(__dirname, "views"))
app.use(cookieSession({
    maxAge: 24 * 60 * 60 * 1000,
    keys: [COOKIE_SECRET]
}))

app.use(passport.initialize())
app.use(passport.session())

mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false })
mongoose.connection.once("open", () => {
    console.log("connected to db")
})

let submitQueue = []
let votingQueue = []


app.get("/", (req, res) => {
    res.render("index", { votingQueue: votingQueue, user: req.user })
})

app.get("/profile", (req, res) => {
    if (!req.user) res.redirect("/login")
    else res.render("profile", { user: req.user })
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

app.get("/admin", (req, res) => {
    res.render("admin", { submitQueue: submitQueue })
})

app.get("/submit", (req, res) => {
    res.render("submit")
})

// https://stackoverflow.com/questions/3452546/how-do-i-get-the-youtube-video-id-from-a-url
function youtubeUrlToId(url) {
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/
    var match = url.match(regExp)
    return (match && match[7].length == 11) ? match[7] : false
}

function addToVoting(video) {
    let voteElement = { votes: 0, video: video }
    votingQueue.push(voteElement)
    io.sockets.emit("updateVotingQueue", voteElement)
}

app.get("/admin/:option/:id", (req, res) => {
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
    if (video.duration > MAX_DURATION) {
        response.code = "toLong"
    } else if (checkIfSubmitted(video)) {
        response.code = "alreadySubmitted"
        response.video = video
    } else {
        submitQueue.push(video)
        io.to("admin").emit("addSubmit", video)
        response.code = "success"
        response.video = video
    }
    return response
}

app.get("/submit/:submition", async (req, res) => {
    let submition = decodeURIComponent(req.params.submition)
    let video = {}
    let id = youtubeUrlToId(submition)
    if (id) {
        let response
        try {
            response = await google.youtube("v3").videos.list({
                key: YT_KEYS[0],
                part: "snippet,contentDetails",
                id: id
            })
        } catch (err) {
            console.error(err)
            res.status(500).send()
            return
        }
        let data = response.data.items[0]
        if (!data) {
            console.log("noVideoFound")
            res.status(200).send({ code: "noVideoFound" })
            return
        }
        video = {
            id: data.id,
            title: data.snippet.title,
            thumbnail: data.snippet.thumbnails.high.url,
            duration: iso.toSeconds(iso.parse(data.contentDetails.duration))
        }
    } else {
        let response
        try {
            response = await google.youtube("v3").search.list({
                key: YT_KEYS[0],
                part: "snippet",
                maxResults: 1,
                type: "video",
                q: submition
            })
        } catch (err) {
            console.error(err)
            res.status(500).send()
            return
        }
        let data = response.data.items[0]
        if (!data) {
            console.log("noVideoFound")
            res.status(200).send({ code: "noVideoFound" })
            return
        }
        video.id = data.id.videoId
        video.title = data.snippet.title
        video.thumbnail = data.snippet.thumbnails.high.url
        response = await google.youtube("v3").videos.list({
            key: YT_KEYS[0],
            part: "contentDetails",
            id: video.id
        })
        data = response.data.items[0]
        video.duration = iso.toSeconds(iso.parse(data.contentDetails.duration))
    }
    res.status(200).send(handleSubmition(video))
})

app.get("/vote/:id", (req, res) => {
    let id = decodeURIComponent(req.params.id)
    let index = votingQueue.findIndex(value => {
        return id == value.video.id
    })
    votingQueue[index].votes++
    let votes = votingQueue[index].votes
    res.status(200).send(votes.toString())
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

server.listen(8080, () => {
    console.log("Server running...")
})
