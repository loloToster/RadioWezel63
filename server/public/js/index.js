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
    return title.replace(creator, "").replace(/\(.*\)|\[.*\]/, "").customTrim(" \n\t-,_|") + (remix ? " (Remix)" : "")
}       // remove creator name | then remove any thing between parenthesis | then remove unnecessary chars | if there was 'remix' in title add '(Remix)'

const socket = io()

socket.on("connect", () => {
    console.log("connected")
})

if (loggedIn) {
    let submitionImg = document.querySelector("#addSongButton img")
    if (submitionImg) {
        submitionImg.addEventListener("click", () => {
            submitionImg.classList.add("clicked")
        })

        let submitionBtn = document.getElementById("addSongButton")
        document.body.addEventListener("touchstart", () => {
            submitionBtn.style.opacity = 0.2
        }, true)

        document.body.addEventListener("touchend", () => {
            submitionBtn.style.opacity = 1
        }, true)
    }

    Array.from(document.getElementsByClassName("upvote"))
        .forEach(element => {
            let voteFunc = element.dataset.voted ? onUnvote : onVote
            element.addEventListener("click", () => voteFunc(element.dataset.videoid))
        })
}

const songTemplate = document.getElementById("songTemplate"),
    voteTemplate = songTemplate.getElementsByClassName("upvote")[0]
songTemplate.removeAttribute("id")

function createSongObject(video) {
    let clone = songTemplate.cloneNode(true)
    let songIcon = clone.querySelector(".songIcon")
    songIcon.style.setProperty("--image", `url('${video.thumbnail}')`)
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

    // hold helpers
    songIcon.addEventListener("mousedown", mouseDownHoldHelper)
    songIcon.addEventListener("touchstart", mouseDownHoldHelper)
    songIcon.addEventListener("click", () => {
        if (songContainer.classList.contains("deleteMode"))
            onDeleteClick(clone)
    })

    return clone
}

async function onVote(id) {
    let button = document.querySelector(`[data-videoid='${id}']`)
    button.dataset.voted = "true"
    let clone = button.cloneNode(true)
    button.parentNode.replaceChild(clone, button)
    id = encodeURIComponent(id)
    let res = await fetch("/vote/" + id, { method: "PUT" })
    let data = await res.text()
    clone.innerText = data
    clone.addEventListener("click", () => onUnvote(id))
}

async function onUnvote(id) {
    let button = document.querySelector(`[data-videoid='${id}']`)
    let clone = voteTemplate.cloneNode(true)
    clone.dataset.videoid = id
    delete button.dataset.voted
    button.parentNode.replaceChild(clone, button)
    id = encodeURIComponent(id)
    let res = await fetch("/vote/" + id, { method: "DELETE" })
    let data = await res.text()
    let voteNum = document.querySelector(`[data-videoid='${id}'] .voteNum`)
    voteNum.innerText = data
    clone.addEventListener("click", () => onVote(id))
}

let songContainer = document.getElementById("songContainer")
socket.on("updateVotingQueue", video => {
    songContainer.appendChild(createSongObject(video))
})

socket.on("updateVotes", (id, votes) => {
    let button = document.querySelector(`[data-videoid='${id}']`)
    if (button.dataset.voted)
        button.innerText = votes
    else {
        button.getElementsByClassName("voteNum")[0].innerText = votes
    }
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
    if (!cur.video || !cur.playerConnected) {
        document.getElementById("thumbnail").src = "/images/sleep-note.png"
        document.getElementById("curTitle").innerText = "Nic nie jest odtwarzane przez aplikacje"
        document.getElementById("curCreator").innerText = "-----"
        return
    }
    document.getElementById("thumbnail").src = cur.video.thumbnail
    document.getElementById("curTitle").innerText = formatTitle(cur.video.title, cur.video.creator)
    document.getElementById("curCreator").innerText = cur.video.creator
    let progressBar = document.querySelector(".bar input")
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
    progressBar.style.setProperty("--percentage", percentage)
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

// handle icon hold (delete mode)
let currentWrapper = document.getElementById("contentWrapper")
function onIconHold() {
    if (isAdmin)
        currentWrapper.classList.add("deleteMode")
}

function onDeleteClick(element) {
    let id = element.querySelector(".upvote").dataset.videoid
    fetch("/admin/voteelement/" + encodeURIComponent(id), { method: "DELETE" })
}

document.getElementById("leaveDeleteMode")
    .addEventListener("click", () => {
        currentWrapper.classList.remove("deleteMode")
    })


let holdTimer

function mouseDownHoldHelper() {
    mouseUpHoldHelper()
    holdTimer = setTimeout(onIconHold, 1500)
}

function mouseUpHoldHelper() {
    if (holdTimer) clearTimeout(holdTimer)
}

Array.from(document.getElementsByClassName("song"))
    .forEach((e) => {
        let songIcon = e.querySelector(".songIcon")
        songIcon.addEventListener("mousedown", mouseDownHoldHelper)
        songIcon.addEventListener("touchstart", mouseDownHoldHelper)
        songIcon.addEventListener("click", () => {
            if (currentWrapper.classList.contains("deleteMode"))
                onDeleteClick(e)
        })
    })

document.body.addEventListener("touchend", mouseUpHoldHelper)
document.body.addEventListener("mouseup", mouseUpHoldHelper)

// format all titles on load
let creators = document.getElementsByClassName("creator")
Array.from(document.getElementsByClassName("title"))
    .forEach(
        (e, i) => e.innerText = formatTitle(e.innerText, creators[i].innerText)
    )

reconnection(socket)
