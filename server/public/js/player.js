const socket = io({
    auth: {
        role: "player",
        key: playerKey
    }
})

socket.on("connect", () => {
    console.log("connected")
})

socket.on("disconnect", () => { // todo: handle disconnection
    console.log("disconnected")
})

let player
let currentVideo = null

function onYouTubeIframeAPIReady() {
    player = new YT.Player("player", {
        width: null,
        height: null,
        events: {
            onStateChange: onPlayerStateChange
        }
    })
}

async function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.ENDED)
        await loadNextVideo()
}

async function loadNextVideo() {
    let res = await fetch("/player/song?key=" + playerKey)
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
        paused: player.getPlayerState() == YT.PlayerState.PAUSED,
        video: currentVideo
    })
}

setInterval(updateServer, 1000)
