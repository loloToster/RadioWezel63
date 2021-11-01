const mongoose = require("mongoose")
const Schema = mongoose.Schema

const VoteElement = require("./voteElement")

const userSchema = new Schema({
    name: String,
    googleId: String,
    email: String,
    thumbnail: String,
    role: { type: String, default: "user" },
    notes: { type: Number, default: 30 },
    possibleSubmits: { type: Array, default: [] }
})

const User = mongoose.model("user", userSchema)

User.vote = async (videoId, userId) => {
    console.log(videoId, userId)
    let element = await VoteElement.findOne({ "video.ytid": videoId })
    if (!element || element.votes.includes(userId))
        return 0
    element.votes.push(userId)
    await element.save()
    return element.votes.length
}

module.exports = User
