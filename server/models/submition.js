const mongoose = require("mongoose")
const Schema = mongoose.Schema

const VoteElement = require("./voteElement")

const submitionSchema = new Schema({
    ytid: String,
    title: String,
    thumbnail: String,
    duration: Number
})

const Submition = mongoose.model("submitions", submitionSchema)

Submition.submitted = async video => {
    return (await Submition.findOne({ ytid: video.ytid })) || (await VoteElement.findOne({ "video.ytid": video.ytid }))
}

module.exports = Submition
