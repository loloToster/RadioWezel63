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
    title.innerText = video.title
    title.setAttribute("href", video.url)
    songContent.appendChild(title)
    let upvote = document.createElement("div")
    upvote.setAttribute("class", "upvote")
    upvote.setAttribute("data-videoid", upvote)
    upvote.innerText = "^"
    upvote.addEventListener("click", event => onVote(video.id))
    songContent.appendChild(upvote)
    return object
}

function onVote(id) {
    console.log({ id })
}

socket.on("updateVotingQueue", voteElement => {
    console.log(voteElement)
    console.log(voteElement.video.id)
    document.getElementById("songContainer").appendChild(createSongObject(voteElement.video))
})