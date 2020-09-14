const mongoose = require("mongoose");

const dataSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    longitude: {
        type: String,
    },
    latitude: {
        type: String,
    },
    timestamp: {
        type: String,
    },
    image: {
        type: String
    },
    caption: {
        type: String
    }
});

module.exports = mongoose.model("Data", dataSchema);