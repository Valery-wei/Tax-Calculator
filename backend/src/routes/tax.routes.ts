import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import type { AuthedRequest } from "../middlewares/auth.js";
import { calculateTaxSchema } from "../schemas/tax.schema.js";
import { calculateTax } from "../services/tax.service.js";
import pool from "../db/pool.js";

export const taxRouter = Router();

taxRouter.post("/calculate", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = calculateTaxSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message });
  console.log("parsed tax input:", parsed.data);

  const result = calculateTax(parsed.data);

  const insert = await pool.query(
    `INSERT INTO tax_records(user_id, tax_year, income, deductions, result)
     VALUES($1,$2,$3,$4::jsonb,$5::jsonb)
     RETURNING id`,
    [
      req.user!.userId,
      parsed.data.taxYear,
      parsed.data.income,
      JSON.stringify(parsed.data.deductions),
      JSON.stringify(result),
    ]
  );

  return res.json({ recordId: insert.rows[0].id, ...result });
});
