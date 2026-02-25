import { z } from "zod";

export const deductionSchema = z.object({
  type: z.string().min(1),
  amount: z.coerce.number().nonnegative(),
});

// 供现有计算器表单使用的简单版 schema
export const taxSchema = z.object({
  taxYear: z.string().min(4),
  income: z.coerce.number().nonnegative(),
  deductions: z.array(deductionSchema).default([]),
});

export type TaxInput = z.input<typeof taxSchema>;

// 更详细的表单（支持多种收入模式），可供后续新界面使用
export const taxFormSchema = z.object({
  taxYear: z.string().min(4),
  incomeMode: z.enum(["annual", "hourly"]),
  annualIncome: z.coerce.number().nonnegative().optional(),
  hourlyRate: z.coerce.number().nonnegative().optional(),
  hoursPerWeek: z.coerce.number().nonnegative().optional(),
  weeksPerYear: z.coerce.number().nonnegative().optional(),
  deductions: z.array(deductionSchema).default([]),
});

export type TaxFormInput = z.infer<typeof taxFormSchema>;
