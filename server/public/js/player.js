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

String.prototype.customTrim = function (chars = " \n\t") {
    let newString = this
    while (chars.includes(newString.charAt(0))) {
        newString = newString.substring(1)
        if (!newString) break
    }
    while (chars.includes(newString.charAt(newString.length - 1))) {
        newString = newString.substring(0, newString.length - 1)
        if (!newString) break
    }
    return newString
}

function formatTitle(title, creator) {
    let remix = title.toLowerCase().includes("remix")
    return title.replace(creator, "").replace(/\(.*\)|\[.*\]/, "").customTrim(" \n\t-,_|") + (remix ? " (Remix)" : "")
}       // remove creator name | then remove any thing between parenthesis | then remove unnecessary chars | if there was 'remix' in title add '(Remix)'

let player
let currentVideo = null

let playerElement = document.getElementById("player")

function onYouTubeIframeAPIReady() {
    player = new YT.Player("player-iframe", {
        width: null,
        height: null,
        events: {
            onStateChange: onPlayerStateChange
        }
    })
}

let pauseBtn = document.getElementById("pause-play")
let skipBtn = document.getElementById("next")
let title = document.getElementById("title")
let artist = document.getElementById("artist")
let durElements = {
    left: document.getElementById("l-dur"),
    input: document.getElementById("duration"),
    right: document.getElementById("r-dur")
}

async function loadNextVideo() {
    let res = await fetch("/player/song?key=" + playerKey)
    data = await res.json()
    currentVideo = data.video
    player.loadVideoById(data.video.ytid)
    pauseBtn.src = "/images/pause.png"
    title.innerText = formatTitle(currentVideo.title, currentVideo.creator)
    artist.innerText = currentVideo.creator
    playerElement.style.setProperty("--image", `url(${currentVideo.thumbnail})`)
}

async function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.ENDED)
        await loadNextVideo()
}

skipBtn.addEventListener("click", async () => {
    await loadNextVideo()
})

pauseBtn.addEventListener("click", async () => {
    let state = player.getPlayerState()
    if (state != YT.PlayerState.PAUSED && state != YT.PlayerState.PLAYING)
        return
    let paused = state == YT.PlayerState.PAUSED
    if (paused) {
        player.playVideo()
        pauseBtn.src = "/images/pause.png"
    } else {
        player.pauseVideo()
        pauseBtn.src = "/images/play.png"
    }
})

function zeroFill(number, width = 2) {
    width -= number.toString().length
    if (width > 0)
        return new Array(width + (/\./.test(number) ? 2 : 1)).join("0") + number
    return number + ""
}

function drawDuration(position, duration) {
    durElements.input.value = position
    durElements.input.max = duration

    durElements.input.style.setProperty("--percentage", (position * 100) / duration)

    let minutes = Math.floor(position / 60)
    let seconds = position % 60
    durElements.left.innerText = `${minutes}:${zeroFill(seconds)}`

    minutes = Math.floor(duration / 60)
    seconds = duration % 60
    durElements.right.innerText = `${minutes}:${zeroFill(seconds)}`
}

let inputingDuration = false
durElements.input.addEventListener("touchstart", () => inputingDuration = true)
durElements.input.addEventListener("mousedown", () => inputingDuration = true)

durElements.input.addEventListener("input", () => {
    drawDuration(durElements.input.value, durElements.input.max)
})

let rewound = false
let seekEvent = () => {
    inputingDuration = false
    player.seekTo(durElements.input.value)
    rewound = true
}

durElements.input.addEventListener("touchend", seekEvent)
durElements.input.addEventListener("mouseup", seekEvent)

async function loop() {
    let dur
    try { // todo: get ridoff trycatch
        dur = Math.round(player.getCurrentTime())
    } catch (error) {
        dur = -1
    }
    if (dur != -1 && currentVideo && !inputingDuration)
        drawDuration(dur, currentVideo.duration)
    await socket.emit("update", {
        duration: dur,
        paused: player.getPlayerState() == YT.PlayerState.PAUSED,
        video: currentVideo,
        rewound: rewound
    })
    rewound = false
}

setInterval(loop, 1000)
