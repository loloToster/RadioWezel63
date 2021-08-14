const { google } = require('googleapis')

const express = require("express")
const app = express()
const server = require("http").createServer(app)
const io = require("socket.io")(server) // , { cors: { origin: "*" } }

const path = require("path")
const iso = require("iso8601-duration")
require('dotenv').config();

const YT_KEYS = process.env.YT_KEYS.split(" ")
const MAX_DURATION = 300

app.use(express.static(path.join(__dirname, "public")))
app.use(express.urlencoded({ extended: false }))

app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))

submitQueue = []

function updateClients(arg) {
    io.sockets.emit("videoUpdate", arg)
}

function updateSubmitQueue(arg) {
    submitQueue.push(arg)
    io.to("admin").emit("updateSubmits", submitQueue)
}

// https://stackoverflow.com/questions/3452546/how-do-i-get-the-youtube-video-id-from-a-url
function youtubeUrlToId(url) {
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/
    var match = url.match(regExp)
    return (match && match[7].length == 11) ? match[7] : false
}

app.get("/", (req, res) => {
    res.render("index")
})

app.get("/admin", (req, res) => {
    res.render("admin", { submitQueue: submitQueue })
})

app.get("/submit", (req, res) => {
    res.render("submit")
})


app.get("/submit/:submition", (req, res) => {
    let submition = req.params.submition
    submition = decodeURIComponent(submition)
    console.log(submition)
    let video = {}
    let id = youtubeUrlToId(submition)
    if (id) {
        google.youtube("v3").videos.list({
            key: YT_KEYS[0],
            part: "snippet,contentDetails",
            id: id
        }).then(response => {
            let data = response.data.items[0]
            video = {
                id: data.id,
                title: data.snippet.title,
                thumbnail: data.snippet.thumbnails.high.url,
                duration: iso.toSeconds(iso.parse(data.contentDetails.duration))
            }
            console.log(video)
            updateSubmitQueue(video)
            res.status(200).send("success")
        }).catch(err => {
            console.log(err)
            res.status(500).send()
        })
    } else {
        google.youtube("v3").search.list({
            key: YT_KEYS[0],
            part: "snippet",
            maxResults: 1,
            type: "video",
            q: submition
        }).then(response => {
            let data = response.data.items[0]
            video.id = data.id.videoId
            video.title = data.snippet.title
            video.thumbnail = data.snippet.thumbnails.high.url
            google.youtube("v3").videos.list({
                key: YT_KEYS[0],
                part: "contentDetails",
                id: video.id
            }).then(response => {
                let data = response.data.items[0]
                video.duration = iso.toSeconds(iso.parse(data.contentDetails.duration))
                console.log(video)
                updateSubmitQueue(video)
                res.status(200).send("success")
            }).catch(err => {
                console.log(err)
                res.status(500).send()
            })
        }).catch(err => {
            console.log(err)
            res.status(500).send()
        })
    }
})


app.use(function (req, res) {
    res.status(404).render('error')
})

io.on("connection", socket => {
    console.log(socket.id + " connected")
    socket.on("joinRoom", room => {
        console.log(room)
        switch (room) {
            case "admin":
                socket.join("admin")
                break;
            default:
                break;
        }
    })
})

io.on("disconnection", socket => {
    console.log(socket.id + " disconnected")
})

server.listen(8080, () => {
    console.log("Server running...")
})