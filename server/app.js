console.log("start")
const express = require("express")
const http = express()
const path = require("path")

http.use(express.static(path.join(__dirname, "public")))
http.use(express.urlencoded({ extended: false }))

http.set("view engine", "ejs")
http.set("views", path.join(__dirname, "views"))

http.get("/", (req, res) => {
    res.render("index")
})

http.get("/submit", (req, res) => {
    res.render("submit")
})

http.get("/submit/:submition", (req, res) => {
    let submition = req.params.submition
    console.log(submition)
    let response = { title: submition, thumbnail: "someimage" }
    res.json(response)
})

http.use(function (req, res) {
    res.status(404).render('error');
});

http.listen(3000)