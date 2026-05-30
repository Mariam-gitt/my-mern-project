const Word = require("../models/Word");
const axios = require("axios");

/**
 * Try RAG service first, fallback to free dictionary API
 */
const getMeaning = async (word) => {

    // ── Try RAG (Paul Nation book) first ──
    try {
        const ragRes = await axios.post(
            "http://localhost:5002/lookup",
            { word },
            { timeout: 2000 }
        );
        if (ragRes.data && ragRes.data.meaning) {
            console.log(`[RAG] Found "${word}" in dictionary`);
            return {
                meaning: ragRes.data.meaning,
                exampleSentence: ragRes.data.exampleSentence || "No example available",
                synonyms: [],
                source: ragRes.data.source || "Custom Dictionary"
            };
        }
    } catch (err) {
        console.log(`[RAG] Not found or unavailable — falling back to API`);
    }

    // ── Fallback: Free Dictionary API ──
    const response = await axios.get(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
    );
    const data = response.data?.[0];
    return {
        meaning: data?.meanings?.[0]?.definitions?.[0]?.definition || "No meaning found",
        exampleSentence: data?.meanings?.[0]?.definitions?.[0]?.example || "No example available",
        synonyms: data?.meanings?.[0]?.definitions?.[0]?.synonyms || [],
        source: "Free Dictionary API"
    };
};


/**
 * ADD WORD
 */
exports.addWord = async (req, res) => {
    try {
        const userId = req.user;
        console.log("ADD WORD - userId:", userId);

        const { word } = req.body;

        if (!word || word.trim() === "") {
            return res.status(400).json({ message: "Word is required" });
        }

        const { meaning, exampleSentence, synonyms } = await getMeaning(word.trim().toLowerCase());

        const newWord = await Word.create({
            userId,
            word: word.trim().toLowerCase(),
            meaning,
            exampleSentence,
            synonyms,
            status: "review"
        });

        res.status(201).json(newWord);

    } catch (error) {
        console.log("ADD WORD ERROR:", error.response?.data || error.message);
        res.status(500).json({ message: "Failed to add word" });
    }
};


/**
 * GET ALL WORDS
 */
exports.getWords = async (req, res) => {
    try {
        console.log("GET WORDS - userId from token:", req.user);
        const words = await Word.find({ userId: req.user }).sort({ createdAt: -1 });
        console.log("GET WORDS - found:", words.length);
        res.status(200).json(words);
    } catch (error) {
        console.log("GET WORDS ERROR:", error.message);
        res.status(500).json({ message: "Failed to fetch words" });
    }
};


/**
 * GENERATE QUIZ
 */
exports.getQuiz = async (req, res) => {
    try {
        const words = await Word.find({ userId: req.user }).sort({ createdAt: -1 });

        if (words.length < 4) {
            return res.status(400).json({ message: "Add at least 4 words to start the quiz!" });
        }

        const randomIndex = Math.floor(Math.random() * words.length);
        const correctWord = words[randomIndex];
        const correctAnswer = correctWord.meaning;

        const wrongAnswers = words
            .filter(w => w._id.toString() !== correctWord._id.toString())
            .slice(0, 3)
            .map(w => w.meaning);

        const options = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5);

        res.json({ word: correctWord.word, correctAnswer, options });

    } catch (error) {
        console.log("QUIZ ERROR:", error.message);
        res.status(500).json({ message: "Failed to generate quiz" });
    }
};


/**
 * UPDATE WORD STATUS (learned / review)
 */
exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const word = await Word.findOneAndUpdate(
            { _id: id, userId: req.user },
            { status },
            { new: true }
        );

        if (!word) return res.status(404).json({ message: "Word not found" });
        res.json(word);
    } catch (error) {
        res.status(500).json({ message: "Failed to update status" });
    }
};
