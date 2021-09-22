// git subtree push --prefix server heroku master
require('dotenv').config()

const logger = require("./config/winston-setup")

const express = require("express"),
    app = express(),
    server = require("http").createServer(app),
    io = require("socket.io")(server) // , { cors: { origin: "*" } }

const passport = require("passport"),
    passportSetup = require("./config/passport-setup")

const mongoose = require("mongoose")

const cookieSession = require("cookie-session")

const PLAYER_SECRET = process.env.PLAYER_SECRET
const COOKIE_SECRET = process.env.COOKIE_SECRET
const MONGO_URL = process.env.MONGO_URL

const axios = require("axios").default // ! delete
var startTime = new Date()

app.use(express.static("public"))
app.use(express.urlencoded({ extended: false }))

app.set("view engine", "ejs")
app.set("views", "views")
app.use(cookieSession({
    maxAge: 24 * 60 * 60 * 1000,
    keys: [COOKIE_SECRET]
}))

app.use(passport.initialize())
app.use(passport.session())

app.use(express.json())

app.use("/", require("./routes/root"))
app.use("/auth", require("./routes/auth"))
app.use("/admin", require("./routes/admin"))
app.use("/submit", require("./routes/submit"))
app.use("/player", require("./routes/player"))


app.get("/time", (req, res) => { // ! delete
    res.send(startTime.toISOString())
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

        case "player":
            if (auth.key == PLAYER_SECRET) {
                socket.join("player")
                logger.info("player connected")
                socket.on("update", onUpdate)
            } else {
                socket.disconnect()
            }
            break;

        default:
            break;
    }
})

function onUpdate(arg) {
    if (global.duration.video.ytid != arg.video.ytid || global.duration.currentDuration < arg.currentDuration)
        io.emit("updateDuration", arg)
    global.duration = arg
}

global.io = io
global.logger = logger

mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false })
mongoose.connection.once("open", async () => {
    logger.info("Connected to db")
    const PORT = process.env.PORT || 80
    server.listen(PORT, () => {
        logger.info("Server running on port: " + PORT)
    })
    setInterval(() => {
        console.log("keeping awake")
        axios.get("http://radiowezel.herokuapp.com/time")
    }, 10 * 60 * 1000)
})
