const express = require("express");
const router = express.Router();
const multer = require("multer");
const axios = require("axios");
const protect = require("../middleware/authMiddleware");
const Word = require("../models/Word");

const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /api/ocr/extract
 * Send image → OCR detects highlighted/underlined words
 * → fetch meanings → save to vocab
 */
router.post("/extract", protect, upload.single("image"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No image uploaded" });

        // Step 1 — Send image to OCR service
        const ocrRes = await axios.post(
            "http://localhost:5003/extract",
            req.file.buffer,
            {
                headers: {
                    "Content-Type": req.file.mimetype,
                    "Content-Length": req.file.buffer.length
                },
                maxBodyLength: Infinity,
                timeout: 30000
            }
        );

        const { words, highlighted, underlined } = ocrRes.data;

        if (!words || words.length === 0) {
            return res.status(200).json({
                message: "No highlighted or underlined words found. Make sure words are clearly highlighted in yellow.",
                added: [],
                skipped: []
            });
        }

        // Step 2 — For each word, get meaning and save
        const added = [];
        const skipped = [];

        for (const word of words) {
            try {
                // Skip if already exists
                const exists = await Word.findOne({ userId: req.user, word });
                if (exists) {
                    skipped.push(word);
                    continue;
                }

                // Try RAG first, then dictionary API
                let meaning = "No meaning found";
                let exampleSentence = "No example available";
                let synonyms = [];

                try {
                    const ragRes = await axios.post(
                        "http://localhost:5002/lookup",
                        { word },
                        { timeout: 2000 }
                    );
                    if (ragRes.data?.meaning) {
                        meaning = ragRes.data.meaning;
                        exampleSentence = ragRes.data.exampleSentence || "No example available";
                    }
                } catch {
                    // RAG not available, try dictionary API
                    try {
                        const dictRes = await axios.get(
                            `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`,
                            { timeout: 5000 }
                        );
                        const data = dictRes.data?.[0];
                        meaning = data?.meanings?.[0]?.definitions?.[0]?.definition || "No meaning found";
                        exampleSentence = data?.meanings?.[0]?.definitions?.[0]?.example || "No example available";
                        synonyms = data?.meanings?.[0]?.definitions?.[0]?.synonyms || [];
                    } catch {
                        // Word not in dictionary — still save it
                    }
                }

                const newWord = await Word.create({
                    userId: req.user,
                    word,
                    meaning,
                    exampleSentence,
                    synonyms,
                    status: "review"
                });

                added.push(newWord);

            } catch (err) {
                console.log(`OCR: failed to add "${word}":`, err.message);
                skipped.push(word);
            }
        }

        res.json({
            message: `Added ${added.length} words from image!`,
            added,
            skipped,
            highlighted,
            underlined,
            total: words.length
        });

    } catch (err) {
        console.log("OCR ROUTE ERROR:", err.message);
        if (err.code === "ECONNREFUSED") {
            return res.status(500).json({
                message: "OCR service not running. Start with: python ocr_service.py"
            });
        }
        res.status(500).json({ message: "Failed to process image" });
    }
});

module.exports = router;
