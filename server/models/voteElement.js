const mongoose = require("mongoose")

const voteElementSchema = new mongoose.Schema({
    votes: { type: Array, default: [] },
    video: Object,
})

const VoteElement = mongoose.model("voteelements", voteElementSchema)

VoteElement.add = async (video, votes = []) => {
    let element = {
        votes,
        video: {
            ytid: video.ytid,
            title: video.title,
            thumbnail: video.thumbnail,
            creator: video.creator,
            duration: video.duration
        }
    }
    await new VoteElement(element).save()
    return element
}

VoteElement.mostPopular = async () => {
    let elements = await VoteElement.find({})
    let lastLength = -1
    let mostPopular = null
    elements.forEach(e => {
        const length = e.votes.length
        if (length > lastLength) {
            mostPopular = e
            lastLength = length
        }
    })
    return mostPopular
}


module.exports = VoteElement
