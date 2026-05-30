const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/**
 * REGISTER USER
 */
exports.register = async (req, res) => {

    const { name, email, password } = req.body;

    try {
        // check if user exists
        const exists = await User.findOne({ email });
        if (exists) {
            return res.status(400).json({ message: "User already exists" });
        }

        // hash password (security)
        const hashedPassword = await bcrypt.hash(password, 10);

        // create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword
        });

        res.json({ message: "User registered successfully 💛" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * LOGIN USER
 */
exports.login = async (req, res) => {

    const { email, password } = req.body;

    try {
        // find user
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        // compare password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid password" });
        }

        // create token
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({ token, user: user.name });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};