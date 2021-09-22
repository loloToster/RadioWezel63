const URL = process.env.HEROKU_URL
const axios = require("axios").default

function start() {
    if (!URL)
        return console.log("Not keeping awake")
    else
        console.log("Keeping awake:", URL)
    setInterval(() => {
        axios.get(URL).catch(err => { })
    }, 10 * 60 * 1000)
}

module.exports = { start: start }
