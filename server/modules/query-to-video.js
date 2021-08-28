const { google } = require("googleapis")
const scrapSearch = require("youtube-search-without-api-key")
const iso = require("iso8601-duration")

function hmsToSeconds(str) {
    let p = str.split(':'),
        s = 0,
        m = 1
    while (p.length > 0) {
        s += m * parseInt(p.pop(), 10);
        m *= 60;
    }
    return s
}

function youtubeUrlToId(url) {
    let match = url.match(/^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/)
    return (match && match[7].length == 11) ? match[7] : false
}

async function queryToVideos(query, key, maxResults = 10) {
    let response
    let id = youtubeUrlToId(query)

    // Scraping Search
    let videos = await scrapSearch.search(query)
    if (videos.length) {
        let items = []
        for (let i = 0; i < videos.length || items.length <= maxResults; i++) {
            const video = videos[i];
            let duration = video.duration_raw
            if (!duration) { continue }
            items.push({
                ytid: video.id.videoId,
                title: video.title,
                thumbnail: video.snippet.thumbnails.url,
                duration: hmsToSeconds(video.duration_raw)
            })
        }
        response = { code: "success", items: items }
        return response
    }

    // Google Api Search
    if (id) {
        let snippetAndDetails
        try {
            snippetAndDetails = await google.youtube("v3").videos.list({
                key: key,
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
                key: key,
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
                key: key,
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
