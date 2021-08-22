require('dotenv').config()
const passport = require("passport")
const googleStrategy = require("passport-google-oauth20")
const User = require("../models/user-model")

passport.serializeUser((user, done) => {
    done(null, user.googleId)
})

passport.deserializeUser(async (id, done) => {
    user = await User.findOne({ googleId: id })
    done(null, user)
})

passport.use(
    new googleStrategy({
        callbackURL: "/redirect",
        clientID: process.env.GOOGLE_AUTH_ID,
        clientSecret: process.env.GOOGLE_AUTH_SECRET
    }, async (accessToken, refreshToken, profile, done) => {
        let currentUser = await User.findOne({ googleId: profile.id })
        if (currentUser) {
            console.log("user is:" + currentUser)
            done(null, currentUser)
        } else {
            let newUser = await new User({
                name: profile.displayName,
                googleId: profile.id,
                email: profile._json.email,
                thumbnail: profile._json.picture
            }).save()
            console.log("New user: " + newUser)
            done(null, newUser)
        }
    })
)
