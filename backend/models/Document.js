const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    fileName: {
        type: String,
        required: true
    },

    // Base64-encoded PDF bytes (data URI without the "data:application/pdf;base64," prefix)
    fileData: {
        type: String,
        required: true
    },

    fileSize: {
        type: Number,
        default: 0
    },

    pageCount: {
        type: Number,
        default: 0
    },

    // Last page the user was on, so reopening resumes where they left off
    lastPage: {
        type: Number,
        default: 1
    },

    lastOpenedAt: {
        type: Date,
        default: Date.now
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("Document", documentSchema);
