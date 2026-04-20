import { Router } from "express";
import bcrypt from "bcrypt";
import pool from "../db/pool.js";
import { registerSchema, loginSchema } from "../schemas/auth.schema.js";
import { signJwt } from "../utils/jwt.js";
import { requireAuth } from "../middlewares/auth.js";
import type { AuthedRequest } from "../middlewares/auth.js";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message });
    }

    const { email, password } = parsed.data;

    const existing = await pool.query("SELECT id FROM users WHERE email=$1", [email]);
    if (existing.rowCount && existing.rowCount > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const created = await pool.query(
      "INSERT INTO users(email, password_hash) VALUES($1,$2) RETURNING id, email",
      [email, passwordHash]
    );

    return res.json(created.rows[0]);
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: "Server error during register" });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message });
    }

    const { email, password } = parsed.data;

    const userRes = await pool.query(
      "SELECT id, email, password_hash FROM users WHERE email=$1",
      [email]
    );

    if (!userRes.rowCount || userRes.rowCount === 0) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const user = userRes.rows[0];

    if (!user || !user.password_hash) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = signJwt({ userId: user.id, email: user.email });

    return res.json({ token });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error during login" });
  }
});

authRouter.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  try {
    return res.json({ id: req.user!.userId, email: req.user!.email });
  } catch (error) {
    console.error("Get me error:", error);
    return res.status(500).json({ message: "Server error fetching user info" });
  }
});