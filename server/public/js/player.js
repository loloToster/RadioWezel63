const socket = io({
    auth: {
        role: "player"
    }
})

socket.on("connect", () => {
    console.log("connected")
})

let player
function onYouTubeIframeAPIReady() {
    fetch("/player/song").then(res => res.json()).then(data => {
        player = new YT.Player("player", {
            width: null,
            height: null,
            videoId: data.video.ytid,
            events: {
                "onReady": onPlayerReady
            }
        })
    })
}

function onPlayerReady(event) {
    event.target.playVideo()
}

async function updateServer() {
    await socket.emit("update", {
        current: Math.round(player.getCurrentTime()),
        video: {}
    })
}

setInterval(updateServer, 1000)
