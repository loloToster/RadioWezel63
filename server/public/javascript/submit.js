document.getElementById("submit").addEventListener("click", () => {
    let input = document.querySelector("input")
    let value = input.value
    if (!value.trim()) {
        console.log("Empty")
        return
    }
    value = encodeURIComponent(value)
    console.log("Submitting: " + value)
    fetch("/submit/" + value)
        .then(response => response.json())
        .then(data => {
            console.log(data)
            switch (data.code) {
                case "success":
                    onSuccess(data)
                    break;

                case "toLong":
                    document.getElementById("error").innerText = "Za długi film :("
                    input.value = ""
                    break;

                default:
                    break;
            }
        })
})


function onSuccess(data) {
    let center = document.getElementById("centerScreen")
    center.innerHTML = ""
    let thumbnail = document.createElement("img")
    thumbnail.src = data.video.thumbnail
    let title = document.createElement("div")
    title.innerText = "Wysyłam sugestię: " + data.video.title
    center.appendChild(thumbnail)
    center.appendChild(title)
    setTimeout(() => window.location.href = "/", 3000)
}