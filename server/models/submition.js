const mongoose = require("mongoose")
const Schema = mongoose.Schema

const VoteElement = require("./voteElement")

const submitionSchema = new Schema({
    ytid: { type: String, unique: true, required: true, dropDups: true },
    title: String,
    creator: String,
    thumbnail: String,
    duration: Number
})

const Submition = mongoose.model("submitions", submitionSchema)

Submition.submitted = async video => {
    return !!((await Submition.findOne({ ytid: video.ytid })) || (await VoteElement.findOne({ "video.ytid": video.ytid })))
}

Submition.add = async video => {
    try {
        await new Submition(video).save()
    } catch { /* pass */ }
}

module.exports = Submition
