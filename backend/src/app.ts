import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { authRouter } from "./routes/auth.routes.js";
import { taxRouter } from "./routes/tax.routes.js";
import { historyRouter } from "./routes/history.routes.js";

dotenv.config();

export const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/tax", taxRouter);
app.use("/api/history", historyRouter);
