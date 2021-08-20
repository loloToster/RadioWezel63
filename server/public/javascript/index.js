const DEF_YT_URL = "https://www.youtube.com/watch?v="
const socket = io()

socket.on("connect", () => {
    console.log("connected")
})

Array.from(document.getElementsByClassName("upvote")).forEach(element => {
    element.addEventListener("click", event => onVote(element.dataset.videoid))
})

function createSongObject(video) {
    let object = document.createElement("div")
    object.setAttribute("class", "song")
    let songContent = document.createElement("div")
    songContent.setAttribute("class", "songContent")
    object.appendChild(songContent)
    let title = document.createElement("div")
    let href = document.createElement("a")
    href.setAttribute("href", DEF_YT_URL + video.id)
    href.setAttribute("target", "_blank")
    href.innerText = video.title
    title.appendChild(href)
    songContent.appendChild(title)
    let upvote = document.createElement("div")
    upvote.setAttribute("class", "upvote")
    upvote.setAttribute("data-videoid", video.id)
    upvote.innerText = "^"
    upvote.addEventListener("click", event => onVote(video.id))
    songContent.appendChild(upvote)
    return object
}

function onVote(id) {
    id = encodeURIComponent(id)
    fetch("/vote/" + id)
        .then(response => response.text())
        .then(data => {
            console.log(data)
            let button = document.querySelector(`[data-videoid='${id}']`)
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
