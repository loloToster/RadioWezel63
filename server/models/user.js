const mongoose = require("mongoose")

const VoteElement = require("./voteElement")

const roles = require("./../modules/roles")

const userSchema = new mongoose.Schema({
    name: String,
    googleId: String,
    email: String,
    thumbnail: String,
    role: { type: mongoose.Schema.Types.Mixed, default: 0 },
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

userSchema.method("canSubmit", function (video) {
    return this.possibleSubmits.some(s => s == JSON.stringify(video))
})

userSchema.method("setPossibleSubmits", async function (possibleSubmits) {
    await this.updateOne({ possibleSubmits: possibleSubmits })
})

userSchema.post("init", function () {
    this.role = roles.getRoleByLevel(this.role)
})

userSchema.method("canPromote", function (user) {
    if (this.googleId === user.googleId) return false
    let nextRole = roles.getNextRole(user.role)
    if (!nextRole) return false
    if (this.role.level === Infinity) return true
    return nextRole.level < this.role.level
})

userSchema.method("canDepromote", function (user) {
    if (this.googleId === user.googleId) return false
    let prevRole = roles.getPrevRole(user.role)
    if (!prevRole) return false
    if (this.role.level === Infinity) return true
    return user.role.level < this.role.level
})

const User = mongoose.model("user", userSchema)

module.exports = User
