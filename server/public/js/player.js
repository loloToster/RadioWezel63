let logger = document.getElementById("logger")
const maxLogs = 200

function log(msg) {
    console.log(msg)
    let allLogs = logger.getElementsByClassName("log")
    if (allLogs.length >= maxLogs) {
        allLogs[0].remove()
    }
    let e = document.createElement("div")
    e.classList.add("log")
    e.innerText = msg
    logger.appendChild(e)
    logger.scrollTop = logger.scrollHeight
}

const socket = io({
    auth: {
        role: "player",
        key: playerKey
    }
})

socket.on("connect", () => {
    log("connected")
})

socket.on("disconnect", () => { // todo: handle disconnection
    log("disconnected")
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
    let hadRemix = title.toLowerCase().includes("remix")
    title = title.replace(creator, "") // remove creator name
        .replace(/\(.*\)|\[.*\]/, "") //remove any thing between parenthesis
        .customTrim(" \n\t-,_|") //remove unnecessary chars from ends
    return title + (hadRemix && !title.includes("remix") ? " (Remix)" : "") //if there was 'remix' in title and now there isn't add '(Remix)'
}

function zeroFill(number, width = 2) {
    width -= number.toString().length
    if (width > 0)
        return new Array(width + (/\./.test(number) ? 2 : 1)).join("0") + number
    return number + ""
}

let currentVideo = null

let playerElement = document.getElementById("player")

let pauseBtn = document.getElementById("pause-play")
let skipBtn = document.getElementById("next")
let titleElm = document.getElementById("title")
let artistElm = document.getElementById("artist")
let durElements = {
    left: document.getElementById("l-dur"),
    input: document.getElementById("duration"),
    right: document.getElementById("r-dur")
}

let durationTimeout
function drawDuration(position, duration, paused) {
    clearTimeout(durationTimeout)
    durElements.input.value = position
    durElements.input.max = duration

    durElements.input.style.setProperty("--percentage", (position * 100) / duration)

    let minutes = Math.floor(position / 60)
    let seconds = position % 60
    durElements.left.innerText = `${minutes}:${zeroFill(seconds)}`

    minutes = Math.floor(duration / 60)
    seconds = duration % 60
    durElements.right.innerText = `${minutes}:${zeroFill(seconds)}`

    if (!paused)
        durationTimeout = setTimeout(drawDuration, 1000, position + 1, duration, false)
}

function updatePlayerAppearance(vid) {
    titleElm.innerText = formatTitle(vid.title, vid.creator)
    artistElm.innerText = vid.creator
    playerElement.style.setProperty("--image", `url(${vid.thumbnail})`)
}

async function onYouTubeIframeAPIReady() {
    YT.PlayerState.UNSTARTED = -1

    let player = new YT.Player("player-iframe", {
        width: null,
        height: null,
        playerVars: { autoplay: 0 },
        events: {
            onStateChange: onPlayerStateChange,
            onReady: onPlayerReady,
            onError: e => log("yt error: " + e.data)
        }
    })

    let inputingDuration = false
    let lastState = null
    async function onPlayerStateChange(event) {
        lastState = event.data
        log("new state: " + lastState)
        let paused = true
        playerElement.classList.remove("loading")
        switch (event.data) {
            case YT.PlayerState.UNSTARTED: { // -1
                break
            }

            case YT.PlayerState.ENDED: { // 0
                await loadNextVideo()
                break
            }

            case YT.PlayerState.PLAYING: { // 1
                paused = false
                pauseBtn.classList.remove("paused")
                break
            }

            case YT.PlayerState.PAUSED: { // 2
                pauseBtn.classList.add("paused")
                break
            }

            case YT.PlayerState.BUFFERING: { // 3
                playerElement.classList.add("loading")
                break
            }

            case YT.PlayerState.CUED: { // 5
                break
            }

            default:
                break
        }
        let dur = player.getCurrentTime()
        if (!dur) dur = 0
        dur = Math.round(dur)
        if (!inputingDuration)
            drawDuration(dur, currentVideo?.duration || 60, paused)
    }

    async function onPlayerReady(event) {
        log("loading current video")
        let res = await fetch("/player/current")
        let data = await res.json()
        log("loaded current video - " + data?.video?.title)
        if (data.video) {
            currentVideo = data.video
            updatePlayerAppearance(currentVideo)
            event.target.loadVideoById(currentVideo.ytid, data.duration, "small")
        }
        setInterval(loop, 1000)
    }

    async function loadNextVideo() {
        log("loading new video")
        let res = await fetch("/player/song?key=" + playerKey)
        let data = await res.json()
        if (!data) {
            log("no new video")
            titleElm.innerText = "Nie ma piosenek"
            artistElm.innerHTML = "naciśnij <img class='miniNext' src='/images/right.png'> jak się jakaś pojawi"
            playerElement.style.setProperty("--image", "url(/images/default-music.png)")
            currentVideo = null
            player.loadVideoById("")
            return
        }
        log("got new video - " + data.video.title)
        currentVideo = data.video
        player.loadVideoById(currentVideo.ytid, 0, "small")
        updatePlayerAppearance(currentVideo)
    }

    pauseBtn.addEventListener("click", async () => {
        if (lastState != YT.PlayerState.PAUSED
            && lastState != YT.PlayerState.PLAYING
            && lastState != YT.PlayerState.UNSTARTED)
            return
        let paused = lastState != YT.PlayerState.PLAYING
        if (paused) {
            player.playVideo()
        } else {
            player.pauseVideo()
        }
    })

    skipBtn.addEventListener("click", async () => {
        await loadNextVideo()
    })

    durElements.input.addEventListener("touchstart", () => inputingDuration = true)
    durElements.input.addEventListener("mousedown", () => inputingDuration = true)

    durElements.input.addEventListener("input", () => {
        drawDuration(durElements.input.value, durElements.input.max, true)
    })

    let rewound = false
    let seekEvent = () => {
        inputingDuration = false
        player.seekTo(durElements.input.value)
        rewound = true
    }

    durElements.input.addEventListener("touchend", seekEvent)
    durElements.input.addEventListener("mouseup", seekEvent)

    async function loop() { // todo: move loop code to onPlayerStateChange
        let dur = player.getCurrentTime()
        if (!dur) dur = 0
        dur = Math.round(dur)
        await socket.emit("update", {
            duration: dur,
            paused: lastState != YT.PlayerState.PLAYING,
            video: currentVideo,
            rewound: rewound
        })
        rewound = false
    }
}
