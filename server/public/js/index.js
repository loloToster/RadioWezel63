const DEF_YT_URL = "https://www.youtube.com/watch?v="

function htmlDecode(input) {
    var doc = new DOMParser().parseFromString(input, "text/html")
    return doc.documentElement.textContent
}

String.prototype.customTrim = function (chars = " \n\t") {
    let newString = this
    while (chars.includes(newString.charAt(0))) {
        newString = newString.substring(1)
        if (!newString) break
    }
    while (chars.includes(newString.charAt(newString.length - 1))) {
        newString = newString.substring(0, newString.length - 1)
        if (!newString) break
    }
    return newString
}

function formatTitle(title, creator) {
    let remix = title.toLowerCase().includes("remix")
    return title.replace(creator, "").replace(/\(.*\)|\[.*\]/, "").customTrim(" \n\t-,_") + (remix ? " (Remix)" : "")
}       // remove creator name | then remove any thing between parenthesis | then remove unnecessary chars | if there was 'remix' in title add '(Remix)'

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
    let a = clone.querySelector(".title")
    a.innerText = formatTitle(htmlDecode(video.title), video.creator)
    a.href = DEF_YT_URL + video.ytid
    let creator = clone.querySelector(".creator")
    creator.innerText = video.creator
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
    let button = document.querySelector(`[data-videoid='${id}']`)
    button.dataset.voted = "true"
    button.innerText = data
    let clone = button.cloneNode(true)
    button.parentNode.replaceChild(clone, button)
}

socket.on("updateVotingQueue", video => {
    document.getElementById("songContainer").appendChild(createSongObject(video))
})

socket.on("updateVotes", (id, votes) => {
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
        return new Array(width + (/\./.test(number) ? 2 : 1)).join("0") + number
    return number + ""
}

let currentTimeout

function drawCurrent(cur) {
    clearTimeout(currentTimeout)
    if (cur.duration == -1) {
        document.getElementById("thumbnail").src = "/images/sleep-note.png"
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
    if (cur.paused) return
    cur.duration++
    currentTimeout = setTimeout(drawCurrent, 1000, cur)
}

socket.on("updateDuration", arg => {
    current = arg
    drawCurrent(arg)
})

fetch("/player/current").then(async (data) => {
    let cur = await data.json()
    let thumbnail = document.getElementById("thumbnail")
    thumbnail.src = ""
    thumbnail.classList.remove("loading")
    drawCurrent(cur)
})

let creators = document.getElementsByClassName("creator")
Array.from(document.getElementsByClassName("title")).forEach((e, i) => e.innerText = formatTitle(e.innerText, creators[i].innerText))
