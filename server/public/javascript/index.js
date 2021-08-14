const socket = io()

socket.on("videoUpdate", message => {
    console.log(message)
})