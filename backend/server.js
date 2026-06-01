// // const express = require("express");
// // const cors = require("cors");
// // const dotenv = require("dotenv");
// // const connectDB = require("./config/db");

// // // load env
// // dotenv.config();
// // console.log("KEY:", process.env.GROQ_API_KEY);

// // // connect DB
// // connectDB();

// // const app = express();

// // // middleware
// // app.use(cors());
// // app.use(express.json());

// // // test route
// // app.get("/", (req, res) => {
// //     res.send("Vocabulary App Backend is running 🚀");
// // });

// // // routes
// // app.use("/api/auth", require("./routes/authRoutes"));
// // app.use("/api/words", require("./routes/wordRoutes"));
// // app.use("/api/quiz", require("./routes/quizRoutes"));
// // app.use("/api/pdf", require("./routes/pdfRoutes"));
// // app.use("/api/rag", require("./routes/ragRoutes"));
// // app.use("/api/contextual", require("./routes/contextualRoutes"));
// // app.use("/api/ragl", require("./routes/ragLlmRoutes"));
// // app.use("/api/ocr", require("./routes/ocrRoutes"));
// // app.use("/api/profile", require("./routes/wordProfileRoutes"));

// // // port
// // const PORT = process.env.PORT || 5000;

// // app.listen(PORT, () => {
// //     console.log(`Server running on port ${PORT}`);
// // });


// // module.exports = app;

// const express = require("express");
// const cors = require("cors");
// const dotenv = require("dotenv");
// const connectDB = require("./config/db");

// // load env
// dotenv.config();
// console.log("KEY:", process.env.GROQ_API_KEY);

// // connect DB
// connectDB();

// const app = express();

// // 🛠️ FIX 1: Configure CORS explicitly for Vercel
// // app.use(cors({
// //     origin: "https://my-mern-project-frontend-1.vercel.app",
// //     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
// //     allowedHeaders: ["Content-Type", "Authorization"],
// //     credentials: true
// // }));

// // middleware
// // app.use(cors({
// //     origin: "https://my-mern-project-frontend-1.vercel.app",
// //     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
// //     allowedHeaders: ["Content-Type", "Authorization"],
// //     credentials: true
// // }));

// // // 🛠️ THE CRITICAL FIX: Express 4 requires (.*) instead of just *
// // app.options("/(.*)", cors());

// // app.use(express.json());




// // 🛠️ FIX 2: Handle preflight requests globally
// // app.options("*", cors());

// // app.use(express.json());


// // middleware
// app.use(cors({
//     origin: "https://my-mern-project-frontend-1.vercel.app",
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//     credentials: true
// }));

// // 🛠️ ONLY CHANGE THIS ONE LINE BELOW:
// app.options("/(.*)", cors()); 

// app.use(express.json());

// // test route
// app.get("/", (req, res) => {
//     res.send("Vocabulary App Backend is running 🚀");
// });

// // routes
// app.use("/api/auth", require("./routes/authRoutes"));
// app.use("/api/words", require("./routes/wordRoutes"));
// app.use("/api/quiz", require("./routes/quizRoutes"));
// app.use("/api/pdf", require("./routes/pdfRoutes"));
// app.use("/api/rag", require("./routes/ragRoutes"));
// app.use("/api/contextual", require("./routes/contextualRoutes"));
// app.use("/api/ragl", require("./routes/ragLlmRoutes"));
// app.use("/api/ocr", require("./routes/ocrRoutes"));
// app.use("/api/profile", require("./routes/wordProfileRoutes"));

// // port
// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
// });

// module.exports = app;

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// 1. Load env variables
dotenv.config();
console.log("KEY:", process.env.GROQ_API_KEY);

const app = express();

// 2. Middleware configuration
app.use(cors({
    origin: "https://my-mern-project-frontend-1.vercel.app",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

app.options("/(.*)", cors());
app.use(express.json());

// 3. Test Route
app.get("/", (req, res) => {
    res.send("Vocabulary App Backend is running 🚀");
});

// 4. API Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/words", require("./routes/wordRoutes"));
app.use("/api/quiz", require("./routes/quizRoutes"));
app.use("/api/pdf", require("./routes/pdfRoutes"));
app.use("/api/rag", require("./routes/ragRoutes"));
app.use("/api/contextual", require("./routes/contextualRoutes"));
app.use("/api/ragl", require("./routes/ragLlmRoutes"));
app.use("/api/ocr", require("./routes/ocrRoutes"));
app.use("/api/profile", require("./routes/wordProfileRoutes"));

// 5. 🛠️ FIXED: Initialize DB without blocking the Vercel export wrapper
connectDB().catch(err => console.error("MongoDB initial connection error:", err));

// 6. Only listen on a port if running locally (not on Vercel)
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Local server running on port ${PORT}`);
    });
}

module.exports = app;