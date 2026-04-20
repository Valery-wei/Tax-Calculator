import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import type { AuthedRequest } from "../middlewares/auth.js";
import pool from "../db/pool.js";
export const historyRouter = Router();

historyRouter.get("/", requireAuth, async (req: AuthedRequest, res) => {
  const limit = Math.min(50, Number(req.query.limit ?? 20));
  const offset = Math.max(0, Number(req.query.offset ?? 0));

  const rows = await pool.query(
    `SELECT id, tax_year, income, created_at, result
     FROM tax_records
     WHERE user_id=$1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [req.user!.userId, limit, offset]
  );

  const list = rows.rows.map((r) => ({
    id: r.id,
    taxYear: r.tax_year,
    income: Number(r.income),
    createdAt: r.created_at,
    total: r.result?.total,
    taxableIncome: r.result?.taxableIncome,
    country: r.result?.country ?? "AU",
    currency: r.result?.currency ?? "AUD",
  }));

  return res.json(list);
});

historyRouter.get("/:id", requireAuth, async (req: AuthedRequest, res) => {
  const row = await pool.query(
    `SELECT *
     FROM tax_records
     WHERE id=$1 AND user_id=$2`,
    [req.params.id, req.user!.userId]
  );
  if (!row.rowCount) return res.status(404).json({ message: "Not found" });
  return res.json(row.rows[0]);
});
