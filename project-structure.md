# 📚 Vocabulary Learning App - Complete Project Structure & Flow Guide

## 🎯 Project Overview

This is a **MERN Stack Vocabulary Learning Application** that helps users learn new words through multiple interactive methods. The app combines traditional learning techniques (flashcards, quizzes) with AI-powered features (RAG, LLM context generation, OCR text extraction).

**Tech Stack:**
- **Frontend:** React 19, React Router v7, Axios
- **Backend:** Node.js, Express.js, MongoDB
- **AI/ML Services:** Python (OCR, RAG, LLM services)
- **Database:** MongoDB (Cloud)
- **Deployment:** Docker, Vercel

---

## 📂 Project Folder Structure

```
vocab-app-complete/
├── backend/                          # Node.js + Express Server
│   ├── config/
│   │   └── db.js                    # MongoDB connection logic
│   ├── models/
│   │   ├── User.js                  # User schema (name, email, password)
│   │   └── Word.js                  # Word schema (meaning, synonyms, tracking)
│   ├── controllers/
│   │   ├── authController.js        # Register & Login logic
│   │   ├── wordController.js        # CRUD operations for words
│   │   └── quizController.js        # Quiz generation & scoring
│   ├── middleware/
│   │   └── authMiddleware.js        # JWT verification
│   ├── routes/
│   │   ├── authRoutes.js            # Auth endpoints
│   │   ├── wordRoutes.js            # Word CRUD endpoints
│   │   ├── quizRoutes.js            # Quiz endpoints
│   │   ├── pdfRoutes.js             # PDF handling
│   │   ├── ocrRoutes.js             # OCR service endpoints
│   │   ├── ragRoutes.js             # RAG (Retrieval-Augmented Generation)
│   │   ├── ragLlmRoutes.js          # LLM-powered context generation
│   │   └── contextualRoutes.js      # Contextual meaning generation
│   ├── utils/
│   │   └── aiSentence.js            # AI sentence generation utilities
│   ├── server.js                    # Express app entry point
│   ├── ocr_service.py               # Python service for OCR (text extraction)
│   ├── pdf_service.py               # Python service for PDF processing
│   ├── rag_service.py               # Python service for RAG embeddings
│   ├── rag_llm_service.py           # Python service for LLM context generation
│   ├── package.json                 # Node dependencies
│   ├── requirements.txt             # Python dependencies
│   └── Dockerfile                   # Docker container configuration
│
├── frontend/                         # React Application
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.js             # Login page
│   │   │   ├── Register.js          # Registration page
│   │   │   ├── Dashboard.js         # Main hub (overview)
│   │   │   ├── Vocabulary.js        # Word list & management
│   │   │   ├── Flashcards.js        # Flashcard learning module
│   │   │   ├── Quiz.js              # Quiz module
│   │   │   ├── PDFReader.js         # PDF reading & extraction
│   │   │   ├── OCR.js               # Image text extraction
│   │   │   ├── WordProfile.js       # Individual word details
│   │   │   ├── ContextualMeaning.js # AI contextual meanings
│   │   │   └── DocumentQA.js        # Document Q&A
│   │   ├── components/
│   │   │   ├── Navbar.js            # Navigation component
│   │   │   ├── WordList.jsx         # Reusable word list
│   │   │   ├── AddWord.jsx          # Add new word form
│   │   │   ├── Flashcard.js         # Flashcard component
│   │   │   ├── VocabTree.jsx        # Visual vocab tree
│   │   │   ├── AppLayout.jsx        # App wrapper layout
│   │   │   ├── GazetteShell.jsx     # Custom shell component
│   │   │   └── YarnBallLogo.jsx     # Logo component
│   │   ├── hooks/
│   │   │   └── useTheme.js          # Theme management hook
│   │   ├── api.js                   # Axios instance for API calls
│   │   ├── navLinks.js              # Navigation configuration
│   │   ├── App.js                   # Main app router
│   │   ├── index.js                 # React entry point
│   │   └── setupTests.js            # Testing setup
│   ├── public/
│   │   └── manifest.json            # PWA manifest
│   ├── package.json                 # React dependencies
│   ├── Dockerfile                   # Docker for frontend
│   └── nginx.conf                   # Nginx server config
│
├── docker-compose.yml               # Docker multi-container setup
├── DOCKER.md                        # Docker documentation
└── README.md                        # Main project README

```

---

## 🔄 Application Flow (How Everything Works Together)

### 1️⃣ **Authentication Flow**

```
User → Frontend (Login/Register Page)
  ↓
Enters credentials → Sends POST to /api/auth/register or /api/auth/login
  ↓
Backend (authController)
  ├─ Register: Hash password → Store in MongoDB
  └─ Login: Verify password → Generate JWT token
  ↓
Frontend receives token → Stores in localStorage
  ↓
All future requests include token in Authorization header
```

**Key Files:**
- Frontend: `pages/Login.js`, `pages/Register.js`
- Backend: `controllers/authController.js`, `routes/authRoutes.js`
- Security: `middleware/authMiddleware.js`

---

### 2️⃣ **Word Management Flow**

```
Dashboard → User clicks "Add Word"
  ↓
AddWord Component pops up → User enters word details
  ↓
POST /api/words → Backend wordController.addWord()
  ↓
Validates & saves to MongoDB Word collection
  ↓
Frontend refetches word list via GET /api/words
  ↓
Display updated list in Vocabulary page
```

**Operations Supported:**
- ✅ Create (POST /api/words)
- ✅ Read (GET /api/words)
- ✅ Update (PUT /api/words/:id)
- ✅ Delete (DELETE /api/words/:id)

**Key Files:**
- Frontend: `components/AddWord.jsx`, `components/WordList.jsx`, `pages/Vocabulary.js`
- Backend: `controllers/wordController.js`, `routes/wordRoutes.js`

---

### 3️⃣ **Flashcard Learning Flow**

```
User → Click "Flashcards" → GET /api/words (fetch all words)
  ↓
Frontend displays flashcards one by one (word on front, meaning on back)
  ↓
User marks as "Learned" or "Need Review"
  ↓
PUT /api/words/:id → Update word status & lastReviewed date
  ↓
Mark word as "learned" status in MongoDB
```

**Key Files:**
- Frontend: `pages/Flashcards.js`, `components/Flashcard.js`
- Backend: `controllers/wordController.js`

---

### 4️⃣ **Quiz Flow**

```
User → Click "Quiz" → GET /api/quiz (backend generates questions)
  ↓
Backend (quizController):
  ├─ Fetch random words
  ├─ Generate multiple choice options
  └─ Send to frontend

Frontend:
  ├─ Display question with options
  ├─ User selects answer
  └─ POST /api/quiz/submit → Send answer

Backend validates:
  ├─ If correct: correctCount++
  └─ If wrong: wrongCount++
  ↓
Frontend shows score & review
```

**Key Files:**
- Frontend: `pages/Quiz.js`
- Backend: `controllers/quizController.js`, `routes/quizRoutes.js`

---

### 5️⃣ **PDF Upload & Text Extraction Flow**

```
User → Click "PDF Reader" → Upload PDF file
  ↓
Frontend sends file to POST /api/pdf/upload
  ↓
Backend receives file via multer middleware
  ↓
Calls pdf_service.py → Extract text from PDF
  ↓
Python service:
  ├─ Parse PDF
  ├─ Extract all text
  └─ Return text content

Backend:
  ├─ Returns extracted text
  ├─ Optionally: Extract words & save to DB

Frontend:
  ├─ Display extracted text
  ├─ User can select words & add to vocabulary
```

**Key Files:**
- Frontend: `pages/PDFReader.js`
- Backend: `routes/pdfRoutes.js`, `pdf_service.py`

---

### 6️⃣ **OCR (Optical Character Recognition) Flow**

```
User → Click "OCR" → Upload image with text
  ↓
Frontend sends image to POST /api/ocr/extract
  ↓
Backend receives image via multer
  ↓
Calls ocr_service.py → Extract text from image
  ↓
Python service (using Tesseract/Paddle OCR):
  ├─ Read image
  ├─ Detect & extract text
  └─ Return extracted text

Frontend:
  ├─ Display extracted text
  ├─ User can add words to vocabulary
```

**Key Files:**
- Frontend: `pages/OCR.js`
- Backend: `routes/ocrRoutes.js`, `ocr_service.py`

---

### 7️⃣ **RAG (Retrieval-Augmented Generation) Flow**

```
User → Click word → Get contextual meaning
  ↓
Frontend: GET /api/rag/context?word=example
  ↓
Backend routes to ragController
  ↓
Calls rag_service.py → Generate embeddings & retrieve context
  ↓
Python service:
  ├─ Convert word to embedding (vector representation)
  ├─ Search in RAG database (rag_db.pkl)
  ├─ Retrieve similar contexts
  └─ Return relevant examples

Frontend:
  ├─ Display contextual meanings
  ├─ Show related words & sentences
```

**Key Files:**
- Frontend: `pages/ContextualMeaning.js`
- Backend: `routes/ragRoutes.js`, `rag_service.py`
- Database: `rag_db.pkl`

---

### 8️⃣ **LLM Context Generation Flow**

```
User → Word Details Page
  ↓
Frontend: GET /api/ragl/context?word=example
  ↓
Backend routes to ragLlmController
  ↓
Calls rag_llm_service.py → Generate contextual sentences using LLM
  ↓
Python service:
  ├─ Connect to LLM API (GPT, Claude, etc.)
  ├─ Prompt: "Create example sentences for word: example"
  ├─ Get AI-generated sentences
  └─ Return contextual examples

Frontend:
  ├─ Display AI-generated content
  ├─ Show example sentences & usage
```

**Key Files:**
- Frontend: `pages/WordProfile.js`
- Backend: `routes/ragLlmRoutes.js`, `rag_llm_service.py`

---

### 9️⃣ **Word Profile Page Flow**

```
User → Click on word in list
  ↓
Frontend routes to: /profile/:word
  ↓
WordProfile.js component:
  ├─ GET /api/words/:id → Fetch word details
  ├─ GET /api/ragl/context → Fetch AI context
  ├─ GET /api/rag/context → Fetch RAG context
  └─ Combine & display

Display:
  ├─ Word meaning
  ├─ Synonyms
  ├─ Example sentences
  ├─ AI-generated context
  ├─ Quiz stats (correct/wrong count)
  └─ Last reviewed date
```

**Key Files:**
- Frontend: `pages/WordProfile.js`
- Backend: Multiple routes combined

---

## 🔐 Security & Authentication

### JWT Token System

```
Login → Generate JWT with user ID
  ↓
Token stored in localStorage (frontend)
  ↓
Every request includes: Authorization: Bearer <token>
  ↓
Backend authMiddleware verifies token
  ├─ Valid → Allow request
  └─ Invalid/Expired → Return 401 error
```

**Key Files:**
- Backend: `middleware/authMiddleware.js`
- Frontend: `api.js` (adds token to all requests)

---

## 📊 Database Schema

### **User Collection**
```javascript
{
  _id: ObjectId,
  name: String,           // User's full name
  email: String,          // Unique email
  password: String,       // Hashed password
  createdAt: Date,
  updatedAt: Date
}
```

### **Word Collection**
```javascript
{
  _id: ObjectId,
  userId: ObjectId,       // Reference to User
  word: String,           // The vocabulary word
  meaning: String,        // Definition
  exampleSentence: String,// Example usage
  synonyms: [String],     // Related words
  status: String,         // "review" or "learned"
  correctCount: Number,   // Quiz correct answers
  wrongCount: Number,     // Quiz wrong answers
  lastReviewed: Date,     // Last flashcard review
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🐳 Docker Setup

The project uses Docker for containerization:

```yaml
# docker-compose.yml structure:
services:
  backend:
    - Node.js Express server
    - Connects to MongoDB
    - Runs Python microservices
  
  frontend:
    - React app served via Nginx
    - Static asset delivery
    - SPA routing configuration
```

**Run Commands:**
```bash
docker-compose up              # Start all services
docker-compose down            # Stop all services
```

---

## 🚀 API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| **POST** | `/api/auth/register` | Create new account |
| **POST** | `/api/auth/login` | Login user |
| **GET** | `/api/words` | Fetch all words |
| **POST** | `/api/words` | Add new word |
| **PUT** | `/api/words/:id` | Update word |
| **DELETE** | `/api/words/:id` | Delete word |
| **GET** | `/api/quiz` | Get quiz questions |
| **POST** | `/api/quiz/submit` | Submit quiz answer |
| **POST** | `/api/pdf/upload` | Upload PDF for text extraction |
| **POST** | `/api/ocr/extract` | Extract text from image |
| **GET** | `/api/rag/context` | Get contextual meanings (RAG) |
| **GET** | `/api/ragl/context` | Get AI-generated context (LLM) |
| **GET** | `/api/profile/:word` | Get word profile page |

---

## 🔧 Environment Variables

### Backend (.env)
```
MONGO_URI=mongodb+srv://...      # MongoDB connection
JWT_SECRET=your_secret_key        # JWT signing key
NODE_ENV=development             # Environment
PORT=5000                        # Server port
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000  # Backend URL
```

---

## 📋 How to Explain This Project in an Interview

### 30-Second Pitch
*"This is a MERN stack vocabulary learning application that helps users expand their vocabulary through flashcards, quizzes, and AI-powered context generation. It features PDF and image text extraction via OCR, intelligent word retrieval using RAG embeddings, and personalized learning tracking."*

### Key Features to Highlight
1. **Full-Stack Development**: React frontend + Node/Express backend
2. **User Authentication**: JWT-based secure login
3. **AI Integration**: RAG & LLM services for contextual learning
4. **Multi-Input Methods**: Manual entry, PDF upload, image OCR
5. **Interactive Learning**: Flashcards, quizzes with performance tracking
6. **Cloud Integration**: MongoDB cloud + Vercel deployment

### Technical Challenges You Solved
- PDF text extraction using Python service
- Image OCR integration
- RAG embeddings for semantic search
- JWT token management
- Database modeling for word tracking

---

## 🎯 Next Steps to Extend

1. **Analytics Dashboard**: Track learning progress over time
2. **Spaced Repetition Algorithm**: Optimize review scheduling
3. **Multiplayer Quizzes**: Compete with other learners
4. **Mobile App**: React Native for iOS/Android
5. **Voice Pronunciation**: Audio generation & recognition
6. **Community Features**: Share word lists & learn together


