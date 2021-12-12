const passport = require("passport"),
    googleStrategy = require("passport-google-oauth20")

const User = require("./../models/user"),
    KeyValue = require("./../models/keyValue")

passport.serializeUser((user, done) => {
    done(null, user.googleId)
})

passport.deserializeUser(async (id, done) => {
    let user = await User.findOne({ googleId: id })
    done(null, user)
})

passport.use(
    new googleStrategy({
        callbackURL: "/auth/redirect",
        clientID: process.env.GOOGLE_AUTH_ID,
        clientSecret: process.env.GOOGLE_AUTH_SECRET
    }, async (_, __, profile, done) => {
        let check
        if (await KeyValue.get("testing")) {
            let testers = await KeyValue.get("testers")
            check = testers.includes(profile._json.email)
        } else {
            check = process.env.MAIL_DOMAIN == profile._json.hd
        }

        if (!check)
            return done(new Error("Error occured"))

        let currentUser = await User.findOne({ googleId: profile.id })
        if (currentUser) {
            done(null, currentUser)
        } else {
            let newUser = await new User({
                name: profile.displayName,
                googleId: profile.id,
                email: profile._json.email,
                thumbnail: profile._json.picture
            }).save()
            done(null, newUser)
        }
    })
)
