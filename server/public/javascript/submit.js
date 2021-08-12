document.getElementById("submit").addEventListener("click", () => {
    let value = document.querySelector("input").value
    if (!value.trim()) {
        console.log("Empty")
        return
    }
    console.log("Submitting: " + value)
    fetch("/submit/" + value).then(response => {
        console.log(response)
        return response.json()
    }).then(data => {
        console.log(data)
        window.location.href = "/"
    })
})