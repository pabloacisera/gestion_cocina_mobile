import { Router } from "express";
import { prisma } from "../prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { Prisma } from "../../generated/prisma/index.js"; // Import Prisma types

// Schemas for validation
const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

const router = Router();

// JWT Secret - Should be loaded from environment variables
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey"; // Fallback, but use .env in production

// Helper function to generate JWT
const generateToken = (userId: number) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "1h" });
};

// POST /api/auth/register
router.post("/register", async (req, res, next) => {
  try {
    const validated = RegisterSchema.safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        errors: validated.error.flatten(),
      });
    }

    const { name, email, password } = validated.data;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: { // Select only necessary fields
        id: true,
        name: true,
        email: true,
        role: true,
      }
    });

    res.status(201).json({ success: true, data: user, message: "User registered successfully" });
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') { // Unique constraint failed on the email field
        return res.status(400).json({ success: false, error: "Email already exists" });
      }
    }
    next(error); // Pass other errors to the global error handler
  }
});

// POST /api/auth/login
router.post("/login", async (req, res, next) => {
  try {
    const validated = LoginSchema.safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        errors: validated.error.flatten(),
      });
    }

    const { email, password } = validated.data;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, password: true, role: true, name: true } // Select password for verification
    });

    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    // Compare password
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    // Generate JWT
    const token = generateToken(user.id);

    // Set JWT in HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true, // More secure against XSS
      secure: process.env.NODE_ENV === "production", // Use secure in production (HTTPS)
      sameSite: "strict", // Protect against CSRF
      maxAge: 60 * 60 * 1000, // 1 hour, matches token expiry
    });

    // Return user info without password
    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      message: "Login successful",
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout
router.post("/logout", async (req, res, next) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    res.json({ success: true, message: "Logout successful" });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
// Protected route to get current user info
router.get("/me", async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, name: true, role: true }, // Exclude password
      });

      if (!user) {
        // Token is valid but user does not exist (e.g., deleted account)
        res.clearCookie("token", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" });
        return res.status(401).json({ success: false, error: "User not found" });
      }

      res.json({ success: true, data: user });
    } catch (jwtError) {
      // Token is invalid or expired
      res.clearCookie("token", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" });
      return res.status(401).json({ success: false, error: "Invalid or expired token" });
    }
  } catch (error) {
    next(error);
  }
});

export default router;
