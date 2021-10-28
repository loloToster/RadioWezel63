const mongoose = require("mongoose")
const Schema = mongoose.Schema

const keyValueSchema = new Schema({
    key: String,
    value: Schema.Types.Mixed
})

const KeyValue = mongoose.model("keyvalue", keyValueSchema)
KeyValue.get = async (key) => (await KeyValue.findOne({ key: key })).value

module.exports = KeyValue
