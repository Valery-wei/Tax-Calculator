import {
  CHINA_ANNUAL_TAX_BRACKETS,
  CHINA_STANDARD_DEDUCTION,
} from "./china-tax.constants.js";

export type Deduction = {
  type: string;
  amount: number;
};

export type CountryCode = "AU" | "CN";

export type CalculateTaxInputAU = {
  country?: "AU";
  taxYear: string;
  income: number;
  deductions: Deduction[];
};

export type ChinaTaxData = {
  annualGrossIncome: number;
  specialDeductions: number;
  otherDeductions: number;
  infantCare: number;
  childrenEducation: number;
  continuingEducation: number;
  seriousIllnessMedical: number;
  housingLoanInterest: number;
  housingRent: number;
  elderlyCare: number;
};

export type CalculateTaxInputCN = {
  country: "CN";
  incomeYear: number;
  data: ChinaTaxData;
};

export type CalculateTaxInput = CalculateTaxInputAU | CalculateTaxInputCN;

export type CalculateTaxResultAU = {
  country: "AU";
  currency: "AUD";
  taxableIncome: number;
  tax: number;
  medicareLevy: number;
  total: number;
};

export type CalculateTaxResultCN = {
  country: "CN";
  currency: "CNY";
  grossIncome: number;
  taxableIncome: number;
  taxPayable: number;
  netIncome: number;
  appliedTaxRate: number;
  quickDeduction: number;
  deductionBreakdown: {
    standardDeduction: number;
    specialDeductions: number;
    specialAdditionalDeductions: number;
    otherDeductions: number;
    items: Omit<ChinaTaxData, "annualGrossIncome" | "specialDeductions" | "otherDeductions">;
  };
  total: number;
};

export type CalculateTaxResult = CalculateTaxResultAU | CalculateTaxResultCN;

function calxResidentIncomeTax(taxableIncome: number): number {
  const x = Math.max(0, taxableIncome);
  if (x <= 18200) return 0;
  if (x <= 45000) return (x - 18200) * 0.16;
  if (x <= 135000) return 4288 + (x - 45000) * 0.3;
  if (x <= 190000) return 31288 + (x - 135000) * 0.37;
  return 51638 + (x - 190000) * 0.45;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function calculateAustraliaTax(input: CalculateTaxInputAU): CalculateTaxResultAU {
  const taxabDeductions = input.deductions.reduce((s, d) => s + d.amount, 0);
  const taxableIncome = Math.max(0, input.income - taxabDeductions);
  const tax = calxResidentIncomeTax(taxableIncome);
  const medicareLevy = taxableIncome * 0.02;
  const total = tax + medicareLevy;

  return {
    country: "AU",
    currency: "AUD",
    taxableIncome: round2(taxableIncome),
    tax: round2(tax),
    medicareLevy: round2(medicareLevy),
    total: round2(total),
  };
}

function calculateChinaTax(input: CalculateTaxInputCN): CalculateTaxResultCN {
  const data = input.data;
  const specialAdditionalDeductions =
    data.infantCare +
    data.childrenEducation +
    data.continuingEducation +
    data.seriousIllnessMedical +
    data.housingLoanInterest +
    data.housingRent +
    data.elderlyCare;

  const taxableIncome = Math.max(
    0,
    data.annualGrossIncome -
      CHINA_STANDARD_DEDUCTION -
      data.specialDeductions -
      specialAdditionalDeductions -
      data.otherDeductions
  );

  let appliedTaxRate = 0.45;
  let quickDeduction = 181920;
  for (const b of CHINA_ANNUAL_TAX_BRACKETS) {
    if (taxableIncome <= b.max) {
      appliedTaxRate = b.rate;
      quickDeduction = b.quickDeduction;
      break;
    }
  }

  const taxPayable = Math.max(0, taxableIncome * appliedTaxRate - quickDeduction);
  const netIncome = data.annualGrossIncome - taxPayable;

  return {
    country: "CN",
    currency: "CNY",
    grossIncome: round2(data.annualGrossIncome),
    taxableIncome: round2(taxableIncome),
    taxPayable: round2(taxPayable),
    netIncome: round2(netIncome),
    appliedTaxRate,
    quickDeduction: round2(quickDeduction),
    deductionBreakdown: {
      standardDeduction: CHINA_STANDARD_DEDUCTION,
      specialDeductions: round2(data.specialDeductions),
      specialAdditionalDeductions: round2(specialAdditionalDeductions),
      otherDeductions: round2(data.otherDeductions),
      items: {
        infantCare: round2(data.infantCare),
        childrenEducation: round2(data.childrenEducation),
        continuingEducation: round2(data.continuingEducation),
        seriousIllnessMedical: round2(data.seriousIllnessMedical),
        housingLoanInterest: round2(data.housingLoanInterest),
        housingRent: round2(data.housingRent),
        elderlyCare: round2(data.elderlyCare),
      },
    },
    total: round2(taxPayable),
  };
}

export function calculateTax(input: CalculateTaxInput): CalculateTaxResult {
  if (input.country === "CN") return calculateChinaTax(input);
  return calculateAustraliaTax(input);
}