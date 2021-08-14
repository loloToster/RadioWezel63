const socket = io()

socket.on("connect", () => {
    console.log("connected")
    socket.emit("joinRoom", "admin")
})

function createSongObject(title) {
    let object = document.createElement("div")
    object.setAttribute("class", "song")
    let songContent = document.createElement("div")
    songContent.setAttribute("class", "songContent")
    let titleDiv = document.createElement("div")
    titleDiv.innerText = title
    songContent.appendChild(titleDiv)
    object.appendChild(songContent)
    return object
}

socket.on("updateSubmits", submitQueue => {
    console.log(submitQueue)
    let songContainer = document.getElementById("songContainer")
    songContainer.innerHTML = ""
    submitQueue.forEach(submit => {
        songContainer.appendChild(createSongObject(submit.title))
    });
})