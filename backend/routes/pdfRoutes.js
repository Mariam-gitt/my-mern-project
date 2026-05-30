const express = require("express");
const router = express.Router();
const multer = require("multer");
const axios = require("axios");
const fs = require("fs");
const protect = require("../middleware/authMiddleware");
const Word = require("../models/Word");

// Store PDF in memory temporarily
const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /api/pdf/import
 * Upload a PDF, extract highlighted words, add to vocab
 */
router.post("/import", protect, upload.single("pdf"), async (req, res) => {

    try {

        if (!req.file) {
            return res.status(400).json({ message: "No PDF file uploaded" });
        }

        // Send PDF to Python service for extraction
        const pythonRes = await axios.post(
            "http://localhost:5001/extract",
            req.file.buffer,
            {
                headers: { "Content-Type": "application/octet-stream", "Content-Length": req.file.buffer.length },
                maxBodyLength: Infinity
            }
        );

        const { words } = pythonRes.data;

        if (!words || words.length === 0) {
            return res.status(200).json({ message: "No highlighted words found", added: [] });
        }

        // For each word, fetch meaning from dictionary API and save
        const dictionaryAPI = require("../controllers/wordController");
        const added = [];
        const failed = [];

        for (const word of words) {

            try {

                // Check if word already exists for this user
                const exists = await Word.findOne({ userId: req.user, word });
                if (exists) continue;

                // Fetch meaning
                const dictRes = await axios.get(
                    `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
                );

                const data = dictRes.data?.[0];
                const meaning = data?.meanings?.[0]?.definitions?.[0]?.definition || "No meaning found";
                const example = data?.meanings?.[0]?.definitions?.[0]?.example || "No example available";
                const synonyms = data?.meanings?.[0]?.definitions?.[0]?.synonyms || [];

                const newWord = await Word.create({
                    userId: req.user,
                    word,
                    meaning,
                    exampleSentence: example,
                    synonyms,
                    status: "review"
                });

                added.push(newWord);

            } catch (err) {
                // Word not found in dictionary or already exists — skip
                failed.push(word);
            }
        }

        res.status(200).json({
            message: `Added ${added.length} words from PDF`,
            added,
            failed
        });

    } catch (error) {
        console.log("PDF IMPORT ERROR:", error.message);

        // Friendly error if Python service isn't running
        if (error.code === "ECONNREFUSED") {
            return res.status(500).json({
                message: "PDF service not running. Start it with: python pdf_service.py"
            });
        }

        res.status(500).json({ message: "Failed to import PDF" });
    }
});

module.exports = router;


/**
 * POST /api/pdf/analyze-difficulty
 *
 * Improved difficulty detection logic:
 * 1. Extract text with pdf-parse
 * 2. Tokenize — capture ALL words >= 4 chars (wider net than before)
 * 3. Count frequency — rare words (appear 1-2x) are harder
 * 4. Score by: length + academic suffixes + low frequency + NOT in 5000 common words
 * 5. Remove words already in user's vocab
 * 6. Return up to 50 words, sorted by difficulty score desc
 * 7. Also return frequency info for transparency
 */

// Top ~700 most common English words — these are "easy" and excluded
const COMMON_WORDS = new Set([
  "about","above","across","after","again","against","almost","alone","along","already",
  "also","although","always","among","another","anyone","anything","anyway","around",
  "because","before","being","below","between","beyond","bring","brought","called",
  "cannot","comes","could","didn","does","doing","done","down","during","each","either",
  "enough","every","except","felt","find","first","found","from","gave","getting",
  "give","given","going","good","great","had","hasn","have","having","hence","here",
  "high","himself","home","however","if","into","itself","just","keep","kept","know",
  "large","last","left","less","light","like","little","long","look","looked","made",
  "make","many","maybe","mean","might","more","most","move","much","must","myself",
  "near","need","never","next","number","often","once","only","open","other","over",
  "page","part","people","place","point","quite","rather","reach","real","really",
  "right","said","same","seem","seen","self","shall","show","should","since","small",
  "some","soon","still","such","sure","take","than","that","their","them","then",
  "there","these","they","thing","think","this","those","through","time","today",
  "together","told","took","toward","under","until","upon","used","using","very",
  "want","well","went","were","what","when","where","which","while","whose","will",
  "with","within","without","word","work","world","would","write","years","your",
  "please","terms","title","table","study","three","times","pages","volume","often",
  "various","whether","toward","university","therefore","among","though","both",
  "following","another","through","during","before","always","around","without",
  "himself","itself","myself","yourself","herself","ourselves","themselves",
  "became","become","becomes","begin","began","begun","contain","contains","contained",
  "different","early","end","even","example","general","given","help","important",
  "include","large","later","likely","little","long","many","might","more","most",
  "move","much","must","need","never","next","note","often","only","open","other",
  "over","own","part","people","place","point","put","quite","rather","reach","real",
  "right","same","seem","show","since","small","some","soon","still","such","sure",
  "take","tell","than","then","there","these","they","this","those","three","time",
  "under","until","used","want","well","went","were","what","when","where","which",
  "while","will","with","word","work","would","write","year",
]);

// Academic / technical suffixes — strong signal of a harder word
const ACADEMIC_SUFFIXES = [
  "tion","sion","ment","ness","ity","ism","ist","ize","ise","ical","ive","ous",
  "ence","ance","ogy","phy","sis","tic","tude","ology","ography","ometry","onomy",
  "ectomy","ology","istic","ification","ization","isation","atorial","atorial",
];

// Academic prefixes — another signal
const ACADEMIC_PREFIXES = [
  "anti","auto","bio","chrono","circum","contra","counter","de","dis","eco",
  "epi","equi","hetero","homo","hyper","hypo","inter","intra","intro","iso",
  "macro","micro","mono","multi","neo","non","omni","over","para","peri",
  "photo","poly","post","pre","pseudo","psycho","retro","semi","socio","sub",
  "super","supra","syn","tele","trans","ultra","under","uni",
];

function difficultyScore(word, freq, totalTokens) {
  let s = 0;

  // Length score (longer = harder)
  const len = word.length;
  if (len >= 6)  s += 1;
  if (len >= 8)  s += 2;
  if (len >= 10) s += 3;
  if (len >= 13) s += 2;

  // Academic suffix (strong positive signal)
  if (ACADEMIC_SUFFIXES.some(sx => word.endsWith(sx))) s += 4;

  // Academic prefix (positive signal)
  if (ACADEMIC_PREFIXES.some(px => word.startsWith(px))) s += 2;

  // Rarity bonus — words that appear rarely in the text are less familiar
  const relFreq = freq / totalTokens;
  if (relFreq < 0.0003) s += 3;  // very rare in this doc
  else if (relFreq < 0.001) s += 1;

  // NOT in common word list
  if (!COMMON_WORDS.has(word)) s += 2;

  return s;
}

router.post("/analyze-difficulty", protect, upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No PDF file provided" });

    let pdfParse;
    try {
      pdfParse = require("pdf-parse");
    } catch {
      return res.status(500).json({ message: "pdf-parse not installed. Run: npm install pdf-parse in /backend" });
    }

    let pdfData;
    try {
      pdfData = await pdfParse(req.file.buffer);
    } catch (e) {
      return res.status(400).json({ message: "Could not read PDF. Make sure it contains real text (not a scanned image)." });
    }

    const rawText = pdfData.text || "";
    if (rawText.trim().length < 50) {
      return res.status(400).json({ message: "PDF appears to be image-only or empty. Use a text-based PDF." });
    }

    // Tokenize — all lowercase words >= 4 chars
    const allTokens = (rawText.toLowerCase().match(/\b[a-z]{4,}\b/g) || []);
    const totalTokens = allTokens.length;

    if (totalTokens < 20) {
      return res.status(400).json({ message: "Not enough text extracted from this PDF." });
    }

    // Count frequency of each word
    const freqMap = {};
    for (const tok of allTokens) {
      freqMap[tok] = (freqMap[tok] || 0) + 1;
    }

    // Get user's existing vocab (skip already-known words)
    const existingWords = await Word.find({ userId: req.user }, "word").lean();
    const knownSet = new Set(existingWords.map(w => w.word.toLowerCase()));

    // Score every unique word
    const scored = Object.entries(freqMap)
      .filter(([word]) =>
        word.length >= 5 &&               // at least 5 chars
        !COMMON_WORDS.has(word) &&         // not a super common word
        !knownSet.has(word) &&             // not already in vocab
        /^[a-z]+$/.test(word)             // pure alpha only
      )
      .map(([word, freq]) => ({
        word,
        freq,
        score: difficultyScore(word, freq, totalTokens)
      }))
      .filter(w => w.score >= 5)           // minimum difficulty threshold
      .sort((a, b) => b.score - a.score || a.freq - b.freq)  // sort by score, then rarer first
      .slice(0, 50);

    const words = scored.map(w => w.word);

    console.log(`[Difficulty] PDF: ${totalTokens} tokens, ${Object.keys(freqMap).length} unique, ${words.length} difficult found`);

    res.json({
      words,
      total: words.length,
      pdfStats: {
        totalTokens,
        uniqueWords: Object.keys(freqMap).length,
        pages: pdfData.numpages || 0
      }
    });

  } catch (err) {
    console.log("ANALYZE-DIFFICULTY ERROR:", err.message, err.stack);
    res.status(500).json({ message: `Analysis failed: ${err.message}` });
  }
});

module.exports = router;
