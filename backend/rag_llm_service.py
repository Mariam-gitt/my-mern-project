"""
RAG + LLM Service
- Upload a PDF → chunks it → indexes with TF-IDF
- User asks a question → finds relevant chunks → sends to Groq
Port: 5004
Run: python rag_llm_service.py
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json, re, os, pickle, subprocess, tempfile
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Per-user document storage (in memory, keyed by userId)
# { userId: { "chunks": [...], "vectorizer": ..., "matrix": ... } }
USER_DOCS = {}

CHUNK_SIZE = 400   # words per chunk
CHUNK_OVERLAP = 50 # overlap between chunks


# ── Text extraction ───────────────────────────────────────────

def extract_text(pdf_path):
    result = subprocess.run(
        ["pdftotext", "-layout", pdf_path, "-"],
        capture_output=True, text=True
    )
    return result.stdout.strip()


# ── Chunking ─────────────────────────────────────────────────

def chunk_text(text):
    """Split text into overlapping chunks of ~CHUNK_SIZE words."""
    # Clean text
    text = re.sub(r'\s+', ' ', text).strip()
    words = text.split()
    
    chunks = []
    i = 0
    chunk_id = 0

    while i < len(words):
        chunk_words = words[i:i + CHUNK_SIZE]
        chunk_text = ' '.join(chunk_words)

        if len(chunk_text.strip()) > 50:  # skip tiny chunks
            chunks.append({
                "id": chunk_id,
                "text": chunk_text,
                "wordStart": i,
                "wordEnd": i + len(chunk_words)
            })
            chunk_id += 1

        i += CHUNK_SIZE - CHUNK_OVERLAP  # slide with overlap

    return chunks


# ── Indexing ─────────────────────────────────────────────────

def build_index(chunks):
    """Build TF-IDF index from chunks."""
    texts = [c["text"] for c in chunks]
    vectorizer = TfidfVectorizer(
        stop_words='english',
        ngram_range=(1, 2),  # unigrams + bigrams
        max_features=10000
    )
    matrix = vectorizer.fit_transform(texts)
    return vectorizer, matrix


# ── Search ───────────────────────────────────────────────────

def search_chunks(query, vectorizer, matrix, chunks, top_k=3):
    """Find top_k most relevant chunks for a query."""
    query_vec = vectorizer.transform([query])
    scores = cosine_similarity(query_vec, matrix).flatten()
    
    top_indices = scores.argsort()[-top_k:][::-1]
    
    results = []
    for idx in top_indices:
        if scores[idx] > 0.01:  # minimum relevance threshold
            results.append({
                "text": chunks[idx]["text"],
                "score": float(scores[idx]),
                "chunkId": chunks[idx]["id"]
            })

    return results


# ── HTTP Handler ─────────────────────────────────────────────

class RAGLLMHandler(BaseHTTPRequestHandler):

    def do_POST(self):

        # ── Upload + index a PDF ──
        if self.path.startswith("/upload"):
            # Get userId from query param
            user_id = self.path.split("userId=")[-1] if "userId=" in self.path else "default"

            length = int(self.headers["Content-Length"])
            data = self.rfile.read(length)

            with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
                tmp.write(data)
                tmp_path = tmp.name

            try:
                print(f"[RAG-LLM] Indexing PDF for user {user_id}...")
                text = extract_text(tmp_path)

                if not text or len(text) < 100:
                    self._respond(400, {"error": "Could not extract text from PDF. Make sure it's not scanned."})
                    return

                chunks = chunk_text(text)
                print(f"[RAG-LLM] Created {len(chunks)} chunks")

                vectorizer, matrix = build_index(chunks)

                # Store in memory per user
                USER_DOCS[user_id] = {
                    "chunks": chunks,
                    "vectorizer": vectorizer,
                    "matrix": matrix,
                    "chunkCount": len(chunks),
                    "wordCount": len(text.split())
                }

                self._respond(200, {
                    "message": f"Document indexed! {len(chunks)} sections ready to search.",
                    "chunks": len(chunks),
                    "words": len(text.split())
                })

            except Exception as e:
                print(f"[RAG-LLM] Error: {e}")
                self._respond(500, {"error": str(e)})
            finally:
                os.unlink(tmp_path)

        # ── Search + get relevant chunks ──
        elif self.path.startswith("/search"):
            user_id = self.path.split("userId=")[-1] if "userId=" in self.path else "default"

            length = int(self.headers["Content-Length"])
            body = json.loads(self.rfile.read(length))
            query = body.get("query", "")

            if user_id not in USER_DOCS:
                self._respond(404, {"error": "No document uploaded yet."})
                return

            doc = USER_DOCS[user_id]
            results = search_chunks(
                query,
                doc["vectorizer"],
                doc["matrix"],
                doc["chunks"]
            )

            self._respond(200, {"chunks": results, "query": query})

    def do_GET(self):
        if self.path.startswith("/status"):
            user_id = self.path.split("userId=")[-1] if "userId=" in self.path else "default"
            has_doc = user_id in USER_DOCS
            self._respond(200, {
                "status": "running",
                "hasDocument": has_doc,
                "chunks": USER_DOCS[user_id]["chunkCount"] if has_doc else 0
            })

        elif self.path == "/ping":
            self._respond(200, {"status": "running"})

    def _respond(self, code, data):
        body = json.dumps(data).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        print(f"[RAG-LLM] {fmt % args}")


if __name__ == "__main__":
    server = HTTPServer(("localhost", 5004), RAGLLMHandler)
    print("RAG+LLM service running on port 5004 ✅")
    server.serve_forever()
