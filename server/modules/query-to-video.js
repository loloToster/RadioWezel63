const { google } = require("googleapis")
const scrapSearch = require("youtube-search-without-api-key")
const iso = require("iso8601-duration")
const ytMusic = require("node-youtube-music")

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

async function searchOnYTMusic(query, maxResults) {
    let songs = await ytMusic.searchMusics(query)
    let items = []
    if (!songs.length) return { done: false }
    for (let i = 0; i < songs.length && items.length <= maxResults; i++) {
        const song = songs[i]
        let thumbnail = song.thumbnailUrl.replace(/=w\d+-h/, "=w350-h").replace(/-h\d+-/, "-h350-")
        items.push({
            ytid: song.youtubeId,
            title: song.title,
            creator: song.artists.map(a => a.name).join(", "),
            thumbnail: thumbnail,
            duration: song.duration.totalSeconds,
            explicit: song.isExplicit
        })
    }
    return { done: true, items: items }
}

async function searchWithScraping(query, maxResults) {
    let id = youtubeUrlToId(query)
    let videos = await scrapSearch.search(id ? id : query)
    if (videos.length && videos) {
        let items = []
        for (let i = 0; i < videos.length && items.length <= maxResults; i++) {
            const video = videos[i]
            let duration = video.duration_raw
            if (!duration) { continue }
            items.push({
                ytid: video.id.videoId,
                title: video.title,
                creator: video.creator,
                thumbnail: video.snippet.thumbnails.url,
                duration: hmsToSeconds(video.duration_raw)
            })
        }
        return { done: true, items: items }
    }
    return { done: false }
}

async function searchWithApi(query, key, maxResults) {
    let id = youtubeUrlToId(query)
    if (id) {
        let snippetAndDetails
        try {
            snippetAndDetails = await google.youtube("v3").videos.list({
                key: key,
                part: "snippet,contentDetails",
                id: id
            })
        } catch (err) {
            //console.error(err)
            return { done: false, code: "error" }
        }
        let data = snippetAndDetails.data.items[0]
        if (!data) {
            console.log("noVideoFound")
            return { done: false, code: "noVideoFound" }
        }
        return {
            done: true,
            code: "success",
            items: [{
                ytid: data.id,
                title: data.snippet.title,
                creator: data.snippet.channelTitle,
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
            //console.error(err)
            return { done: false, code: "error" }
        }
        let data = snippets.data.items
        if (!data.length) {
            console.log("noVideoFound")
            return { done: false, code: "noVideoFound" }
        }
        let newItems = []
        for (let i = 0; i < data.length; i++) {
            const item = data[i]
            let video = {}
            video.ytid = item.id.videoId
            let details
            try {
                details = await google.youtube("v3").videos.list({
                    key: key,
                    part: "contentDetails",
                    id: video.ytid
                })
            } catch (err) {
                //console.error(err)
                return { done: false, code: "error" }
            }
            video.title = item.snippet.title
            video.creator = item.snippet.channelTitle
            video.thumbnail = item.snippet.thumbnails.high.url
            video.duration = iso.toSeconds(iso.parse(details.data.items[0].contentDetails.duration))
            newItems.push(video)
        }
        return { done: true, code: "success", items: newItems }
    }
}

async function queryToVideos(query, keys, maxResults = 10, depth = 3) {
    let curDepth = 1
    console.log("Searching on yt-music")
    let result = await searchOnYTMusic(query, maxResults)
    if (result.done) return { code: "success", items: result.items }
    if (curDepth == depth) return { code: "error" }

    curDepth++
    console.log("Searching with Scraping")
    result = await searchWithScraping(query, maxResults)
    if (result.done) return { code: "success", items: result.items }
    if (curDepth == depth) return { code: "error" }

    console.log("Searching with API")
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        console.log("Searching with key: " + key)
        result = await searchWithApi(query, key, maxResults)
        if (result.done) return { code: "success", items: result.items }
        if (result.code == "noVideoFound") return { code: "noVideoFound" }
    }
    return { code: "error" }
}

module.exports = queryToVideos
