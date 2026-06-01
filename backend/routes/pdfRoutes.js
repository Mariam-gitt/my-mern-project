const express  = require("express");
const router   = express.Router();
const multer   = require("multer");
const axios    = require("axios");
const protect  = require("../middleware/authMiddleware");
const Word     = require("../models/Word");

const upload = multer({ storage: multer.memoryStorage() });

/* ─────────────────────────────────────────────────────────
   POST /api/pdf/import
   Send PDF to Python pdf_service → extract highlighted words
────────────────────────────────────────────────────────── */
router.post("/import", protect, upload.single("pdf"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No PDF file uploaded" });

        const pythonRes = await axios.post(
            "http://localhost:5001/extract",
            req.file.buffer,
            {
                headers: { "Content-Type": "application/octet-stream", "Content-Length": req.file.buffer.length },
                maxBodyLength: Infinity
            }
        );

        const { words } = pythonRes.data;
        if (!words || words.length === 0)
            return res.status(200).json({ message: "No highlighted words found", added: [] });

        const added = [], failed = [];

        for (const word of words) {
            try {
                const exists = await Word.findOne({ userId: req.user, word });
                if (exists) continue;

                const dictRes = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
                const data    = dictRes.data?.[0];
                const meaning = data?.meanings?.[0]?.definitions?.[0]?.definition || "No meaning found";
                const example = data?.meanings?.[0]?.definitions?.[0]?.example   || "No example available";
                const synonyms = data?.meanings?.[0]?.definitions?.[0]?.synonyms || [];

                const newWord = await Word.create({ userId: req.user, word, meaning, exampleSentence: example, synonyms, status: "review" });
                added.push(newWord);
            } catch { failed.push(word); }
        }

        res.json({ message: `Added ${added.length} words from PDF`, added, failed });

    } catch (error) {
        console.log("PDF IMPORT ERROR:", error.message);
        if (error.code === "ECONNREFUSED")
            return res.status(500).json({ message: "PDF service not running. Start it with: python pdf_service.py" });
        res.status(500).json({ message: "Failed to import PDF" });
    }
});

/* ─────────────────────────────────────────────────────────
   POST /api/pdf/analyze-difficulty
   Extract hard vocabulary words from any text-based PDF.

   Algorithm:
    1. Parse PDF text with pdf-parse
    2. Tokenise into all words ≥ 4 chars, count frequencies
    3. Build EASY_WORDS set — skip the ~1 000 most common English words
    4. Score remaining words by:
         • Length                 (longer = harder)
         • Academic suffix match  (-tion, -ity, -ology …)
         • Academic prefix match  (inter-, micro-, pseudo- …)
         • Rarity in this doc     (appears only 1-2 times = less familiar)
    5. Exclude words already in the user's vocab
    6. Return top 50, sorted score-desc, with PDF meta-stats
────────────────────────────────────────────────────────── */

// ~1 000 most common English words — all considered "easy"
const EASY_WORDS = new Set([
  "about","above","across","after","again","against","almost","alone","along",
  "already","also","although","always","among","another","anyone","anything",
  "anyway","around","back","became","because","become","becomes","before",
  "being","below","between","beyond","both","bring","brought","called","came",
  "cannot","comes","could","didn","does","doing","done","down","during","each",
  "early","either","else","enough","even","every","example","except","fact",
  "felt","find","first","follows","found","from","gave","general","getting",
  "give","given","going","good","great","hand","hasn","have","having","help",
  "hence","here","high","himself","home","however","important","include",
  "into","itself","just","keep","kept","know","large","last","later","left",
  "less","light","like","likely","little","long","look","looked","made","make",
  "many","maybe","mean","might","more","most","move","much","must","myself",
  "near","need","never","next","note","often","once","only","open","other",
  "over","page","part","people","place","point","probably","put","quite",
  "rather","reach","real","really","right","said","same","seem","seen","self",
  "several","shall","show","should","since","small","some","soon","still",
  "such","sure","take","tell","than","that","their","them","then","there",
  "these","they","thing","think","this","those","though","three","through",
  "time","today","together","told","took","toward","under","until","upon",
  "used","using","very","want","well","went","were","what","when","where",
  "which","while","whose","will","with","within","without","word","work",
  "world","would","write","year","your","please","terms","title","table",
  "study","times","pages","volume","various","whether","therefore","following",
  "different","including","however","although","because","between","through",
  "might","could","should","would","these","those","their","where","which",
  "while","after","before","since","until","during","against","about","above",
  "below","under","over","into","onto","upon","from","with","without","within",
  "along","across","around","behind","beside","between","beyond","except",
  "inside","outside","toward","amongst","despite","except","regarding",
]);

const ACADEMIC_SUFFIXES = [
  "tion","sion","ment","ness","ity","ism","ist","ize","ise","ical","ive",
  "ous","ence","ance","ogy","phy","sis","tic","tude","ology","ography",
  "ometry","onomy","istic","ification","ization","isation","atorial",
  "aneous","aneous","escent","iferous","ivorous","omorphic",
];

const ACADEMIC_PREFIXES = [
  "anti","auto","bio","chrono","circum","contra","counter","crypto","cyber",
  "demo","eco","epi","equi","ethno","geo","hetero","homo","hydro","hyper",
  "hypo","inter","intra","intro","iso","macro","micro","mono","morph","multi",
  "neo","neuro","non","omni","ortho","para","peri","photo","phys","poly",
  "post","pre","proto","pseudo","psycho","retro","semi","socio","stereo",
  "sub","super","supra","sym","syn","tele","theo","thermo","trans","ultra",
  "uni","vaso",
];

function scoreDifficulty(word, freq, totalTokens) {
    let s = 0;
    const len = word.length;

    // Length score
    if (len >= 6)  s += 1;
    if (len >= 8)  s += 2;
    if (len >= 10) s += 3;
    if (len >= 13) s += 2;

    // Academic suffix — strongest signal
    if (ACADEMIC_SUFFIXES.some(sx => word.endsWith(sx))) s += 5;

    // Academic prefix — good signal
    if (ACADEMIC_PREFIXES.some(px => word.startsWith(px))) s += 3;

    // Rarity bonus (infrequent in this specific text → less familiar)
    const relFreq = freq / totalTokens;
    if (relFreq < 0.0002) s += 4;
    else if (relFreq < 0.001) s += 2;
    else if (relFreq < 0.003) s += 1;

    return s;
}

router.post("/analyze-difficulty", protect, upload.single("pdf"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No PDF file provided" });

        // Validate it's actually a PDF by checking magic bytes
        const buf = req.file.buffer;
        const magic = buf.slice(0, 4).toString("ascii");
        if (magic !== "%PDF") {
            return res.status(400).json({ message: "That doesn't look like a PDF file. Please upload a .pdf document." });
        }

        let pdfParse;
        try { pdfParse = require("pdf-parse"); }
        catch { return res.status(500).json({ message: "pdf-parse not installed. Run: cd backend && npm install pdf-parse" }); }

        let pdfData;
        try { pdfData = await pdfParse(buf); }
        catch (e) {
            console.log("pdf-parse error:", e.message);
            return res.status(400).json({ message: "Could not parse this PDF. It may be password-protected or corrupted." });
        }

        const rawText = pdfData.text || "";
        if (rawText.trim().length < 100) {
            return res.status(400).json({
                message: "This PDF has no extractable text — it may be a scanned image. Try a PDF with selectable text."
            });
        }

        // Tokenise — capture all lowercase words ≥ 4 chars
        const allTokens = rawText.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
        const totalTokens = allTokens.length;

        if (totalTokens < 30) {
            return res.status(400).json({ message: "Not enough text found in this PDF to analyse." });
        }

        // Build frequency map
        const freqMap = {};
        for (const tok of allTokens) {
            freqMap[tok] = (freqMap[tok] || 0) + 1;
        }

        // Fetch user's known words
        const existingWords = await Word.find({ userId: req.user }, "word").lean();
        const knownSet = new Set(existingWords.map(w => w.word.toLowerCase()));

        // Score and rank
        const scored = Object.entries(freqMap)
            .filter(([word]) =>
                word.length >= 5         &&   // at least 5 chars
                !EASY_WORDS.has(word)    &&   // not a common easy word
                !knownSet.has(word)      &&   // not already in user's vocab
                /^[a-z]+$/.test(word)         // pure alpha only (no numbers/hyphens)
            )
            .map(([word, freq]) => ({
                word,
                freq,
                score: scoreDifficulty(word, freq, totalTokens)
            }))
            .filter(w => w.score >= 4)        // minimum difficulty bar (lowered from 5)
            .sort((a, b) => b.score - a.score || a.freq - b.freq)
            .slice(0, 50);

        const words = scored.map(w => w.word);

        console.log(`[Difficulty] ${totalTokens} tokens → ${Object.keys(freqMap).length} unique → ${words.length} difficult`);

        res.json({
            words,
            total: words.length,
            pdfStats: {
                pages:       pdfData.numpages || 0,
                totalTokens,
                uniqueWords: Object.keys(freqMap).length,
            }
        });

    } catch (err) {
        console.log("ANALYZE-DIFFICULTY ERROR:", err.message);
        res.status(500).json({ message: `Analysis failed: ${err.message}` });
    }
});

// ← single export, at the very end
module.exports = router;
