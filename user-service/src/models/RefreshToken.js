const mongoose = require('mongoose');

const refreshTokenschema = new mongoose.Schema({
    token : {
        type: String,
        required: true,
        unique: true
    },
    user : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true
    },
    expiresAt : {
        type: Date,
        required: true
    } 
}, {timestamps : true});

refreshTokenschema.index({ expiresAt : 1 }, { expiresAfterSeconds: 0});

module.exports = mongoose.model("RefreshToken", refreshTokenschema)