document.getElementById("submit").addEventListener("click", () => {
    let value = document.querySelector("input").value
    if (!value.trim()) {
        console.log("Empty")
        return
    }
    value = encodeURIComponent(value)
    console.log("Submitting: " + value)
    fetch("/submit/" + value).then(response => {
        console.log(response)
        window.location.href = "/"
    })
})