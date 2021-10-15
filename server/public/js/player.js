const socket = io({
    auth: {
        role: "player"
    }
})

socket.on("connect", () => { // todo: handle disconnection
    console.log("connected")
})

let player
let currentVideo = null

function onYouTubeIframeAPIReady() {
    player = new YT.Player("player", {
        width: null,
        height: null,
        events: {
            /* onReady: onPlayerReady, */
            onStateChange: onPlayerStateChange
        }
    })
}

/* async function onPlayerReady(event) {
    player.loadVideoById(await getNextVideoId())
} */

async function onPlayerStateChange(event) {
    if (event.data == 0)
        await loadNextVideo()
}

async function loadNextVideo() {
    let res = await fetch("/player/song")
    data = await res.json()
    currentVideo = data.video
    player.loadVideoById(data.video.ytid)
}

const button = document.querySelector("button")
button.addEventListener("click", async () => {
    await loadNextVideo()
    button.innerText = "skip"
})

async function updateServer() {
    let dur
    try { // todo: get ridoff trycatch
        dur = Math.round(player.getCurrentTime())
    } catch (error) {
        dur = -1
    }
    await socket.emit("update", {
        duration: dur,
        video: currentVideo
    })
}

setInterval(updateServer, 1000)
