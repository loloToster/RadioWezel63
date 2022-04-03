const express = require("express"),
    router = express.Router()

const passport = require("passport")

const KeyValue = require("../models/keyValue")

async function customGoogleAuth(req, res, next, verifiedEmail) {
    let authOptions = {
        prompt: "select_account",
        scope: ["profile", "email"]
    }

    if (!(await KeyValue.get("testing")) && !verifiedEmail)
        authOptions.hd = process.env.MAIL_DOMAIN

    passport.authenticate("google", authOptions)(req, res, next)
}

router.get("/", (req, res) => {
    if (req.user) return res.redirect("/")
    res.render("login")
})

router.get("/login", (req, res, next) => {
    customGoogleAuth(req, res, next, req.query.v == "true")
})

router.get("/redirect", passport.authenticate("google"), (req, res) => {
    res.redirect("/")
})

router.get("/logout", (req, res) => {
    req.logout()
    res.redirect("/")
})

module.exports = router
