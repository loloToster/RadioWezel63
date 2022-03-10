const mongoose = require("mongoose")

const keyValueSchema = new mongoose.Schema({
    key: String,
    value: mongoose.Schema.Types.Mixed
})

const KeyValue = mongoose.model("keyvalue", keyValueSchema)

KeyValue.get = async (key) => (await KeyValue.findOne({ key })).value
KeyValue.set = async (key, value) => await KeyValue.updateOne({ key }, { value })

module.exports = KeyValue
