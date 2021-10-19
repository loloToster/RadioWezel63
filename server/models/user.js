const mongoose = require("mongoose")
const Schema = mongoose.Schema

const VoteElement = require("./voteElement")

const userSchema = new Schema({
    name: String,
    googleId: String,
    email: String,
    thumbnail: String,
    role: { type: String, default: "user" },
    votes: { type: Array, default: [] },
    notes: { type: Number, default: 30 },
    possibleSubmits: { type: Array, default: [] }
})

const User = mongoose.model("user", userSchema)

User.vote = async (videoId, userId) => {
    let element = await VoteElement.findOneAndUpdate({ "video.ytid": videoId }, { $inc: { votes: 1 } })
    if (!element) return 0
    await User.findOneAndUpdate({ googleId: userId }, { $push: { votes: videoId } })
    return element.votes + 1
}

module.exports = User
