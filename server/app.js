require('dotenv').config()

const express = require("express")
const app = express()
const server = require("http").createServer(app)
const io = require("socket.io")(server) // , { cors: { origin: "*" } }

const passport = require("passport")
const googleStrategy = require("passport-google-oauth20")

const mongoose = require("mongoose")
const cookieSession = require("cookie-session")

const User = require("./models/user-model")

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
            console.log("user is:" + currentUser)
            done(null, currentUser)
        } else {
            let newUser = await new User({
                name: profile.displayName,
                googleId: profile.id,
                email: profile._json.email,
                thumbnail: profile._json.picture
            }).save()
            console.log("New user: " + newUser)
            done(null, newUser)
        }
    })
)

const PY_SECRET = process.env.PY_SECRET
const COOKIE_SECRET = process.env.COOKIE_SECRET
const MONGO_URL = process.env.MONGO_URL
const MAX_DURATION = 300

app.use(express.static("public"))
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

const queryToVideo = require("./modules/query-to-video")

app.get("/submit/:submition", async (req, res) => {
    let submition = decodeURIComponent(req.params.submition)
    let response = await queryToVideo(submition)
    switch (response.code) {
        case "success":
            res.status(200).send(handleSubmition(response.video))
            break;

        case "noVideoFound":
            res.status(200).send({ code: "noVideoFound" })
            break;

        default:
            res.status(500).send()
            break;
    }
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
