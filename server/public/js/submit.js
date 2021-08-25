const DEF_YT_URL = "https://www.youtube.com/watch?v="

function htmlDecode(input) {
    var doc = new DOMParser().parseFromString(input, "text/html");
    return doc.documentElement.textContent;
}

function createVideoElement(video) {
    let object = document.createElement("div")
    object.setAttribute("class", "video")
    if (video.submitted) {
        object.style.backgroundColor = "#57cc47"
    } else {
        delete video.submitted
        object.addEventListener("click", event => onClick(video))
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
}

function onClick(video) {
    console.log(video)
    fetch("/submit/post", {
        method: "POST",
        body: JSON.stringify(video),
        headers: {
            "Content-Type": "application/json"
        }
    })
        .then(res => res.json())
        .then(data => {
            if (data.code == "success") {
                window.location.href = "/"
            }
        })
}


document.getElementById("icon").addEventListener("click", event => {
    let resultContainer = document.getElementById("resultContainer")
    resultContainer.innerHTML = ""
    let noResults = document.getElementById("noResults")
    noResults.style.display = "none"
    let loading = document.getElementById("loading")
    loading.style.display = "block"
    let input = document.querySelector("#inputTd input")
    let value = input.value
    value = encodeURIComponent(value)
    console.log("Submitting: " + value)
    fetch("/submit/search/" + value)
        .then(response => response.json())
        .then(data => {
            loading.style.display = "none"
            if (data.code == "success")
                data.items.forEach(item => {
                    resultContainer.appendChild(createVideoElement(item))
                })
            else {
                noResults.style.display = "block"
            }
            input.value = ""
        })
})
