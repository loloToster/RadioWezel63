// git subtree push --prefix server heroku master
require("dotenv").config()

const logger = require("./config/winston-setup")

const express = require("express"),
    app = express(),
    server = require("http").createServer(app),
    io = require("socket.io")(server) // , { cors: { origin: "*" } }

global.io = io
global.logger = logger

const passport = require("passport")
require("./config/passport-setup")

const mongoose = require("mongoose")

const cookieSession = require("cookie-session")

const COOKIE_SECRET = process.env.COOKIE_SECRET
const MONGO_URL = process.env.MONGO_URL


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

app.use((req, res) => {
    res.status(404).render("error")
})

io.on("connection", socket => {
    // console.log(socket.id + " connected")
})

const keep_awake = require("./modules/keep-heroku-awake")

mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false })
mongoose.connection.once("open", async () => {
    logger.info("Connected to db")
    const PORT = process.env.PORT || 80
    server.listen(PORT, () => {
        logger.info("Server running on port: " + PORT)
        keep_awake.start()
    })
})
