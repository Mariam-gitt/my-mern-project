"""
RAG Service for Vocabulary App
Supports merging multiple Paul Nation books into one database.
Run with: python rag_service.py
Runs on port 5002
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json, re, os, pickle, subprocess, tempfile

DB_PATH = os.path.join(os.path.dirname(__file__), "rag_db.pkl")


def extract_text(pdf_path):
    result = subprocess.run(["pdftotext", "-layout", pdf_path, "-"], capture_output=True, text=True)
    return result.stdout


def parse_entries(text):
    lines = text.split("\n")

    # Step 1: Get master word list from Table of Contents
    target_words = set()
    for line in lines[:150]:
        stripped = line.strip()
        if re.match(r'^[a-z]+(?:,\s*[a-z]+){3,}', stripped):
            words = [w.strip().lower() for w in stripped.split(",")]
            target_words.update(w for w in words if len(w) > 1)

    print(f"  Target words from TOC: {len(target_words)}")

    # Step 2: For each word, find its definition + example
    entries = {}
    for word in target_words:
        if not word:
            continue

        pattern = re.compile(
            rf'\b{re.escape(word)}\b[^\n]*\n([^\n]*(?:When |To |The |A |If |You )[^\n]{{10,}})',
            re.IGNORECASE
        )
        for match in pattern.finditer(text):
            definition = match.group(1).strip()
            if len(definition) < 15 or definition.startswith("-"):
                continue
            after = text[match.end():match.end() + 400]
            ex_match = re.search(r'[-—►»*]{1,2}\s*(.{10,})', after)
            example = ex_match.group(1).strip().split("\n")[0] if ex_match else "No example available"

            entries[word] = {
                "word": word,
                "meaning": definition,
                "exampleSentence": example,
                "source": "Paul Nation - 4000 Essential English Words"
            }
            break

    return entries


def load_db():
    if os.path.exists(DB_PATH):
        with open(DB_PATH, "rb") as f:
            return pickle.load(f)
    return {}


def save_db(db):
    with open(DB_PATH, "wb") as f:
        pickle.dump(db, f)


def ingest_pdf(pdf_path, existing_db):
    """Parse PDF and MERGE into existing database — never overwrites."""
    print(f"Ingesting: {pdf_path}")
    text = extract_text(pdf_path)
    new_entries = parse_entries(text)

    # Merge — existing words are NOT overwritten
    added = 0
    for word, data in new_entries.items():
        if word not in existing_db:
            existing_db[word] = data
            added += 1

    print(f"  Added {added} new words (total: {len(existing_db)})")
    save_db(existing_db)
    return existing_db, added


def lookup_word(word, db):
    word = word.lower().strip()
    if word in db:
        return db[word]
    for suffix in ["ing", "ed", "er", "est", "ly", "s", "es"]:
        if word.endswith(suffix) and len(word) - len(suffix) > 2:
            stem = word[:-len(suffix)]
            if stem in db:
                return db[stem]
    return None


class RAGHandler(BaseHTTPRequestHandler):
    db = {}

    def do_POST(self):

        # ── Ingest a new book (merges into existing) ──
        if self.path == "/ingest":
            length = int(self.headers["Content-Length"])
            data = self.rfile.read(length)
            with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
                tmp.write(data)
                tmp_path = tmp.name
            try:
                RAGHandler.db, added = ingest_pdf(tmp_path, RAGHandler.db)
                self._respond(200, {
                    "message": f"Added {added} new words! Total: {len(RAGHandler.db)} words in dictionary.",
                    "count": len(RAGHandler.db),
                    "added": added
                })
            except Exception as e:
                self._respond(500, {"error": str(e)})
            finally:
                os.unlink(tmp_path)

        # ── Clear the entire database ──
        elif self.path == "/clear":
            RAGHandler.db = {}
            if os.path.exists(DB_PATH):
                os.remove(DB_PATH)
            self._respond(200, {"message": "Dictionary cleared."})

        # ── Lookup a word ──
        elif self.path == "/lookup":
            length = int(self.headers["Content-Length"])
            body = json.loads(self.rfile.read(length))
            result = lookup_word(body.get("word", ""), RAGHandler.db)
            self._respond(200 if result else 404, result or {"error": "Not found"})

    def do_GET(self):
        if self.path == "/status":
            self._respond(200, {
                "status": "running",
                "words_loaded": len(RAGHandler.db),
                "sample": list(RAGHandler.db.keys())[:5]
            })

    def _respond(self, code, data):
        body = json.dumps(data).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        print(f"[RAG] {fmt % args}")


if __name__ == "__main__":
    RAGHandler.db = load_db()
    print(f"RAG service — {len(RAGHandler.db)} words loaded from disk")
    server = HTTPServer(("0.0.0.0", 5002), RAGHandler)
    print("Running on port 5002 ✅")
    server.serve_forever()
