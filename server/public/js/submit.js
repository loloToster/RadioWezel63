const DEF_YT_URL = "https://www.youtube.com/watch?v="

function htmlDecode(input) {
    var doc = new DOMParser().parseFromString(input, "text/html")
    return doc.documentElement.textContent
}

const videoTemplate = document.getElementById("videoTemplate")
videoTemplate.removeAttribute("id")

function createVideoElement(video) {
    let clone = videoTemplate.cloneNode(true)
    if (video.submitted) {
        clone.style.backgroundColor = "#57cc47"
        let submitted = document.createElement("submitted")
        submitted.classList.add("unclickable")
        submitted.innerText = "Ta piosenka jest już dodana"
        clone.appendChild(submitted)
    } else if (video.toLong) {
        clone.style.backgroundColor = "#c02739"
        let toLong = document.createElement("tolong")
        toLong.classList.add("unclickable")
        toLong.innerText = "Ta piosenka jest za długa"
        clone.appendChild(toLong)
    } else {
        delete video.submitted
        delete video.toLong
        clone.addEventListener("click", () => onVideoClick(video))
    }
    clone.querySelector(".thumbnail img").src = video.thumbnail
    clone.querySelector(".title").innerText = htmlDecode(video.title)
    clone.querySelector(".creator").innerText = (video.explicit ? "🅴 " : "") + video.creator
    return clone
}

let searchInput = document.getElementById("searchInput")

document.getElementById("searchIcon").addEventListener("click", onSearch)
searchInput.addEventListener("keypress", event => event.key == "Enter" ? onSearch() : null)

async function onVideoClick(video) {
    document.getElementById("submitionSuccess").style.display = "flex"
    let res = await fetch("/submit/post", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(video)
    })
    let data = await res.json()
    document.getElementById("loading-response").style.display = "none"
    let sucThumbnail = document.getElementById("successThumbnail")
    sucThumbnail.style.display = "flex"
    sucThumbnail.style.backgroundImage = `url(${data.thumbnail})`
    document.querySelector("#submitionSuccess #tick").classList.add("tickAnimation")
    setTimeout(() => window.location.href = "/", 730)
}

let searching = false

function onSearch() {
    let value = searchInput.value
    if (!value || searching) return
    searching = true
    let resultContainer = document.getElementById("resultContainer")
    resultContainer.innerHTML = ""
    let noResults = document.getElementById("noResults")
    noResults.style.display = "none"
    let loading = document.getElementById("loading-results")
    loading.style.display = "block"
    fetch("/submit/search/" + encodeURIComponent(value))
        .then(res => res.json())
        .then(data => {
            loading.style.display = "none"
            if (data.code == "success")
                data.items.forEach(item => {
                    resultContainer.appendChild(createVideoElement(item))
                })
            else {
                noResults.style.display = "block"
            }
            searchInput.value = ""
            searching = false
        }).catch(() => {
            searching = false
        })
}
