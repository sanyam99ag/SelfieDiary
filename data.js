const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema({
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

module.exports = mongoose.model("data", slotSchema);