const express = require("express"),
    router = express.Router()

const passport = require("passport")

router.get("/login", passport.authenticate("google", {
    scope: ["profile", "email"]
}))

router.get("/redirect", passport.authenticate("google"), (req, res) => {
    res.redirect("/")
})

router.get("/logout", (req, res) => {
    req.logout()
    res.redirect("/")
})

module.exports = router
