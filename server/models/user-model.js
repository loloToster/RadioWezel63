const mongoose = require("mongoose")
const Schema = mongoose.Schema

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

module.exports = User
