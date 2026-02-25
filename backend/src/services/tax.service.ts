export type Deduction = {
  type: string;
  amount: number;
};

export type CalculateTaxInput = {
  taxYear: string;
  income: number;
  deductions: Deduction[];
};

export type CalculateTaxResult = {
  taxableIncome: number;
  tax: number;
  medicareLevy: number;
  total: number;
};

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

export function calculateTax(input: CalculateTaxInput): CalculateTaxResult {
    const taxabDeductions = input.deductions.reduce((s, d) => s + d.amount, 0);
    const taxableIncome = Math.max(0, input.income - taxabDeductions);
    const tax = calxResidentIncomeTax(taxableIncome);
    const medicareLevy = taxableIncome * 0.02;
    const total = tax + medicareLevy;
    return { taxableIncome: round2(taxableIncome), tax: round2(tax), medicareLevy: round2(medicareLevy), total: round2(total) };
}