export const CHINA_STANDARD_DEDUCTION = 60000;

export const CHINA_ANNUAL_TAX_BRACKETS = [
  { max: 36000, rate: 0.03, quickDeduction: 0 },
  { max: 144000, rate: 0.1, quickDeduction: 2520 },
  { max: 300000, rate: 0.2, quickDeduction: 16920 },
  { max: 420000, rate: 0.25, quickDeduction: 31920 },
  { max: 660000, rate: 0.3, quickDeduction: 52920 },
  { max: 960000, rate: 0.35, quickDeduction: 85920 },
  { max: Number.POSITIVE_INFINITY, rate: 0.45, quickDeduction: 181920 },
] as const;
