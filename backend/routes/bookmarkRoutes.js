const express  = require("express");
const router   = express.Router();
const protect  = require("../middleware/authMiddleware");
const Bookmark = require("../models/Bookmark");

/* ─────────────────────────────────────────────────────────
   POST /api/bookmarks
   Save a highlighted text selection as a bookmark
────────────────────────────────────────────────────────── */
router.post("/", protect, async (req, res) => {
    try {
        const { documentId, text, page, note } = req.body;

        if (!documentId || !text || !page) {
            return res.status(400).json({ message: "documentId, text, and page are required" });
        }

        const bookmark = await Bookmark.create({
            userId: req.user,
            documentId,
            text: text.trim().slice(0, 1000),
            page,
            note: note?.trim().slice(0, 300) || ""
        });

        res.status(201).json(bookmark);
    } catch (error) {
        console.log("BOOKMARK CREATE ERROR:", error.message);
        res.status(500).json({ message: "Failed to save bookmark" });
    }
});

/* ─────────────────────────────────────────────────────────
   GET /api/bookmarks/:documentId
   List all bookmarks for a given PDF, oldest page first
────────────────────────────────────────────────────────── */
router.get("/:documentId", protect, async (req, res) => {
    try {
        const bookmarks = await Bookmark.find({
            documentId: req.params.documentId,
            userId: req.user
        }).sort({ page: 1, createdAt: 1 });

        res.json(bookmarks);
    } catch (error) {
        res.status(500).json({ message: "Failed to load bookmarks" });
    }
});

/* ─────────────────────────────────────────────────────────
   DELETE /api/bookmarks/:id
────────────────────────────────────────────────────────── */
router.delete("/:id", protect, async (req, res) => {
    try {
        const bookmark = await Bookmark.findOneAndDelete({ _id: req.params.id, userId: req.user });
        if (!bookmark) return res.status(404).json({ message: "Bookmark not found" });
        res.json({ message: "Bookmark deleted" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete bookmark" });
    }
});

module.exports = router;
