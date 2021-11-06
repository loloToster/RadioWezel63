const DEF_YT_URL = "https://www.youtube.com/watch?v=",
    DEF_EMBED_YT = "https://www.youtube.com/embed/"

function htmlDecode(input) {
    var doc = new DOMParser().parseFromString(input, "text/html")
    return doc.documentElement.textContent
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

const songTemplate = document.getElementById("songTemplate")
songTemplate.removeAttribute("id")

function createSongObject(video) {
    clone = songTemplate.cloneNode(true)
    clone.querySelector(".title").innerText = htmlDecode(video.title)
    clone.querySelector(".creator").innerText = video.creator
    clone.dataset.videoid = video.ytid
    return clone
}

const manageTemplate = document.getElementById("manageTemplate")
manageTemplate.removeAttribute("id")

function createManageObject(parent) {
    let clone = manageTemplate.cloneNode(true)
    clone.id = "manage"

    clone.querySelector("iframe").src = DEF_EMBED_YT + parent.dataset.videoid
    clone.querySelector("#link a").href = DEF_YT_URL + parent.dataset.videoid

    clone.querySelector("#deny").addEventListener("click", () => onButtonClick("deny", parent.dataset.videoid))
    clone.querySelector("#accept").addEventListener("click", () => onButtonClick("accept", parent.dataset.videoid))
    clone.querySelector("#lyrics").addEventListener("click", () => getLyrics(parent.querySelector(".title").innerText))

    return clone
}

Array.from(document.getElementsByClassName("song")).forEach(element => {
    element.addEventListener("click", () => onSongClick(element))
})

var activeSong = null

function onSongClick(element) {
    if (activeSong == element) return
    activeSong = element
    let manage = document.getElementById("manage")
    if (manage) manage.remove()
    manage = createManageObject(element)
    element.appendChild(manage)
}

function onButtonClick(option, id) {
    fetch("/admin/verdict", {
        method: "PUT",
        headers: {
            "Content-type": "application/json"
        },
        body: JSON.stringify({ id: id, option: option })
    })
}

async function getLyrics(title) {
    console.log(title)
    title = encodeURIComponent(title)
    let res = await fetch("/admin/lyrics/" + title)
    let data = await res.text()
    let div = document.getElementById("lyricsText")
    if (!div) return
    div.innerText = data
}


socket.on("addSubmit", video => {
    let songContainer = document.getElementById("songContainer")
    let song = songContainer.appendChild(createSongObject(video))
    song.addEventListener("click", () => onSongClick(song))
})

socket.on("removeSubmit", id => {
    let object = document.querySelector(`[data-videoid="${id}"]`)
    if (object) object.remove()
})
