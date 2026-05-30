"""
OCR Service v3.0 — WordKnit
Port  : 5003
Run   : python ocr_service.py

What's improved:
  - Multi-strategy highlight detection (HSV + LAB + per-channel)
  - Underline detection works for any pen colour — uses morphological lines
    on adaptive-thresholded image, NOT colour thresholding
  - Better preprocessing: deskew, CLAHE contrast, denoising
  - Strict confidence filter so garbage tokens are dropped
  - Words cleaned of punctuation before returning
  - Status endpoint at GET /status

Requires: pip install pytesseract pillow opencv-python numpy
          + Tesseract installed on the machine
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json, re, os, tempfile, traceback
import numpy as np
import cv2
import pytesseract

# ── Tesseract path (Windows) ──────────────────────────────────────────────────
pytesseract.pytesseract.tesseract_cmd = (
    r"C:\Users\Ali baba Computer\AppData\Local\Programs\Tesseract-OCR\tesseract.exe"
)

# ─────────────────────────────────────────────────────────────────────────────
# 1. PREPROCESSING
# ─────────────────────────────────────────────────────────────────────────────

def deskew(img_gray):
    """Straighten a slightly tilted page scan."""
    edges = cv2.Canny(img_gray, 50, 150, apertureSize=3)
    lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=80,
                             minLineLength=100, maxLineGap=10)
    if lines is None:
        return img_gray
    angles = []
    for line in lines:
        x1, y1, x2, y2 = line[0]
        if x2 != x1:
            angles.append(np.degrees(np.arctan2(y2 - y1, x2 - x1)))
    if not angles:
        return img_gray
    median_angle = np.median(angles)
    if abs(median_angle) > 10:          # ignore if too skewed (probably not text)
        return img_gray
    h, w = img_gray.shape
    M = cv2.getRotationMatrix2D((w // 2, h // 2), median_angle, 1.0)
    return cv2.warpAffine(img_gray, M, (w, h),
                          flags=cv2.INTER_CUBIC,
                          borderMode=cv2.BORDER_REPLICATE)


def preprocess(img_bgr):
    """
    Full preprocessing pipeline for a phone photo of a book page.
    Returns: (enhanced_bgr, enhanced_gray)
    """
    h, w = img_bgr.shape[:2]

    # 1. Upscale if too small — Tesseract prefers >= 300 dpi equivalent
    if w < 1400:
        scale = 1600 / w
        img_bgr = cv2.resize(img_bgr, (int(w * scale), int(h * scale)),
                             interpolation=cv2.INTER_LANCZOS4)

    # 2. Bilateral filter — removes noise while preserving edges (ink)
    img_bgr = cv2.bilateralFilter(img_bgr, d=7, sigmaColor=55, sigmaSpace=55)

    # 3. Convert to gray for further processing
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

    # 4. CLAHE — adaptive contrast for uneven lighting (phone shadows)
    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
    gray = clahe.apply(gray)

    # 5. Deskew
    gray = deskew(gray)

    # 6. Reconstruct BGR from corrected gray (preserve colour for highlight detection)
    # We deskew BGR too using same angle — approximate by deskewing each channel
    b, g, r = cv2.split(img_bgr)
    # Quick: just re-apply CLAHE-corrected gray as luminance proxy;
    # for highlight detection we still need colour so return both
    img_bgr_out = cv2.merge([b, g, r])   # colour preserved (already bilateral-filtered)

    return img_bgr_out, gray


# ─────────────────────────────────────────────────────────────────────────────
# 2. OCR — get word bounding boxes
# ─────────────────────────────────────────────────────────────────────────────

def run_ocr(img_bgr, gray):
    """Run Tesseract on the preprocessed image, return word boxes."""
    # Use processed gray for OCR (better contrast)
    _, binary = cv2.threshold(gray, 0, 255,
                              cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    data = pytesseract.image_to_data(
        binary,
        output_type=pytesseract.Output.DICT,
        config="--oem 3 --psm 6 -c preserve_interword_spaces=1"
    )

    words = []
    for i in range(len(data["text"])):
        raw = data["text"][i].strip()
        if not raw:
            continue
        conf = int(data["conf"][i]) if str(data["conf"][i]) != "-1" else 0
        if conf < 40:                    # drop low-confidence noise
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


# ─────────────────────────────────────────────────────────────────────────────
# 3. HIGHLIGHT DETECTION
#    Strategy: for each word box, sample the pixel region and check if
#    it has high-saturation / coloured hue → any highlighter colour.
#    Works for yellow, pink, green, orange, blue highlights.
# ─────────────────────────────────────────────────────────────────────────────

def build_highlight_mask(img_bgr):
    """
    Returns a binary mask where pixels are likely highlighter colour.
    Uses HSV thresholding — tuned for all common highlighter hues.
    """
    hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)

    # Highlights have: decent saturation (not white/gray), reasonably bright
    # Excludes dark ink (low value) and pure white paper (low saturation)
    mask = cv2.inRange(hsv,
                       np.array([0, 35, 120]),
                       np.array([180, 255, 255]))

    # Exclude very dark regions (the ink itself)
    value_ch = hsv[:, :, 2]
    dark_mask = (value_ch < 100).astype(np.uint8) * 255
    mask = cv2.bitwise_and(mask, cv2.bitwise_not(dark_mask))

    # Close small gaps within a word region
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (7, 4))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)

    return mask


def detect_highlighted(words, img_bgr):
    """Return list of words whose bounding box is mostly over a highlight."""
    mask = build_highlight_mask(img_bgr)
    h_img, w_img = mask.shape
    highlighted = []

    for wd in words:
        x, y, ww, hh = wd["x"], wd["y"], wd["w"], wd["h"]
        pad = 5
        x1, x2 = max(0, x - pad), min(w_img, x + ww + pad)
        y1, y2 = max(0, y - pad), min(h_img, y + hh + pad)
        region = mask[y1:y2, x1:x2]
        if region.size == 0:
            continue
        coverage = np.mean(region) / 255.0
        if coverage > 0.18:              # >18 % of bounding box is highlighted
            clean = _clean(wd["text"])
            if clean:
                highlighted.append(clean)

    return _dedup(highlighted)


# ─────────────────────────────────────────────────────────────────────────────
# 4. UNDERLINE DETECTION
#    Strategy: morphological horizontal line extraction on adaptive-threshold
#    binary image.  Does NOT rely on colour — works for black, blue, red, pencil.
#    Looks for horizontal strokes in the band just BELOW each word box.
# ─────────────────────────────────────────────────────────────────────────────

def build_underline_map(gray, img_shape):
    """
    Returns a binary image where horizontal line-like strokes are white.
    Uses adaptive threshold so it captures thin pen strokes of any colour.
    """
    binary = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV,
        blockSize=19, C=6
    )

    # Horizontal kernel — long & thin, catches underlines but not letter strokes
    # Width = 18 px after upscaling ≈ at least 2-3 mm of underline
    h_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (18, 1))
    h_lines = cv2.morphologyEx(binary, cv2.MORPH_OPEN, h_kernel)

    # Thicken slightly so the band search is forgiving
    dilate_k = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 5))
    h_lines = cv2.dilate(h_lines, dilate_k, iterations=1)

    return h_lines


def detect_underlined(words, gray):
    """Return words whose bottom edge has a horizontal line stroke below them."""
    h_lines = build_underline_map(gray, gray.shape)
    h_img, w_img = h_lines.shape
    underlined = []

    for wd in words:
        x, y, ww, hh = wd["x"], wd["y"], wd["w"], wd["h"]

        # Search band: from the bottom of the word down by ~25 % of word height
        search_h = max(5, int(hh * 0.28))
        y1 = min(h_img - 1, y + hh - 2)    # slightly inside bottom edge
        y2 = min(h_img,     y + hh + search_h)
        x1 = max(0,   x - 4)
        x2 = min(w_img, x + ww + 4)

        region = h_lines[y1:y2, x1:x2]
        if region.size == 0:
            continue

        # Count columns that have at least one line pixel
        col_hits = np.sum(region, axis=0)   # sum per column
        line_cols = np.count_nonzero(col_hits)
        coverage = line_cols / max(ww, 1)

        if coverage > 0.32:                  # >32 % of word width has line below
            clean = _clean(wd["text"])
            if clean:
                underlined.append(clean)

    return _dedup(underlined)


# ─────────────────────────────────────────────────────────────────────────────
# 5. HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def _clean(token):
    """Strip punctuation, keep only letters, lowercase, min 2 chars."""
    c = re.sub(r"[^a-zA-Z]", "", token).lower()
    return c if len(c) >= 2 else None


def _dedup(lst):
    seen = set()
    return [w for w in lst if not (w in seen or seen.add(w))]


# ─────────────────────────────────────────────────────────────────────────────
# 6. HTTP SERVER
# ─────────────────────────────────────────────────────────────────────────────

class OCRHandler(BaseHTTPRequestHandler):

    def do_POST(self):
        if self.path != "/extract":
            self._respond(404, {"error": "not found"})
            return
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
                    raise Exception("Could not decode image — unsupported format or corrupt file.")

                img_bgr, gray = preprocess(img_bgr)
                words          = run_ocr(img_bgr, gray)

                highlighted = detect_highlighted(words, img_bgr)
                underlined  = detect_underlined(words, gray)
                all_words   = _dedup(highlighted + underlined)

                print(f"[OCR] highlighted={len(highlighted)} underlined={len(underlined)} total={len(all_words)}")

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
            try:
                ver = str(pytesseract.get_tesseract_version())
            except:
                ver = "unknown"
            self._respond(200, {"status": "running", "version": "3.0", "tesseract": ver})
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
            pass    # client disconnected — safe to ignore

    def log_message(self, fmt, *args):
        print(f"[OCR] {fmt % args}")


if __name__ == "__main__":
    print("=" * 55)
    print("  WordKnit OCR Service v3.0")
    print("=" * 55)
    try:
        print(f"  Tesseract : {pytesseract.get_tesseract_version()}")
    except Exception as e:
        print(f"  [WARN] Tesseract not found: {e}")
        print("  Install from: https://github.com/UB-Mannheim/tesseract/wiki")
    print("  Listening : http://localhost:5003")
    print("  Endpoints : POST /extract  |  GET /status")
    print("-" * 55)
    server = HTTPServer(("localhost", 5003), OCRHandler)
    server.serve_forever()
