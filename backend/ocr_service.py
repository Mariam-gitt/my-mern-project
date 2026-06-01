"""
OCR Service v3.1 — WordKnit
Port  : 5003
Run   : python ocr_service.py

Fixes in this version:
  - Min word length raised to 4 (was 3) — kills random 2-3 char junk
  - SKIP_WORDS hugely expanded to cover common English glue words
  - Highlight mask: threshold raised to 0.28 (was 0.12) — much less noise
    Paper white is now explicitly excluded via a saturation check
  - Underline search band tightened — reduces false positives from letter
    descenders (g, y, p) being mistaken for underlines
  - Confidence filter tightened to 60 (was 55)

Requires: pip install pytesseract pillow opencv-python numpy
          + Tesseract installed
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json, re, os, tempfile, traceback
import numpy as np
import cv2
import pytesseract

# ── Tesseract path (Windows) ──────────────────────────────────────────
pytesseract.pytesseract.tesseract_cmd = (
    r"C:\Users\Ali baba Computer\AppData\Local\Programs\Tesseract-OCR\tesseract.exe"
)

# ── Words that are always discarded even if highlighted/underlined ────
# Expanded to ~200 of the most common English words
SKIP_WORDS = {
    # articles / determiners
    "the","a","an","this","that","these","those","each","every","either",
    "neither","any","some","all","both","few","little","much","many","more",
    "most","other","another","such","what","which","whose",
    # pronouns
    "i","me","my","myself","we","our","ours","ourselves","you","your","yours",
    "yourself","yourselves","he","him","his","himself","she","her","hers",
    "herself","it","its","itself","they","them","their","theirs","themselves",
    "who","whom","whoever","whomever","one","ones",
    # conjunctions / prepositions / linking
    "and","or","but","nor","so","yet","for","although","because","since",
    "unless","until","while","after","before","when","where","whether","though",
    "even","if","as","at","by","to","of","in","on","up","out","off","over",
    "under","again","then","once","here","there","now","just","only","very",
    "also","too","into","onto","upon","from","with","about","above","below",
    "between","among","through","during","against","along","around","behind",
    "beside","besides","beyond","except","inside","outside","near","since",
    "toward","within","without","per","via",
    # common verbs
    "is","are","was","were","be","been","being","have","has","had","do","does",
    "did","will","would","shall","should","may","might","must","can","could",
    "get","got","gets","go","goes","went","come","came","see","saw","know",
    "knew","take","took","make","made","give","gave","find","found","think",
    "thought","tell","told","say","said","use","used","try","tried","ask",
    "asked","seem","seemed","feel","felt","look","looked","keep","kept","let",
    "put","set","run","ran","hold","held","bring","brought","show","showed",
    "become","became","leave","left","call","called","need","needed","mean",
    "meant","want","wanted","turn","turned","move","moved","live","lived",
    "play","played","pay","paid","hear","heard","help","helped","talk","talked",
    "stand","stood","lose","lost","follow","followed","change","changed","lead",
    "led","open","opened","seem","begin","began","begun","show","start","end",
    # common adjectives / adverbs
    "good","great","old","new","first","last","long","little","own","right",
    "big","high","small","large","next","early","young","important","public",
    "private","real","best","free","able","sure","bad","true","hard","easy",
    "same","different","available","same","already","often","never","always",
    "well","back","still","far","away","down","back","however","rather",
    "quite","really","very","just","maybe","perhaps","nearly","almost","soon",
    "already","finally","simply","directly","clearly","quickly","slowly",
    # numbers / time
    "one","two","three","four","five","six","seven","eight","nine","ten",
    "hundred","thousand","million","billion","year","years","month","months",
    "week","weeks","day","days","hour","hours","time","times","age",
    # other super-common nouns that aren't vocabulary words
    "people","person","man","woman","men","women","child","children","world",
    "life","hand","part","place","case","week","company","system","program",
    "question","government","number","night","point","home","water","room",
    "mother","area","money","story","fact","month","lot","right","study",
    "book","page","line","word","group","example","idea","body","information",
    "back","issue","side","kind","head","house","service","friend","father",
    "power","town","fine","drive","short","road","form","state","name","thing",
}

# ─────────────────────────────────────────────────────────────────────
# 1. PREPROCESSING
# ─────────────────────────────────────────────────────────────────────

def preprocess(img_bgr):
    """Prepare a phone photo of a book page for OCR + colour analysis."""
    h, w = img_bgr.shape[:2]

    # Upscale so Tesseract gets enough resolution
    if w < 1400:
        scale = 1600 / w
        img_bgr = cv2.resize(img_bgr,
                             (int(w * scale), int(h * scale)),
                             interpolation=cv2.INTER_LANCZOS4)

    # Gentle bilateral — kills sensor noise, preserves ink edges and highlight colour
    img_bgr = cv2.bilateralFilter(img_bgr, d=5, sigmaColor=40, sigmaSpace=40)

    # Grayscale for OCR
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

    # CLAHE — even out phone-camera shadow gradients
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    gray  = clahe.apply(gray)

    return img_bgr, gray   # colour for highlight detection, gray for OCR


# ─────────────────────────────────────────────────────────────────────
# 2. OCR
# ─────────────────────────────────────────────────────────────────────

def run_ocr(gray):
    """Run Tesseract, return list of word dicts with bounding boxes."""
    # Otsu binarisation gives Tesseract clean black-on-white input
    _, binary = cv2.threshold(gray, 0, 255,
                              cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    data = pytesseract.image_to_data(
        binary,
        output_type=pytesseract.Output.DICT,
        config="--oem 3 --psm 6"
    )

    words = []
    for i in range(len(data["text"])):
        raw  = data["text"][i].strip()
        conf = int(data["conf"][i]) if str(data["conf"][i]) != "-1" else 0
        if not raw or conf < 60:    # tightened confidence threshold
            continue
        words.append({
            "text": raw,
            "x": data["left"][i],
            "y": data["top"][i],
            "w": data["width"][i],
            "h": data["height"][i],
            "conf": conf
        })
    return words


# ─────────────────────────────────────────────────────────────────────
# 3. HIGHLIGHT DETECTION
#
# Key insight: highlighter colours have HIGH saturation and MEDIUM-HIGH
# value in HSV.  Plain white paper has LOW saturation.  Black ink has
# LOW value.  We build a mask for "definitely not paper and not ink"
# then check coverage over each word's bounding box.
# ─────────────────────────────────────────────────────────────────────

def build_highlight_mask(img_bgr):
    """
    Binary mask — white pixels are highlighter colour.
    Works for yellow, pink, green, orange, blue highlighters.
    Explicitly excludes white paper (low saturation) and black ink (low value).
    """
    hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
    h_ch, s_ch, v_ch = cv2.split(hsv)

    # Highlighter = saturated AND bright enough (not ink-dark)
    # saturation > 45 rules out white/grey paper
    # value > 110 rules out dark ink
    mask = cv2.inRange(hsv,
                       np.array([0,  45, 110]),
                       np.array([180, 255, 255]))

    # Additionally exclude very-low-saturation regions (paper)
    paper_mask = (s_ch < 30).astype(np.uint8) * 255   # definitely paper
    mask = cv2.bitwise_and(mask, cv2.bitwise_not(paper_mask))

    # Close gaps inside a word's bounding box
    k = cv2.getStructuringElement(cv2.MORPH_RECT, (9, 5))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, k)

    return mask


def detect_highlighted(words, img_bgr):
    """Return words whose bounding box has ≥28 % highlight-coloured pixels."""
    mask   = build_highlight_mask(img_bgr)
    H, W   = mask.shape
    result = []

    for wd in words:
        x, y, ww, hh = wd["x"], wd["y"], wd["w"], wd["h"]
        pad = 6
        x1, x2 = max(0, x - pad), min(W, x + ww + pad)
        y1, y2 = max(0, y - pad), min(H, y + hh + pad)
        roi = mask[y1:y2, x1:x2]
        if roi.size == 0:
            continue
        coverage = float(np.count_nonzero(roi)) / roi.size
        # 28 % threshold — strict enough to avoid false positives from
        # slightly colourful paper or stains
        if coverage >= 0.28:
            c = _clean(wd["text"])
            if c:
                result.append(c)

    return _dedup(result)


# ─────────────────────────────────────────────────────────────────────
# 4. UNDERLINE DETECTION
#
# Morphological horizontal line extraction on adaptive-threshold binary.
# Colour-agnostic — works for black, blue, red ball-point pen, pencil.
# Searches a narrow band JUST below the word's baseline.
# ─────────────────────────────────────────────────────────────────────

def build_hline_mask(gray):
    """Extract horizontal strokes (underlines, ruled lines) from the page."""
    binary = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV,
        blockSize=21, C=7
    )
    # Horizontal kernel: long (≥15 px) but only 1 px tall
    h_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 1))
    h_lines  = cv2.morphologyEx(binary, cv2.MORPH_OPEN, h_kernel)

    # Thin vertical dilate so the search band can catch it
    v_k = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 4))
    h_lines = cv2.dilate(h_lines, v_k, iterations=1)
    return h_lines


def detect_underlined(words, gray):
    """
    Return words that have a horizontal line stroke directly beneath them.
    Uses a tight search band (word bottom +2 px to +20 % of word height)
    to avoid picking up the next line of text as a false underline.
    """
    h_lines = build_hline_mask(gray)
    H, W    = h_lines.shape
    result  = []

    for wd in words:
        x, y, ww, hh = wd["x"], wd["y"], wd["w"], wd["h"]

        # Tight band: start 2px below word bottom, extend by 20 % of height
        search_h = max(4, int(hh * 0.20))
        y1 = min(H - 1, y + hh + 2)
        y2 = min(H,     y + hh + 2 + search_h)
        x1 = max(0,  x - 2)
        x2 = min(W,  x + ww + 2)

        roi = h_lines[y1:y2, x1:x2]
        if roi.size == 0:
            continue

        # Count horizontal columns that contain at least one line pixel
        col_presence = np.any(roi > 0, axis=0)
        coverage     = float(np.sum(col_presence)) / max(ww, 1)

        if coverage >= 0.38:    # 38 % of word-width must have underline below it
            c = _clean(wd["text"])
            if c:
                result.append(c)

    return _dedup(result)


# ─────────────────────────────────────────────────────────────────────
# 5. HELPERS
# ─────────────────────────────────────────────────────────────────────

def _clean(token):
    """
    Normalise a raw Tesseract token:
      • strip non-alpha characters
      • lowercase
      • must be ≥ 4 alphabetic characters  ← raised from 3
      • must not be in SKIP_WORDS
      • drop all-caps tokens ≤ 4 chars (abbreviations like ISBN, PDF)
    """
    c = re.sub(r"[^a-zA-Z]", "", token).lower()
    if len(c) < 4:
        return None
    if token.isupper() and len(c) <= 4:
        return None
    if c in SKIP_WORDS:
        return None
    return c


def _dedup(lst):
    seen = set()
    return [w for w in lst if not (w in seen or seen.add(w))]


# ─────────────────────────────────────────────────────────────────────
# 6. HTTP SERVER
# ─────────────────────────────────────────────────────────────────────

class OCRHandler(BaseHTTPRequestHandler):

    def do_POST(self):
        if self.path != "/extract":
            self._respond(404, {"error": "not found"}); return
        try:
            length = int(self.headers.get("Content-Length", 0))
            raw    = self.rfile.read(length)
            ct     = self.headers.get("Content-Type", "image/jpeg")
            ext    = ".png" if "png" in ct else ".jpg"

            with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
                tmp.write(raw)
                path = tmp.name

            try:
                img_bgr = cv2.imread(path)
                if img_bgr is None:
                    raise Exception(
                        "Could not decode image. Upload a clear JPG or PNG photo.")

                img_bgr, gray = preprocess(img_bgr)
                words         = run_ocr(gray)

                highlighted = detect_highlighted(words, img_bgr)
                underlined  = detect_underlined(words, gray)
                all_words   = _dedup(highlighted + underlined)

                print(f"[OCR] conf_words={len(words)} | hl={len(highlighted)} | ul={len(underlined)} | out={len(all_words)}")

                self._respond(200, {
                    "words":       all_words,
                    "highlighted": highlighted,
                    "underlined":  underlined,
                    "total":       len(all_words)
                })

            except Exception as e:
                print(f"[OCR ERROR] {e}")
                traceback.print_exc()
                self._respond(500, {"error": str(e)})

            finally:
                try: os.unlink(path)
                except: pass

        except Exception as e:
            self._respond(500, {"error": str(e)})

    def do_GET(self):
        if self.path == "/status":
            try: ver = str(pytesseract.get_tesseract_version())
            except: ver = "not found"
            self._respond(200, {"status": "running", "version": "3.1", "tesseract": ver})
        else:
            self._respond(404, {"error": "not found"})

    def _respond(self, code, data):
        try:
            body = json.dumps(data).encode()
            self.send_response(code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except (ConnectionAbortedError, BrokenPipeError, ConnectionResetError):
            pass

    def log_message(self, fmt, *args):
        print(f"[OCR] {fmt % args}")


if __name__ == "__main__":
    print("=" * 50)
    print("  WordKnit OCR Service v3.1")
    print("=" * 50)
    try:
        print(f"  Tesseract : {pytesseract.get_tesseract_version()}")
    except Exception as e:
        print(f"  [WARN] Tesseract not found: {e}")
        print("  Get it: https://github.com/UB-Mannheim/tesseract/wiki")
    print("  Listening : http://localhost:5003")
    print("  POST /extract   GET /status")
    print("-" * 50)
    server = HTTPServer(("0.0.0.0", 5003), OCRHandler)
    server.serve_forever()
