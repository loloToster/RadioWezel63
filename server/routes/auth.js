const express = require("express"),
    router = express.Router()

const passport = require("passport")

const KeyValue = require("../models/keyValue")

async function customGoogleAuth(req, res, next) {
    let AuthenticateOptionsGoogle = {
        prompt: "select_account",
        scope: ["profile", "email"]
    }

    if (!(await KeyValue.get("testing")))
        AuthenticateOptionsGoogle.hd = process.env.MAIL_DOMAIN

    passport.authenticate("google", AuthenticateOptionsGoogle)(req, res, next)
}

router.get("/login", customGoogleAuth)

router.get("/redirect", passport.authenticate("google"), (req, res) => {
    res.redirect("/")
})

router.get("/logout", (req, res) => {
    req.logout()
    res.redirect("/")
})

module.exports = router
