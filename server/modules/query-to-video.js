const { google } = require('googleapis')
const iso = require("iso8601-duration")

const YT_KEYS = process.env.YT_KEYS.split(" ")

function youtubeUrlToId(url) {
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/
    var match = url.match(regExp)
    return (match && match[7].length == 11) ? match[7] : false
}

async function queryToVideo(query) {
    let response
    let id = youtubeUrlToId(query)
    if (id) {
        try {
            response = await google.youtube("v3").videos.list({
                key: YT_KEYS[0],
                part: "snippet,contentDetails",
                id: id
            })
        } catch (err) {
            console.error(err)
            return { code: "error" }
        }
        let data = response.data.items[0]
        if (!data) {
            console.log("noVideoFound")
            return { code: "noVideoFound" }
        }
        response = {
            code: "success",
            video: {
                id: data.id,
                title: data.snippet.title,
                thumbnail: data.snippet.thumbnails.high.url,
                duration: iso.toSeconds(iso.parse(data.contentDetails.duration))
            }
        }
    } else {
        try {
            response = await google.youtube("v3").search.list({
                key: YT_KEYS[0],
                part: "snippet",
                maxResults: 1,
                type: "video",
                q: query
            })
        } catch (err) {
            console.error(err)
            return { code: "error" }
        }
        let data = response.data.items[0]
        if (!data) {
            console.log("noVideoFound")
            return { code: "noVideoFound" }
        }
        let video = {}
        video.id = data.id.videoId
        video.title = data.snippet.title
        video.thumbnail = data.snippet.thumbnails.high.url
        response = await google.youtube("v3").videos.list({
            key: YT_KEYS[0],
            part: "contentDetails",
            id: video.id
        })
        data = response.data.items[0]
        video.duration = iso.toSeconds(iso.parse(data.contentDetails.duration))
        response = { code: "success", video: video }
    }
    return response
}

module.exports = queryToVideo
