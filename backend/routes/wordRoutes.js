const express = require("express");
const router = express.Router();
const { getWords, addWord, getQuiz, updateStatus, updateNote } = require("../controllers/wordController");
const protect = require("../middleware/authMiddleware");

router.post("/", protect, addWord);
router.get("/", protect, getWords);
router.get("/quiz", protect, getQuiz);
router.patch("/:id/status", protect, updateStatus);
router.patch("/:id/note", protect, updateNote);

module.exports = router;

// DELETE word
const deleteWord = async (req, res) => {
    const Word = require("../models/Word");
    try {
        const { id } = req.params;
        const word = await Word.findOneAndDelete({ _id: id, userId: req.user });
        if (!word) return res.status(404).json({ message: "Word not found" });
        res.json({ message: "Word deleted" });
    } catch (err) {
        res.status(500).json({ message: "Failed to delete word" });
    }
};

router.delete("/:id", protect, deleteWord);
