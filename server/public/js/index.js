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

let submitionImg = document.querySelector("#addSongButton img")
if (submitionImg) {
    submitionImg.addEventListener("click", () => {
        submitionImg.classList.add("clicked")
    })
}

let submitionBtn = document.getElementById("addSongButton")
document.body.addEventListener("touchstart", () => {
    submitionBtn.style.opacity = 0.2
}, true)

document.body.addEventListener("touchend", () => {
    submitionBtn.style.opacity = 1
}, true)

Array.from(document.getElementsByClassName("upvote")).forEach(element => {
    if (!element.dataset.voted)
        element.addEventListener("click", () => onVote(element.dataset.videoid))
})

const songTemplate = document.getElementById("songTemplate")
songTemplate.removeAttribute("id")

function createSongObject(video) {
    let clone = songTemplate.cloneNode(true)
    clone.querySelector(".songIcon").style.backgroundImage = `url('${video.thumbnail}')`
    let a = clone.querySelector(".title a")
    a.innerText = htmlDecode(video.title)
    a.href = DEF_YT_URL + video.ytid
    let upvote = clone.querySelector(".upvote")
    if (loggedIn) {
        upvote.dataset.videoid = video.ytid
        upvote.addEventListener("click", () => onVote(video.ytid))
    } else {
        upvote.dataset.voted = "true"
        upvote.innerText = 0
    }
    return clone
}

async function onVote(id) {
    id = encodeURIComponent(id)
    let res = await fetch("/vote/" + id)
    let data = await res.text()
    console.log(data)
    let button = document.querySelector(`[data-videoid='${id}']`)
    button.dataset.voted = "true"
    button.innerText = data
    let clone = button.cloneNode(true)
    button.parentNode.replaceChild(clone, button)
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

socket.on("removeVoteElement", (id) => {
    document.querySelector(`[data-videoid='${id}']`).closest(".song").remove()
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
    document.getElementById("thumbnail").src = cur.video.thumbnail
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
    progressBar.style.background = `linear-gradient(to right, var(--duration-color) 0%, var(--duration-color) ${percentage}%, var(--white) ${percentage}%, var(--white) 100%)`
}

var currentTimer = null

socket.on("updateDuration", arg => {
    current = arg
    if (!arg.video) return
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
