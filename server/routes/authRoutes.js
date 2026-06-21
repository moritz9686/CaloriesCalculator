import bcrypt from "bcryptjs";
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

function createToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      name: user.name
    },
    process.env.JWT_SECRET || "development-secret",
    { expiresIn: "7d" }
  );
}

router.post("/signup", async (request, response, next) => {
  try {
    const { name, email, password } = request.body;

    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return response.status(400).json({ message: "Name, email, and password are required." });
    }

    if (password.length < 6) {
      return response.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return response.status(409).json({ message: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      passwordHash
    });

    const token = createToken(user);

    return response.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/login", async (request, response, next) => {
  try {
    const { email, password } = request.body;

    if (!email?.trim() || !password?.trim()) {
      return response.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return response.status(401).json({ message: "Invalid email or password." });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return response.status(401).json({ message: "Invalid email or password." });
    }

    const token = createToken(user);

    return response.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
