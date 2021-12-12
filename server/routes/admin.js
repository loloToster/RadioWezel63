module.exports = (io, logger) => {
    const express = require("express"),
        router = express.Router()

    const Submition = require("./../models/submition"),
        VoteElement = require("./../models/voteElement"),
        User = require("./../models/user")

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
        let dbRes = await VoteElement.deleteOne({ "video.ytid": id })
        if (!dbRes.deletedCount) return
        io.emit("removeVoteElement", id)
    })

    // check if user is admin for the rest of routes
    router.use((req, res, next) => {
        if (req.user && req.user.role.level > 1) next()
        else res.status(404).render("error")
    })

    const roles = require("./../modules/roles")

    const fieldRenames = {
        "name": "name",
        "email": "email",
        "id": "googleId"
    }

    const searchMethods = Object.keys(fieldRenames)

    router.get("/users", async (req, res) => {
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

    router.put("/users/promote/:id", async (req, res) => {
        let id = decodeURIComponent(req.params.id)
        let targetUser = await User.findOne({ googleId: id })
        if (!req.user.canPromote(targetUser)) return res.status(403).send()
        let newRole = roles.getNextRole(targetUser.role)
        logger.info(`${req.user.name}#${req.user.googleId} promoted data ${targetUser.name}#${targetUser.googleId} to ${newRole.name}`)
        await User.updateOne({ googleId: id }, { $set: { role: newRole.level } })
        res.send(newRole)
    })

    router.put("/users/depromote/:id", async (req, res) => {
        let id = decodeURIComponent(req.params.id)
        let targetUser = await User.findOne({ googleId: id })
        if (!req.user.canDepromote(targetUser)) return res.status(403).send()
        let newRole = roles.getPrevRole(targetUser.role)
        logger.info(`${req.user.name}#${req.user.googleId} depromoted data ${targetUser.name}#${targetUser.googleId} to ${newRole.name}`)
        await User.updateOne({ googleId: id }, { $set: { role: newRole.level } })
        res.send(newRole)
    })

    router.get("/reset", async (req, res) => {
        if (req.user.level !== Infinity) return res.status(404).render("error")
        logger.info(`${req.user.name}#${req.user.googleId} reseted data`)
        await Submition.deleteMany({})
        await VoteElement.deleteMany({})
        res.redirect("/")
    })

    io.on("connection", socket => {
        let auth = socket.handshake.auth
        if (auth.role == "admin")
            socket.join("admin")
    })

    return router
}
