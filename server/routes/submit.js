module.exports = (io, logger) => {
    const express = require("express"),
        router = express.Router()

    const YT_KEYS = process.env.YT_KEYS?.split(" ") ?? []
    const MAX_DURATION = 300

    const Submition = require("./../models/submition"),
        VoteElement = require("./../models/voteElement"),
        KeyValue = require("./../models/keyValue")

    // check if logged in
    router.use((req, res, next) => {
        if (req.user) next()
        else res.status(401).render("error", {
            bigText: "401",
            smallText: "Aby uzyskać dostęp do tej strony musisz najpierw się <a href=\"/auth/login\">zalogować</a>"
        })
    })

    // check if submitting is blocked
    router.use(async (req, res, next) => {
        if (await KeyValue.get("block-submitting"))
            res.status(405).render("error", {
                bigText: "405",
                smallText: "Dodawanie piosenek zostało zablokowane przez administratora"
            })
        else next()
    })

    const queryToVideos = require("./../modules/query-to-video")

    router.get("/", async (req, res) => {
        let query = req.query.q

        let searchResults = []

        if (query) {
            query = decodeURIComponent(query)
            let allowFallbackToYTSearch = await KeyValue.get("allow-fallback-to-youtube-search")
            videos = await queryToVideos(query, YT_KEYS, 10, allowFallbackToYTSearch ? 3 : 1)
            if (videos.code == "success") {
                let possibleSubmits = []
                for (let i = 0; i < videos.items.length; i++) {
                    let submitted = await Submition.submitted(videos.items[i])
                    let toLong = videos.items[i].duration > MAX_DURATION

                    videos.items[i].submitted = submitted
                    videos.items[i].toLong = toLong

                    if (!submitted && !toLong)
                        possibleSubmits.push(
                            JSON.stringify(videos.items[i])
                        )
                }
                await req.user.setPossibleSubmits(possibleSubmits)
                searchResults = videos.items
            }
        }

        res.render("submit", {
            query,
            results: searchResults
        })
    })

    async function handleSubmition(video, user) {
        if (!(await Submition.submitted(video))) {
            if (user.role.level > 0 && await KeyValue.get("self-accept-activated")) {
                logger.info(`${user.googleId} self-accepted: ${video.title} (${video.ytid})`)
                io.sockets.emit("updateVotingQueue", (await VoteElement.add(video)).video)
            } else {
                logger.info(`${user.googleId} submitted: ${video.title} (${video.ytid})`)
                await Submition.add(video)
                io.to("admin").emit("addSubmit", video)
            }
        }
        return video
    }

    router.post("/post", async (req, res) => {
        if (req.user.canSubmit(req.body)) {
            await req.user.setPossibleSubmits([])
            res.json(await handleSubmition(req.body, req.user))
        } else {
            res.status(405).send()
        }
    })

    return router
}
