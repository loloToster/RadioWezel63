const mongoose = require("mongoose")
const Schema = mongoose.Schema

const submitionSchema = new Schema({
    ytid: String,
    title: String,
    thumbnail: String,
    duration: Number
})

const Submition = mongoose.model("submitions", submitionSchema)

module.exports = Submition
