function reconnection(sckt) {
    let disconnectMsg = document.createElement("div")
    disconnectMsg.classList.add("disconnectedMsg")
    let disconnectImg = document.createElement("img")
    disconnectImg.src = "/images/broken-vinyl.png"
    disconnectMsg.appendChild(disconnectImg)
    let disconnectedMsgText = document.createElement("div")
    disconnectedMsgText.innerText = "Rozłączono z serwerem :/"
    disconnectMsg.appendChild(disconnectedMsgText)

    sckt.on("disconnect", () => {
        console.log("disconnected")
        document.body.innerHTML = ""
        console.log(disconnectMsg)
        document.body.appendChild(disconnectMsg)
        reconnect()
    })

    function reconnect() {
        if (sckt.disconnected)
            setTimeout(reconnect, 10)
        else
            window.location.reload()
    }
}
