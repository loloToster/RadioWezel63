socket.on("disconnect", () => {
    console.log("disconnected")
    document.body.innerHTML = "<div>disconnected</div>"
    reconnect()
})

function reconnect() {
    if (socket.disconnected)
        setTimeout(() => reconnect(), 10)
    else
        window.location.reload()
}
