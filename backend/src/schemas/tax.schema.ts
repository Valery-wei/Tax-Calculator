import { z } from "zod";

export const deductionItemSchema = z.object({
  type: z.string().min(1),
  amount: z.number().nonnegative(),
});

export const calculateTaxSchema = z.object({
  taxYear: z.string().min(4),
  income: z.number().nonnegative(),
  deductions: z.array(deductionItemSchema).default([]),
});
