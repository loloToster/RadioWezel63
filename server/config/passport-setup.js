const passport = require("passport"),
    googleStrategy = require("passport-google-oauth20"),
    User = require("./../models/user")

passport.serializeUser((user, done) => {
    done(null, user.googleId)
})

passport.deserializeUser(async (id, done) => {
    user = await User.findOne({ googleId: id })
    done(null, user)
})

passport.use(
    new googleStrategy({
        callbackURL: "/auth/redirect",
        clientID: process.env.GOOGLE_AUTH_ID,
        clientSecret: process.env.GOOGLE_AUTH_SECRET
    }, async (accessToken, refreshToken, profile, done) => {
        if (process.env.MAIL_DOMAIN == profile._json.hd) {
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
                global.logger.info("New user: " + profile.displayName)
                done(null, newUser)
            }
        } else {
            done(new Error("Invalid host domain"));
        }
    })
)
