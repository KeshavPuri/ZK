// DBService.js
const mongoose = require("mongoose");
require("dotenv").config();

// User Schema (Woh data jo hum MongoDB mein save karenge)
const userSchema = new mongoose.Schema({
    zk_id: { type: String, required: true, unique: true }, // ZK-ID (publicHash)
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    college: { type: String },
    registered_at: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);

// MongoDB se connect karo
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB Atlas se safalta se connect ho gaye.");
    } catch (error) {
        console.error("❌ MongoDB connection FAILED:", error);
        process.exit(1);
    }
}

// User ko DB mein save karne ka function
async function registerUser(userData) {
    try {
        const newUser = new User(userData);
        await newUser.save();
        return newUser;
    } catch (error) {
        if (error.code === 11000) { // MongoDB duplicate error
            throw new Error("User already registered with this ZK-ID or Email.");
        }
        throw error;
    }
}

// User ka data uski ZK-ID se nikalne ka function
async function getUserByZkID(zk_id) {
    return User.findOne({ zk_id });
}

module.exports = {
    connectDB,
    registerUser,
    getUserByZkID,
};