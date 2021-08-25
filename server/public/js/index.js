const DEF_YT_URL = "https://www.youtube.com/watch?v="

function htmlDecode(input) {
    var doc = new DOMParser().parseFromString(input, "text/html");
    return doc.documentElement.textContent;
}

const socket = io()

socket.on("connect", () => {
    console.log("connected")
})

Array.from(document.getElementsByClassName("upvote")).forEach(element => {
    if (!element.dataset.voted)
        element.addEventListener("click", event => onVote(element.dataset.videoid))
})

function createSongObject(video) {
    let object = document.createElement("tr")
    object.setAttribute("class", "song")

    let songContent = document.createElement("td")
    songContent.setAttribute("class", "songContent")

    let overflowWrapper = document.createElement("div")
    overflowWrapper.setAttribute("class", "overflowWrapper")

    let href = document.createElement("a")
    href.setAttribute("href", DEF_YT_URL + video.id)
    href.setAttribute("target", "_blank")
    href.innerText = htmlDecode(video.title)

    overflowWrapper.appendChild(href)
    songContent.appendChild(overflowWrapper)
    object.appendChild(songContent)

    let upvote = document.createElement("td")
    upvote.setAttribute("class", "upvote")
    upvote.setAttribute("data-videoid", video.id)
    upvote.innerText = "\u25b2"
    upvote.addEventListener("click", event => onVote(video.id))
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
    console.log(voteElement.video.id)
    document.getElementById("songContainer").appendChild(createSongObject(voteElement.video))
})

socket.on("updateVotes", (id, votes) => {
    console.log(`${id}: ${votes}`)
    let button = document.querySelector(`[data-videoid='${id}']`)
    if (!button.dataset.voted) return
    button.innerText = votes
})
