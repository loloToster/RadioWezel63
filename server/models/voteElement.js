const mongoose = require("mongoose")
const Schema = mongoose.Schema

const voteElementSchema = new Schema({
    votes: { type: Array, default: [] },
    video: Object,
})

const VoteElement = mongoose.model("voteelements", voteElementSchema)

VoteElement.add = async video => {
    let element = {
        votes: [], video: video
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
