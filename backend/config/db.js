const mongoose = require("mongoose");

// Function to connect database
const connectDB = async () => {

    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB Connected Successfully 💾");

    } catch (error) {
        console.log("MongoDB Connection Failed ❌", error);

        process.exit(1); 
        // stop server if DB fails
    }
};

module.exports = connectDB;