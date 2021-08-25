const DEF_YT_URL = "https://www.youtube.com/watch?v="

function htmlDecode(input) {
    var doc = new DOMParser().parseFromString(input, "text/html");
    return doc.documentElement.textContent;
}

const socket = io({
    auth: {
        role: "admin",
        key: "-"
    }
})

socket.on("connect", () => {
    console.log("connected")
})

function createSongObject(video) {
    object = document.createElement("div")
    object.setAttribute("class", "song")
    object.setAttribute("data-videoid", video.id)
    let songContent = document.createElement("div")
    songContent.setAttribute("class", "songContent")
    songContent.innerText = htmlDecode(video.title)
    object.appendChild(songContent)
    return object
}

function createButtonsObject(parent) {
    let object = document.createElement("div")
    object.setAttribute("id", "buttons")

    let deny = document.createElement("div")
    deny.setAttribute("id", "deny")
    deny.setAttribute("class", "button")
    deny.addEventListener("click", event => onButtonClick("deny", parent.dataset.videoid))

    let img = document.createElement("img")
    img.setAttribute("src", "/images/deny.png")
    deny.appendChild(img)
    object.appendChild(deny)

    let accept = document.createElement("div")
    accept.setAttribute("id", "accept")
    accept.setAttribute("class", "button")
    accept.addEventListener("click", event => onButtonClick("accept", parent.dataset.videoid))

    img = document.createElement("img")
    img.setAttribute("src", "/images/accept.png")
    accept.appendChild(img)
    object.appendChild(accept)

    let link = document.createElement("div")
    link.setAttribute("id", "link")
    link.setAttribute("class", "button")

    let href = document.createElement("a")
    href.setAttribute("href", DEF_YT_URL + parent.dataset.videoid)
    href.setAttribute("target", "_blank")

    img = document.createElement("img")
    img.setAttribute("src", "/images/link.png")
    href.appendChild(img)
    link.appendChild(href)
    object.appendChild(link)

    let clear = document.createElement("div")
    clear.style.clear = "both"
    object.appendChild(clear)
    return object
}

Array.from(document.getElementsByClassName("song")).forEach(element => {
    element.addEventListener("click", event => onSongClick(element))
})

function onSongClick(element) {
    console.log(element.dataset.videoid)
    let buttons = document.getElementById("buttons")
    if (buttons) buttons.remove()
    buttons = createButtonsObject(element)
    element.appendChild(buttons)
}

function onButtonClick(type, id) {
    console.log({ type, id })
    id = encodeURIComponent(id)
    fetch(`/admin/${type}/${id}`)
}


socket.on("addSubmit", video => {
    let songContainer = document.getElementById("songContainer")
    let song = songContainer.appendChild(createSongObject(video))
    song.addEventListener("click", event => onSongClick(song))
})

socket.on("removeSubmit", id => {
    console.log("remove", { id })
    let object = document.querySelector(`[data-videoid="${id}"]`)
    if (object) object.remove()
})
