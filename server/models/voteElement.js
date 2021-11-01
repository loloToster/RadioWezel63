const mongoose = require("mongoose")
const Schema = mongoose.Schema

const voteElementSchema = new Schema({
    votes: Number,
    video: Object
})

const VoteElement = mongoose.model("voteelements", voteElementSchema)

VoteElement.add = async video => {
    let element = {
        votes: 0, video: video
    }
    await new VoteElement(element).save()
    return element
}

VoteElement.mostPopular = async () => {
    return await VoteElement.findOne({}).sort("-votes")
}


module.exports = VoteElement
