const mongoose = require("mongoose");

const bookmarkSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Document",
        required: true
    },

    // The highlighted text snippet (used both for display and to
    // re-find/re-highlight the matching text layer spans on that page)
    text: {
        type: String,
        required: true
    },

    page: {
        type: Number,
        required: true
    },

    // Optional short note the user can attach to a bookmark
    note: {
        type: String,
        default: ""
    },

    color: {
        type: String,
        default: "yellow"
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("Bookmark", bookmarkSchema);
