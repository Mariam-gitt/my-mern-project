// const express = require("express");
// const router = express.Router();

// // test route
// router.get("/", (req, res) => {
//     res.send("Auth route working 🚀");
// });

// module.exports = router;
const express = require("express");
const router = express.Router();

const {
    register,
    login
} = require("../controllers/authController");

/**
 * Register user
 */
router.post("/register", register);

/**
 * Login user
 */
router.post("/login", login);

module.exports = router;