socket.on("disconnect", () => {
    console.log("disconnected")
    document.body.innerHTML = ""
    document.body.innerText = "disconnected"
    reconnect()
})

function reconnect() {
    if (socket.disconnected)
        setTimeout(() => reconnect(), 10)
    else
        window.location.reload()
}