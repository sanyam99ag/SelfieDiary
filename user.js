const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    data: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'data'
    }]
})

module.exports = mongoose.model('User', userSchema)