"""
PDF Highlight Extractor
Handles both:
1. Real PDF annotations (Adobe, Foxit, Preview)
2. Word-exported PDFs with yellow background color on text
Run with: python pdf_service.py
Runs on port 5001
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import fitz  # PyMuPDF
import tempfile
import os


def is_yellowish(color):
    """Check if a color tuple is yellowish (Word highlight)."""
    if not color or len(color) < 3:
        return False
    r, g, b = color[0], color[1], color[2]
    # Yellow: high red, high green, low blue
    return r > 0.6 and g > 0.6 and b < 0.5


def extract_highlighted_words(pdf_path):
    doc = fitz.open(pdf_path)
    words = []

    for page in doc:

        # ── Method 1: Real annotations (Adobe, Foxit, Preview) ──
        for annot in page.annots():
            if annot.type[0] in [8, 9, 10, 11]:
                rect = annot.rect
                text = page.get_text("text", clip=rect).strip()
                for word in text.split():
                    clean = word.strip(".,!?;:\"'()[]{}").lower()
                    if clean and len(clean) > 1:
                        words.append(clean)

        # ── Method 2: Word-exported PDFs (yellow background color) ──
        blocks = page.get_text("rawdict")["blocks"]
        for block in blocks:
            if block.get("type") != 0:
                continue
            for line in block.get("lines", []):
                for span in line.get("spans", []):
                    # Check background color
                    color = span.get("color")
                    bgcolor = span.get("bgcolor") or span.get("background")

                    # fitz returns bgcolor as integer — convert to RGB
                    if bgcolor and isinstance(bgcolor, int) and bgcolor != 0xFFFFFF and bgcolor != 0:
                        r = ((bgcolor >> 16) & 0xFF) / 255
                        g = ((bgcolor >> 8) & 0xFF) / 255
                        b = (bgcolor & 0xFF) / 255
                        if is_yellowish((r, g, b)):
                            text = span.get("text", "").strip()
                            for word in text.split():
                                clean = word.strip(".,!?;:\"'()[]{}").lower()
                                if clean and len(clean) > 1:
                                    words.append(clean)

    doc.close()

    # Remove duplicates, preserve order
    seen = set()
    unique = []
    for w in words:
        if w not in seen:
            seen.add(w)
            unique.append(w)

    return unique


class PDFHandler(BaseHTTPRequestHandler):

    def do_POST(self):
        if self.path == "/extract":
            content_length = int(self.headers["Content-Length"])
            pdf_data = self.rfile.read(content_length)

            with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
                tmp.write(pdf_data)
                tmp_path = tmp.name

            try:
                words = extract_highlighted_words(tmp_path)
                response = json.dumps({ "words": words }).encode()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(response)
            except Exception as e:
                error = json.dumps({ "error": str(e) }).encode()
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(error)
            finally:
                os.unlink(tmp_path)

    def do_GET(self):
        """Debug endpoint — test a local PDF file"""
        if self.path.startswith("/debug"):
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "running"}).encode())

    def log_message(self, format, *args):
        print(f"[PDF Service] {format % args}")


if __name__ == "__main__":
    server = HTTPServer(("localhost", 5001), PDFHandler)
    print("PDF extraction service running on port 5001 ✅")
    server.serve_forever()
