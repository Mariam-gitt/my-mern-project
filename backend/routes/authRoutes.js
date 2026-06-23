const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { register, login, deleteAccount, testEmail } = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.delete("/account", protect, deleteAccount);
router.get("/test-email", testEmail);   // debug only

module.exports = router;