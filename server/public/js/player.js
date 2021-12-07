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

function updatePlayerAppearance(vid, duration = 0) {
    titleElm.innerText = formatTitle(vid.title, vid.creator)
    artistElm.innerText = vid.creator
    playerElement.style.setProperty("--image", `url(${vid.thumbnail})`)
    drawDuration(duration, vid.duration)
}

async function onYouTubeIframeAPIReady() {
    let player = new YT.Player("player-iframe", {
        width: null,
        height: null,
        events: {
            onStateChange: onPlayerStateChange,
            onReady: onPlayerReady
        }
    })

    async function onPlayerStateChange(event) {
        if (event.data == YT.PlayerState.ENDED)
            await loadNextVideo()
    }

    async function onPlayerReady(event) {
        let res = await fetch("/player/current")
        let data = await res.json()
        if (data.video) {
            currentVideo = data.video
            updatePlayerAppearance(currentVideo, data.duration)
            event.target.loadVideoById(currentVideo.ytid, data.duration, "small")
        }

        setInterval(loop, 1000)
    }

    async function loadNextVideo() {
        let res = await fetch("/player/song?key=" + playerKey)
        let data = await res.json()
        if (!data) {
            titleElm.innerText = "Nie ma piosenek"
            artistElm.innerHTML = "naciśnij <img class='miniNext' src='/images/right.png'> jak się jakaś pojawi"
            playerElement.style.setProperty("--image", "url(/images/default-music.png)")
            return
        }
        currentVideo = data.video
        player.loadVideoById(currentVideo.ytid, 0, "small")
        pauseBtn.classList.remove("paused")
        updatePlayerAppearance(currentVideo)
    }

    skipBtn.addEventListener("click", async () => {
        await loadNextVideo()
    })

    pauseBtn.addEventListener("click", async () => {
        let state = player.getPlayerState()
        if (state != YT.PlayerState.PAUSED && state != YT.PlayerState.PLAYING && state != -1)
            return
        let paused = state == YT.PlayerState.PAUSED || state == -1
        if (paused) {
            player.playVideo()
            pauseBtn.classList.remove("paused")
        } else {
            player.pauseVideo()
            pauseBtn.classList.add("paused")
        }
    })

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
        } catch {
            return
        }
        if (currentVideo && !inputingDuration)
            drawDuration(dur, currentVideo.duration)
        let state = player.getPlayerState()
        await socket.emit("update", {
            duration: dur,
            paused: state == YT.PlayerState.PAUSED || state == -1,
            video: currentVideo,
            rewound: rewound
        })
        rewound = false
    }
}
