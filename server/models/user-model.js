const mongoose = require("mongoose")
const Schema = mongoose.Schema

const userSchema = new Schema({
    name: String,
    googleId: String,
    email: String,
    thumbnail: String,
    notes: { type: Number, default: 30 }
})

const User = mongoose.model("user", userSchema)

module.exports = User
