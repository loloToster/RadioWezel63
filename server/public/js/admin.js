(() => { // wrapped in function to not intercept with player scope
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
    manageTemplate.remove()

    function createManageObject(parent) {
        let clone = manageTemplate.cloneNode(true)
        clone.id = "manage"

        clone.querySelector("iframe").src = DEF_EMBED_YT + parent.dataset.videoid
        clone.querySelector("#link a").href = DEF_YT_URL + parent.dataset.videoid

        clone.querySelector("#deny").addEventListener("click", () => onButtonClick("deny", parent.dataset.videoid))
        clone.querySelector("#accept").addEventListener("click", () => onButtonClick("accept", parent.dataset.videoid))
        clone.querySelector("#lyrics").addEventListener("click", () => getLyrics(parent.querySelector(".title").innerText, parent.dataset.videoid))

        return clone
    }

    Array.from(document.querySelectorAll("#adminPanel .song"))
        .forEach(element =>
            element.querySelector(".songContent")
                .addEventListener("click", () => onSongClick(element))
        )

    let currentId = null

    function onSongClick(element) {
        let manage = document.getElementById("manage")
        manage ? manage.remove() : null
        if (element.dataset.videoid == currentId) {
            currentId = null
            return
        }
        currentId = element.dataset.videoid
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

    async function getLyrics(title, id) {
        let table = document.getElementById("lyricsText")
        if (!table) return
        table.innerHTML = "<div class='loadingLyrics'></div>"
        title = encodeURIComponent(title)
        let res = await fetch("/admin/lyrics/" + title)
        let data = await res.text()
        if (id != currentId) return
        table.innerHTML = ""
        data.split("\n").forEach((line, i) => {
            let row = table.insertRow()
            let lineNum = row.insertCell()
            lineNum.classList.add("number")
            lineNum.innerText = i + 1
            let lineText = row.insertCell()
            lineText.classList.add("text")
            lineText.innerText = line
        })
    }


    let songContainer = document.getElementById("adminPanel")
    socket.on("addSubmit", video => {
        let song = songContainer.appendChild(createSongObject(video))
        song.addEventListener("click", () => onSongClick(song))
    })

    socket.on("removeSubmit", id => {
        let object = document.querySelector(`#adminPanel [data-videoid="${id}"]`)
        if (object) object.remove()
    })

    reconnection(socket)
})()
