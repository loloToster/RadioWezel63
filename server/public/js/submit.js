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
        toLong.classList.add("unclickable")
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
    clone.querySelector(".titleDiv div").innerText = htmlDecode(video.title)
    return clone
}

document.getElementById("icon").addEventListener("click", onSearch)
document.querySelector("#search #bar input")
    .addEventListener("keypress", event => {
        if (event.key == "Enter") onSearch()
    })

async function onVideoClick(video) {
    let res = await fetch("/submit/post", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(video)
    })
    let data = await res.json()
    if (data.code == "success")
        window.location.href = "/"
}

let searching = false

function onSearch() {
    let input = document.querySelector("#search #bar input")
    let value = input.value
    if (!value || searching) return
    searching = true
    let resultContainer = document.getElementById("resultContainer")
    resultContainer.innerHTML = ""
    let noResults = document.getElementById("noResults")
    noResults.style.display = "none"
    let loading = document.getElementById("loading")
    loading.style.display = "block"
    value = encodeURIComponent(value)
    console.log("Searching: " + value)
    fetch("/submit/search/" + value)
        .then(res => res.json())
        .then(data => {
            console.log(data)
            loading.style.display = "none"
            if (data.code == "success")
                data.items.forEach(item => {
                    resultContainer.appendChild(createVideoElement(item))
                })
            else {
                noResults.style.display = "block"
            }
            input.value = ""
            searching = false
        })
        .catch(err => {
            searching = false
        })
}
