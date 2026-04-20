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

  const result = calculateTax(parsed.data);

  const taxYear = parsed.data.country === "CN" ? String(parsed.data.incomeYear) : parsed.data.taxYear;
  const income = parsed.data.country === "CN" ? parsed.data.data.annualGrossIncome : parsed.data.income;
  const deductions =
    parsed.data.country === "CN"
      ? [
          { type: "specialDeductions", amount: parsed.data.data.specialDeductions },
          { type: "otherDeductions", amount: parsed.data.data.otherDeductions },
          { type: "infantCare", amount: parsed.data.data.infantCare },
          { type: "childrenEducation", amount: parsed.data.data.childrenEducation },
          { type: "continuingEducation", amount: parsed.data.data.continuingEducation },
          { type: "seriousIllnessMedical", amount: parsed.data.data.seriousIllnessMedical },
          { type: "housingLoanInterest", amount: parsed.data.data.housingLoanInterest },
          { type: "housingRent", amount: parsed.data.data.housingRent },
          { type: "elderlyCare", amount: parsed.data.data.elderlyCare },
        ]
      : parsed.data.deductions;

  const insert = await pool.query(
    `INSERT INTO tax_records(user_id, tax_year, income, deductions, result)
     VALUES($1,$2,$3,$4::jsonb,$5::jsonb)
     RETURNING id`,
    [
      req.user!.userId,
      taxYear,
      income,
      JSON.stringify(deductions),
      JSON.stringify(result),
    ]
  );

  return res.json({ recordId: insert.rows[0].id, ...result });
});
