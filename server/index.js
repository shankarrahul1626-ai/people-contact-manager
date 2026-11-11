import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createHash } from "node:crypto";
import express from "express";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Contact from "./models/Contact.js";
import User from "./models/User.js";

const app = express();
const port = Number(process.env.PORT) || 5000;
const sessionSecret = process.env.AUTH_TOKEN_SECRET;
const sessionCookie = "people_session";
const sessionDurationMs = 7 * 24 * 60 * 60 * 1000;
const contactFields = ["name", "email", "phone", "company", "role", "notes", "favorite"];

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json({ limit: "20kb" }));
app.use(cookieParser());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many sign-in attempts. Please try again in 15 minutes." },
});

function createSession(userId) {
  return jwt.sign({ sub: userId }, sessionSecret, { expiresIn: "7d" });
}

function passwordDigest(password) {
  return createHash("sha256").update(password, "utf8").digest("hex");
}

function setSessionCookie(res, token) {
  res.cookie(sessionCookie, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: sessionDurationMs,
    path: "/api",
  });
}

function requireSession(req, res, next) {
  const token = req.cookies[sessionCookie];
  if (!token) {
    return res.status(401).json({ message: "Please sign in to continue." });
  }

  try {
    const payload = jwt.verify(token, sessionSecret);
    if (typeof payload === "string" || typeof payload.sub !== "string") {
      return res.status(401).json({ message: "Your session is invalid. Please sign in again." });
    }
    req.userId = payload.sub;
    next();
  } catch {
    res.clearCookie(sessionCookie, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/api" });
    res.status(401).json({ message: "Your session has expired. Please sign in again." });
  }
}

function readContactFields(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }
  return Object.fromEntries(
    contactFields
      .filter((field) => Object.hasOwn(body, field))
      .map((field) => [field, body[field]]),
  );
}

app.use("/api/auth", authLimiter);

app.post("/api/auth/signup", async (req, res, next) => {
  try {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }
    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({ message: "Password must be between 8 and 128 characters." });
    }

    const user = await User.create({
      email,
      passwordHash: await bcrypt.hash(passwordDigest(password), 12),
    });
    setSessionCookie(res, createSession(user.id));
    res.status(201).json({ user: { id: user.id, email: user.email } });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const user = email.length <= 254 ? await User.findOne({ email }).select("+passwordHash") : null;
    const passwordMatches = user && password.length <= 128
      ? await bcrypt.compare(passwordDigest(password), user.passwordHash)
      : false;

    if (!passwordMatches) {
      return res.status(401).json({ message: "Email or password is incorrect." });
    }

    setSessionCookie(res, createSession(user.id));
    res.json({ user: { id: user.id, email: user.email } });
  } catch (error) {
    next(error);
  }
});

app.get("/api/auth/me", requireSession, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select("email");
    if (!user) {
      res.clearCookie(sessionCookie, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/api" });
      return res.status(401).json({ message: "Your account is no longer available. Please sign in again." });
    }
    res.json({ user: { id: user.id, email: user.email } });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/logout", (_req, res) => {
  res.clearCookie(sessionCookie, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/api" });
  res.status(204).end();
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", database: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
});

app.get("/api/contacts", requireSession, async (req, res, next) => {
  try {
    const contacts = await Contact.find({ ownerId: req.userId }).sort({ favorite: -1, name: 1 });
    res.json(contacts);
  } catch (error) {
    next(error);
  }
});

app.post("/api/contacts", requireSession, async (req, res, next) => {
  try {
    const fields = readContactFields(req.body);
    if (!fields) {
      return res.status(400).json({ message: "Provide a valid contact object." });
    }
    const contact = await Contact.create({ ...fields, ownerId: req.userId });
    res.status(201).json(contact);
  } catch (error) {
    next(error);
  }
});

app.patch("/api/contacts/:id", requireSession, async (req, res, next) => {
  try {
    const fields = readContactFields(req.body);
    if (!fields || Object.keys(fields).length === 0) {
      return res.status(400).json({ message: "Provide at least one valid contact field to update." });
    }
    const contact = await Contact.findOne({ _id: req.params.id, ownerId: req.userId });

    if (!contact) {
      return res.status(404).json({ message: "Contact not found." });
    }

    contact.set(fields);
    res.json(await contact.save());
  } catch (error) {
    next(error);
  }
});

app.delete("/api/contacts/:id", requireSession, async (req, res, next) => {
  try {
    const contact = await Contact.findOneAndDelete({ _id: req.params.id, ownerId: req.userId });
    if (!contact) {
      return res.status(404).json({ message: "Contact not found." });
    }
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  if (error.code === 11000) {
    return res.status(409).json({ message: "An account with this email already exists." });
  }
  if (error.name === "ValidationError" || error.name === "CastError") {
    return res.status(400).json({ message: error.message });
  }
  console.error("API error:", error);
  res.status(500).json({ message: "Something went wrong. Please try again." });
});

async function start() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not set. Add it to your .env file before starting the server.");
  }
  if (!sessionSecret || sessionSecret.length < 32) {
    throw new Error("AUTH_TOKEN_SECRET must be set to a random secret with at least 32 characters.");
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");
  app.listen(port, () => {
    console.log(`API server listening on http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error("Could not start the API server:", error.message);
  process.exitCode = 1;
});
