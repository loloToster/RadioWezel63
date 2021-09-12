const DEF_YT_URL = "https://www.youtube.com/watch?v=",
    DEF_EMBED_YT = "https://www.youtube.com/embed/"

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
    object.setAttribute("data-videoid", video.ytid)
    let songContent = document.createElement("div")
    songContent.setAttribute("class", "songContent")
    songContent.innerText = htmlDecode(video.title)
    object.appendChild(songContent)
    return object
}

function createManageObject(parent) {
    let object = document.createElement("div")
    object.setAttribute("id", "manage")

    let iframeWrapper = document.createElement("div")
    iframeWrapper.setAttribute("id", "iframeWrapper")

    let iframe = document.createElement("iframe")
    iframe.setAttribute("frameborder", "0")
    iframe.setAttribute("src", DEF_EMBED_YT + parent.dataset.videoid)
    iframeWrapper.appendChild(iframe)
    object.appendChild(iframeWrapper)

    let buttons = document.createElement("div")
    buttons.setAttribute("id", "buttons")

    let deny = document.createElement("div")
    deny.setAttribute("id", "deny")
    deny.setAttribute("class", "button")
    deny.addEventListener("click", event => onButtonClick("deny", parent.dataset.videoid))

    let img = document.createElement("img")
    img.setAttribute("src", "/images/deny.png")
    deny.appendChild(img)
    buttons.appendChild(deny)

    let accept = document.createElement("div")
    accept.setAttribute("id", "accept")
    accept.setAttribute("class", "button")
    accept.addEventListener("click", event => onButtonClick("accept", parent.dataset.videoid))

    img = document.createElement("img")
    img.setAttribute("src", "/images/accept.png")
    accept.appendChild(img)
    buttons.appendChild(accept)

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
    buttons.appendChild(link)

    let lyrics = document.createElement("div")
    lyrics.setAttribute("id", "lyrics")
    lyrics.setAttribute("class", "button")
    img = document.createElement("img")
    img.setAttribute("src", "/images/lyrics.png")
    lyrics.appendChild(img)
    lyrics.addEventListener("click", event => getLyrics(parent.getElementsByClassName("songContent")[0].innerText))
    buttons.appendChild(lyrics)

    object.appendChild(buttons)

    let lyricsText = document.createElement("div")
    lyricsText.setAttribute("id", "lyricsText")
    object.appendChild(lyricsText)

    return object
}

Array.from(document.getElementsByClassName("song")).forEach(element => {
    element.addEventListener("click", event => onSongClick(element))
})

var activeSong = null

function onSongClick(element) {
    if (activeSong == element) return
    activeSong = element
    console.log(element.dataset.videoid)
    let manage = document.getElementById("manage")
    if (manage) manage.remove()
    manage = createManageObject(element)
    element.appendChild(manage)
}

function onButtonClick(option, id) {
    console.log({ option, id })
    fetch("/admin/verdict", {
        method: "PUT",
        headers: {
            "Content-type": "application/json"
        },
        body: JSON.stringify({ id: id, option: option })
    })
}

function getLyrics(title) {
    console.log(title)
    title = encodeURIComponent(title)
    fetch("/admin/lyrics/" + title)
        .then(response => response.text())
        .then(data => {
            console.log(data)
            let div = document.getElementById("lyricsText")
            if (!div) return
            div.innerText = data
        })
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
