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
    try {
        let element = await VoteElement.findOneAndUpdate({ "video.ytid": videoId }, { $addToSet: { votes: userId } })
        return element.votes.length + 1
    } catch { return 0 }
}

User.unvote = async (videoId, userId) => {
    try {
        let element = await VoteElement.findOneAndUpdate({ "video.ytid": videoId }, { $pull: { votes: userId } })
        return element.votes.length - 1
    } catch { return -1 }
}

User.canSubmit = (video, user) => {
    return user.possibleSubmits.some(s => s == JSON.stringify(video))
}

module.exports = User
