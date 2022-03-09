const mongoose = require("mongoose")

const VoteElement = require("./voteElement")

const historyElementSchema = new mongoose.Schema({
    voteElement: {
        votes: Array,
        video: Object
    },
    createdAt: { type: Date, expires: "8h", default: Date.now }
}, { collection: "history" })

historyElementSchema.method("revive", async function () {
    await VoteElement.add(this.voteElement.video, this.voteElement.votes)
    await this.delete()
})

const HistoryElement = mongoose.model("history", historyElementSchema)

HistoryElement.add = async voteElement => {
    await new HistoryElement({ voteElement }).save()
}

module.exports = HistoryElement
