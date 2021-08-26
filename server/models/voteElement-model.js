const mongoose = require("mongoose")
const Schema = mongoose.Schema

const voteElementSchema = new Schema({
    votes: Number,
    video: Object
})

const VoteElement = mongoose.model("voteElements", voteElementSchema)

module.exports = VoteElement
