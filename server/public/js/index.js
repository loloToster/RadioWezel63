const DEF_YT_URL = "https://www.youtube.com/watch?v="

function htmlDecode(input) {
    var doc = new DOMParser().parseFromString(input, "text/html");
    return doc.documentElement.textContent;
}

const socket = io()

socket.on("connect", () => {
    console.log("connected")
})

let addSong = document.getElementById("plus")

addSong.addEventListener("click", () => {
    addSong.setAttribute("class", "clicked")
})

Array.from(document.getElementsByClassName("upvote")).forEach(element => {
    if (!element.dataset.voted)
        element.addEventListener("click", event => onVote(element.dataset.videoid))
})

function createSongObject(video) {
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

socket.on("updateDuration", arg => {
    if (arg.currentDuration == -1) {
        document.getElementById("currentWrapper").style.display = "none"
        return
    } else {
        document.getElementById("currentWrapper").style.display = "block"
    }
    document.getElementById("thumbnail").setAttribute("src", arg.video.thumbnail)
    let progressBar = document.querySelector("input")
    let left = document.getElementById("left")
    let right = document.getElementById("right")
    let duration = arg.video.duration
    let minutes = Math.floor(duration / 60)
    let seconds = duration - minutes * 60
    right.innerText = `${zeroFill(minutes)}:${zeroFill(seconds)}`
    let currentDuration = arg.currentDuration
    minutes = Math.floor(currentDuration / 60)
    seconds = currentDuration - minutes * 60
    left.innerText = `${zeroFill(minutes)}:${zeroFill(seconds)}`
    let percentage = (currentDuration / duration) * 100
    progressBar.value = percentage
    progressBar.style.background = `linear-gradient(to right, #01be97 0%, #01be97 ${percentage}%, #d4d4d4 ${percentage}%, #d4d4d4 100%)`
})

function zeroFill(number, width = 2) {
    width -= number.toString().length
    if (width > 0)
        return new Array(width + (/\./.test(number) ? 2 : 1)).join('0') + number
    return number + ""
}

function test(cDur = 0, dur = 30) {
    console.log("exe")
    let progressBar = document.querySelector("input")
    // progressBar.max = dur

    let value = Math.round((cDur / dur) * 100)
    progressBar.value = value
    progressBar.style.background = `linear-gradient(to right, #01be97 0%, #01be97 ${value}%, #d4d4d4 ${value}%, #d4d4d4 100%)`

    cDur++
    if (cDur == dur) return
    setTimeout(test, 1000, cDur, dur)
}
