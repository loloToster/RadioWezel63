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
