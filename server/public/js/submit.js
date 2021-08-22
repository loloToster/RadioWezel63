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
            errorDiv = document.getElementById("error")
            switch (data.code) {
                case "success":
                    onSuccess(data)
                    break

                case "toLong":
                    errorDiv.innerText = "Za długi film :("
                    input.value = ""
                    break

                case "alreadySubmitted":
                    onSuccess(data)
                    break

                case "noVideoFound":
                    errorDiv.innerText = "Nie znalazłem takiego video :("
                    input.value = ""

                default:
                    break
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
