import { z } from "zod";

export const deductionItemSchema = z.object({
  type: z.string().min(1),
  amount: z.number().nonnegative(),
});

const calculateAuTaxSchema = z.object({
  country: z.literal("AU").optional().default("AU"),
  taxYear: z.string().min(4),
  income: z.number().nonnegative(),
  deductions: z.array(deductionItemSchema).default([]),
});

const calculateCnTaxSchema = z.object({
  country: z.literal("CN"),
  incomeYear: z.number().int().min(1900).max(3000),
  data: z.object({
    annualGrossIncome: z.number().nonnegative().default(0),
    specialDeductions: z.number().nonnegative().default(0),
    otherDeductions: z.number().nonnegative().default(0),
    infantCare: z.number().nonnegative().default(0),
    childrenEducation: z.number().nonnegative().default(0),
    continuingEducation: z.number().nonnegative().default(0),
    seriousIllnessMedical: z.number().nonnegative().default(0),
    housingLoanInterest: z.number().nonnegative().default(0),
    housingRent: z.number().nonnegative().default(0),
    elderlyCare: z.number().nonnegative().default(0),
  }),
});

export const calculateTaxSchema = z.union([calculateAuTaxSchema, calculateCnTaxSchema]);
