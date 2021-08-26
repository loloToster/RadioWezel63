const { google } = require('googleapis')
const iso = require("iso8601-duration")

const YT_KEYS = process.env.YT_KEYS.split(" ")

function youtubeUrlToId(url) {
    let match = url.match(/^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/)
    return (match && match[7].length == 11) ? match[7] : false
}

async function queryToVideos(query, maxResults = 10) {
    let response
    let id = youtubeUrlToId(query)
    if (id) {
        let snippetAndDetails
        try {
            snippetAndDetails = await google.youtube("v3").videos.list({
                key: YT_KEYS[0],
                part: "snippet,contentDetails",
                id: id
            })
        } catch (err) {
            console.error(err)
            return { code: "error" }
        }
        let data = snippetAndDetails.data.items[0]
        if (!data) {
            console.log("noVideoFound")
            return { code: "noVideoFound" }
        }
        response = {
            code: "success",
            items: [{
                ytid: data.id,
                title: data.snippet.title,
                thumbnail: data.snippet.thumbnails.high.url,
                duration: iso.toSeconds(iso.parse(data.contentDetails.duration))
            }]
        }
    } else {
        let snippets
        try {
            snippets = await google.youtube("v3").search.list({
                key: YT_KEYS[0],
                part: "snippet",
                maxResults: maxResults,
                type: "video",
                q: query
            })
        } catch (err) {
            console.error(err)
            return { code: "error" }
        }
        let data = snippets.data.items
        if (!data.length) {
            console.log("noVideoFound")
            return { code: "noVideoFound" }
        }
        let newItems = []
        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            let video = {}
            video.ytid = item.id.videoId
            let details = await google.youtube("v3").videos.list({
                key: YT_KEYS[0],
                part: "contentDetails",
                id: video.ytid
            })
            video.title = item.snippet.title
            video.thumbnail = item.snippet.thumbnails.high.url
            video.duration = iso.toSeconds(iso.parse(details.data.items[0].contentDetails.duration))
            newItems.push(video)
        }
        response = { code: "success", items: newItems }
    }
    return response
}

module.exports = queryToVideos
