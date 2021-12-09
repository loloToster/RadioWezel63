const mongoose = require("mongoose")

const VoteElement = require("./voteElement")

const userSchema = new mongoose.Schema({
    name: String,
    googleId: String,
    email: String,
    thumbnail: String,
    role: { type: String, default: "user" },
    notes: { type: Number, default: 30 },
    possibleSubmits: { type: Array, default: [] }
})

userSchema.method("vote", async function (videoId) {
    try {
        let element = await VoteElement.findOneAndUpdate({ "video.ytid": videoId }, { $addToSet: { votes: this.googleId } })
        return element.votes.length + 1
    } catch { return 0 }
})

userSchema.method("unvote", async function (videoId) {
    try {
        let element = await VoteElement.findOneAndUpdate({ "video.ytid": videoId }, { $pull: { votes: this.googleId } })
        return element.votes.length - 1
    } catch { return -1 }
})

userSchema.method("canSubmit", async function (video) {
    return this.possibleSubmits.some(s => s == JSON.stringify(video))
})

userSchema.method("setPossibleSubmits", async function (possibleSubmits) {
    await this.updateOne({ possibleSubmits: possibleSubmits })
})

const User = mongoose.model("user", userSchema)

module.exports = User
