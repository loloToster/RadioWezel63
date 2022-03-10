module.exports = (io, logger) => {
    const express = require("express"),
        router = express.Router()

    const { Types: { ObjectId } } = require("mongoose"),
        Submition = require("./../models/submition"),
        VoteElement = require("./../models/voteElement"),
        User = require("./../models/user"),
        HistoryElement = require("./../models/history"),
        KeyValue = require("./../models/keyValue")

    const lyricsClient = require("lyrics-finder")

    // check if user is admin or moderator
    router.use((req, res, next) => {
        if (req.user && req.user.role.level > 0) next()
        else res.status(404).render("error")
    })

    router.get("/", async (req, res) => {
        res.render("admin", { submitQueue: await Submition.find({}), user: req.user })
    })

    router.put("/verdict", async (req, res) => {
        let id = req.body.id
        let video = await Submition.findOneAndDelete({ ytid: id })
        if (!video) return res.status(500).send()
        switch (req.body.option) {
            case "accept":
                logger.info(`${req.user.name}#${req.user.googleId} accepted: ${video.title} (${video.ytid})`)
                io.sockets.emit("updateVotingQueue", (await VoteElement.add(video)).video)
                break

            case "deny":
                logger.info(`${req.user.name}#${req.user.googleId} denied: ${video.title} (${video.ytid})`)
                break

            default:
                return res.status(500).send()
        }
        io.to("admin").emit("removeSubmit", video.ytid)
    })

    function clearTitle(title) {
        const list = ["official", "official video", "official lyric video", "official music video"]
        title = title.toLowerCase()
        title = title.replace(/\(.*\)|\[.*\]/g, "")
        list.forEach(element => {
            title = title.replace(element, "")
        })
        title = title.trim()
        return title
    }

    router.get("/lyrics/:title", async (req, res) => {
        let title = clearTitle(decodeURIComponent(req.params.title))
        console.log("requesting lyrics for:", title)
        res.send(await lyricsClient(title) || "Nie znalazłem takiej piosenki")
    })

    router.delete("/voteelement/:id", async (req, res) => {
        res.send()
        let id = decodeURIComponent(req.params.id)
        logger.info(`${req.user.name}#${req.user.googleId} deleted: ${id}`)
        let voteElement = await VoteElement.findOneAndDelete({ "video.ytid": id })
        io.emit("removeVoteElement", id)
        await HistoryElement.add({ votes: voteElement.votes, video: voteElement.video })
    })

    function isAdmin(req, res, next) {
        if (req.user && req.user.role.level > 1) next()
        else res.status(404).render("error")
    }

    {
        const usersRouter = express.Router()

        usersRouter.use(isAdmin)

        const roles = require("./../modules/roles")

        const fieldRenames = {
            "name": "name",
            "email": "email",
            "id": "googleId"
        }

        const searchMethods = Object.keys(fieldRenames)

        usersRouter.get("/", async (req, res) => {
            let searchBy = req.query.by,
                searchQuery = req.query.query

            let field = null
            if (searchBy && searchQuery) {
                searchBy = decodeURIComponent(searchBy)
                searchQuery = decodeURIComponent(searchQuery)
                field = fieldRenames[searchBy]
            }

            let filter = {}
            if (field)
                filter[field] = { "$regex": searchQuery, "$options": "i" }

            let users = await User.find(filter).limit(10)
            res.render("users", {
                searchMethods: searchMethods,
                users: users,
                user: req.user,
                by: searchBy,
                query: searchQuery
            })
        })

        usersRouter.put("/:decision/:id", async (req, res) => { // todo: prevent accidental double promote by diffrent admins
            const decision = req.params.decision
            if (decision != "promote" && decision != "depromote")
                return res.status(403).send()
            let id = decodeURIComponent(req.params.id)
            let targetUser = await User.findOne({ googleId: id })
            let newRole
            if (decision == "promote") {
                if (!req.user.canPromote(targetUser)) return res.status(403).send()
                newRole = roles.getNextRole(targetUser.role)
                logger.info(`${req.user.name}#${req.user.googleId} promoted ${targetUser.name}#${targetUser.googleId} to ${newRole.name}`)
            } else {
                if (!req.user.canDepromote(targetUser)) return res.status(403).send()
                newRole = roles.getPrevRole(targetUser.role)
                logger.info(`${req.user.name}#${req.user.googleId} depromoted ${targetUser.name}#${targetUser.googleId} to ${newRole.name}`)
            }
            targetUser = await User.findOneAndUpdate({ googleId: id }, { $set: { role: newRole.level } }, { new: true })
            res.send({
                newRole: newRole,
                promotable: req.user.canPromote(targetUser),
                depromotable: req.user.canDepromote(targetUser)
            })
        })

        router.use("/users", usersRouter)
    }

    {
        const historyRouter = express.Router()

        historyRouter.use(isAdmin)

        historyRouter.get("/", async (req, res) => {
            const history = await HistoryElement.find({})
            res.render("history", { user: req.user, history })
        })

        historyRouter.put("/revive", async (req, res) => {
            let historyElements = await HistoryElement.find(
                { _id: { $in: req.body.map(id => ObjectId(id)) } }
            )

            for (const element of historyElements) {
                element.revive()
            }

            res.send()
        })

        router.use("/history", historyRouter)
    }

    {
        const settingsRouter = express.Router()

        settingsRouter.use(isAdmin)

        settingsRouter.get("/", async (req, res) => {
            const booleanSettings = await KeyValue.find({ value: { $type: "bool" } })
            res.render("admin-settings", { user: req.user, settings: booleanSettings })
        })

        settingsRouter.put("/save", async (req, res) => {
            for (const key in req.body) {
                const value = req.body[key]

                try {
                    await KeyValue.set(key, value)
                } catch {
                    logger.error(`could not change: ${key} to: ${value}`)
                }
            }

            res.send()
        })

        router.use("/settings", settingsRouter)
    }

    router.get("/reset", async (req, res) => {
        if (req.user.level !== Infinity) return res.status(404).render("error")
        logger.info(`${req.user.name}#${req.user.googleId} reseted data`)
        await Submition.deleteMany({})
        await VoteElement.deleteMany({})
        await HistoryElement.deleteMany({})
        res.redirect("/")
    })

    io.on("connection", socket => {
        let auth = socket.handshake.auth
        if (auth.role == "admin")
            socket.join("admin")
    })

    return router
}
