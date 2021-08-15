const { google } = require('googleapis')

const express = require("express")
const app = express()
const server = require("http").createServer(app)
const io = require("socket.io")(server) // , { cors: { origin: "*" } }

const path = require("path")
const iso = require("iso8601-duration")
require('dotenv').config();

const YT_KEYS = process.env.YT_KEYS.split(" ")
const PY_SECRET = process.env.PY_SECRET
const MAX_DURATION = 300

app.use(express.static(path.join(__dirname, "public")))
app.use(express.urlencoded({ extended: false }))

app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))

let submitQueue = []
let votingQueue = []


app.get("/", (req, res) => {
    res.render("index", { votingQueue: votingQueue })
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
    console.log(req.params.option, id)
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

function handleSubmition(video) {
    let response = {}
    if (video.duration > MAX_DURATION) {
        response.code = "toLong"
    }
    else {
        submitQueue.push(video)
        io.to("admin").emit("addSubmit", video)
        response.code = "success"
        response.video = video
    }
    return response
}

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
            res.status(200).send(handleSubmition(video))
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
                res.status(200).send(handleSubmition(video))
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