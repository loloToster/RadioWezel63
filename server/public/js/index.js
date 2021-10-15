const DEF_YT_URL = "https://www.youtube.com/watch?v="

function htmlDecode(input) {
    var doc = new DOMParser().parseFromString(input, "text/html");
    return doc.documentElement.textContent;
}

let current
const socket = io()

socket.on("connect", () => {
    console.log("connected")
})

let addSong = document.getElementById("plus")
if (addSong) {
    addSong.addEventListener("click", () => {
        addSong.setAttribute("class", "clicked")
    })
}

Array.from(document.getElementsByClassName("upvote")).forEach(element => {
    if (!element.dataset.voted)
        element.addEventListener("click", event => onVote(element.dataset.videoid))
})


/* function createSongObject(video) {
    let object = document.createElement("div")
    object.setAttribute("class", "song")

    let title = document.createElement("div")
    title.setAttribute("class", "title")

    let href = document.createElement("a")
    href.setAttribute("href", DEF_YT_URL + video.ytid)
    href.setAttribute("target", "_blank")
    href.innerText = htmlDecode(video.title)

    title.appendChild(href)
    object.appendChild(title)

    let upvote = document.createElement("td")
    upvote.setAttribute("class", "upvote")
    upvote.setAttribute("data-videoid", video.ytid)
    upvote.innerText = "\u25b2"
    upvote.addEventListener("click", event => onVote(video.ytid))
    object.appendChild(upvote)

    return object
} */

const songTemplate = document.getElementById("songTemplate")
songTemplate.removeAttribute("id")

function createSongObject(video) {
    let clone = songTemplate.cloneNode(true)
    let a = clone.querySelector(".title a")
    a.innerText = htmlDecode(video.title)
    a.setAttribute("href", DEF_YT_URL + video.ytid)
    let upvote = clone.querySelector(".upvote")
    upvote.setAttribute("data-videoid", video.ytid)
    upvote.addEventListener("click", event => onVote(video.ytid))
    return clone
}

function onVote(id) {
    id = encodeURIComponent(id)
    fetch("/vote/" + id)
        .then(response => response.text())
        .then(data => {
            console.log(data)
            let button = document.querySelector(`[data-videoid='${id}']`)
            button.dataset.voted = "true"
            button.innerText = data
            let clone = button.cloneNode(true)
            button.parentNode.replaceChild(clone, button)
        })
}

socket.on("updateVotingQueue", voteElement => {
    console.log(voteElement)
    console.log(voteElement.video.ytid)
    document.getElementById("songContainer").appendChild(createSongObject(voteElement.video))
})

socket.on("updateVotes", (id, votes) => {
    console.log(`${id}: ${votes}`)
    let button = document.querySelector(`[data-videoid='${id}']`)
    if (!button.dataset.voted) return
    button.innerText = votes
})

function zeroFill(number, width = 2) {
    width -= number.toString().length
    if (width > 0)
        return new Array(width + (/\./.test(number) ? 2 : 1)).join('0') + number
    return number + ""
}

function drawCurrent(cur) {
    console.log("updating")
    if (cur.duration == -1) {
        document.getElementById("currentWrapper").style.display = "none"
        return
    } else {
        document.getElementById("currentWrapper").style.display = "block"
    }
    document.getElementById("thumbnail").setAttribute("src", cur.video.thumbnail)
    let progressBar = document.querySelector("input")
    let left = document.getElementById("left")
    let right = document.getElementById("right")
    let duration = cur.video.duration
    let minutes = Math.floor(duration / 60)
    let seconds = duration - minutes * 60
    right.innerText = `${zeroFill(minutes)}:${zeroFill(seconds)}`
    let currentDuration = cur.duration
    minutes = Math.floor(currentDuration / 60)
    seconds = currentDuration - minutes * 60
    left.innerText = `${zeroFill(minutes)}:${zeroFill(seconds)}`
    let percentage = (currentDuration / duration) * 100
    progressBar.value = percentage
    progressBar.style.background = `linear-gradient(to right, #01be97 0%, #01be97 ${percentage}%, #d4d4d4 ${percentage}%, #d4d4d4 100%)`
}

var currentTimer = null

socket.on("updateDuration", arg => {
    current = arg
    drawCurrent(arg)
})

/* function updateCurrent() {
    if (currentTimer) clearTimeout(currentTimer)
    drawCurrent(current)
    if (current.duration > current.video.duration) {
        current.duration = -1
        drawCurrent(current)
        return
    }
    current.duration++
    currentTimer = setTimeout(updateCurrent, 1000)
}

fetch("/player/current").then(res => res.json()).then(data => {
    current = data
    updateCurrent()
}) */
