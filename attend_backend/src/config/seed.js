require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/Users");

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI is not defined in environment variables");
  process.exit(1);
}

// Initial user data
const initialUser = {
  name: "Admin User",
  email: "admin@example.com",
  age: 30,
  isActive: true,
};

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB for seeding");

    // Check if user already exists
    const existingUser = await User.findOne({ email: initialUser.email });
    if (existingUser) {
      console.log("Initial user already exists:", existingUser.email);
      await mongoose.connection.close();
      process.exit(0);
    }

    // Create initial user
    const user = new User(initialUser);
    const savedUser = await user.save();
    console.log("Initial user created successfully:");
    console.log({
      id: savedUser._id,
      name: savedUser.name,
      email: savedUser.email,
      age: savedUser.age,
      isActive: savedUser.isActive,
    });

    // Close connection
    await mongoose.connection.close();
    console.log("Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run seed
seedDatabase();
