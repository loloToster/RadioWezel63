const DEF_YT_URL = "https://www.youtube.com/watch?v="

function htmlDecode(input) {
    var doc = new DOMParser().parseFromString(input, "text/html");
    return doc.documentElement.textContent;
}

/* function createVideoElement(video) {
    let object = document.createElement("div")
    object.setAttribute("class", "video")
    if (video.submitted) {
        object.style.backgroundColor = "#57cc47"
        let submitted = document.createElement("submitted")
        submitted.setAttribute("class", "unclickable")
        submitted.innerText = "Ta piosenka jest już dodana"
        object.appendChild(submitted)
    } else if (video.toLong) {
        object.style.backgroundColor = "#c02739"
        let toLong = document.createElement("tolong")
        toLong.setAttribute("class", "unclickable")
        toLong.innerText = "Ta piosenka jest za długa"
        object.appendChild(toLong)
    } else {
        delete video.submitted
        delete video.toLong
        object.addEventListener("click", event => onVideoClick(video))
    }
    let thumbnail = document.createElement("div")
    thumbnail.setAttribute("class", "thumbnail")

    let img = document.createElement("img")
    img.setAttribute("src", video.thumbnail)
    thumbnail.appendChild(img)
    object.appendChild(thumbnail)

    let titleDiv = document.createElement("div")
    titleDiv.setAttribute("class", "titleDiv")
    let title = document.createElement("div")
    title.innerText = htmlDecode(video.title)
    titleDiv.appendChild(title)
    object.appendChild(titleDiv)

    return object
} */

const videoTemplate = document.getElementById("videoTemplate")
videoTemplate.removeAttribute("id")

function createVideoElement(video) {
    let clone = videoTemplate.cloneNode(true)
    if (video.submitted) {
        clone.style.backgroundColor = "#57cc47"
        let submitted = document.createElement("submitted")
        submitted.setAttribute("class", "unclickable")
        submitted.innerText = "Ta piosenka jest już dodana"
        clone.appendChild(submitted)
    } else if (video.toLong) {
        clone.style.backgroundColor = "#c02739"
        let toLong = document.createElement("tolong")
        toLong.setAttribute("class", "unclickable")
        toLong.innerText = "Ta piosenka jest za długa"
        clone.appendChild(toLong)
    } else {
        delete video.submitted
        delete video.toLong
        clone.addEventListener("click", event => onVideoClick(video))
    }
    console.log(clone)
    clone.querySelector(".thumbnail img").setAttribute("src", video.thumbnail)
    clone.querySelector(".titleDiv div").innerText = htmlDecode(video.title)
    return clone
}

document.getElementById("icon").addEventListener("click", onSearch)
document.querySelector("#search #bar input").addEventListener("keypress", event => {
    if (event.key == "Enter") onSearch()
})



function onVideoClick(video) {
    console.log(video)
    fetch("/submit/post", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(video)
    })
        .then(res => res.json())
        .then(data => {
            if (data.code == "success") {
                window.location.href = "/"
            }
        })
}

var searching = false

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
        .then(response => response.json())
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
