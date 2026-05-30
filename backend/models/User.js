const mongoose = require("mongoose");

/**
 * User Schema
 * Stores user credentials for login system
 */
const userSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true // no duplicate accounts
    },

    password: {
        type: String,
        required: true
    }

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);