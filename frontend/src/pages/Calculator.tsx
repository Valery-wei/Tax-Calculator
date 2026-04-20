import { useMemo, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch, clearToken } from "../api/client";
import TaxCharts from "../component/TaxCharts";

type Deduction = { type: string; amount: number };
type CountryCode = "AU" | "CN";

type IncomeMode = "annual" | "hourly";

type FormValues = {
  country: CountryCode;
  taxYear: string;
  incomeYear: number;
  incomeMode: IncomeMode;

  // annual mode
  annualIncome: number;

  // hourly mode
  hourlyRate: number;
  hoursPerWeek: number;
  weeksPerYear: number;

  deductions: Deduction[];

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

type CalcRespAU = {
  recordId: string;
  country: "AU";
  currency: "AUD";
  taxableIncome: number;
  tax: number;
  medicareLevy: number;
  total: number;
};

type CalcRespCN = {
  recordId: string;
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
    items: {
      infantCare: number;
      childrenEducation: number;
      continuingEducation: number;
      seriousIllnessMedical: number;
      housingLoanInterest: number;
      housingRent: number;
      elderlyCare: number;
    };
  };
  total: number;
};

type CalcResp = CalcRespAU | CalcRespCN;

export default function Calculator() {
  const nav = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [result, setResult] = useState<CalcResp | null>(null);
  const [lastGrossIncome, setLastGrossIncome] = useState<number>(0);
  const [lastDeductionsTotal, setLastDeductionsTotal] = useState<number>(0);

  const defaultValues = useMemo<FormValues>(
    () => ({
      country: "AU",
      taxYear: "2025-2026",
      incomeYear: 2025,
      incomeMode: "annual",
      annualIncome: 0,
      hourlyRate: 40,
      hoursPerWeek: 38,
      weeksPerYear: 52,
      deductions: [{ type: "donation", amount: 0 }],
      annualGrossIncome: 0,
      specialDeductions: 0,
      otherDeductions: 0,
      infantCare: 0,
      childrenEducation: 0,
      continuingEducation: 0,
      seriousIllnessMedical: 0,
      housingLoanInterest: 0,
      housingRent: 0,
      elderlyCare: 0,
    }),
    []
  );

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues,
  });

  const incomeMode = watch("incomeMode");
  const country = watch("country");

  const { fields, append, remove } = useFieldArray({
    control,
    name: "deductions",
  });

  const computeGrossIncome = (v: FormValues) => {
    if (v.incomeMode === "annual") return Number(v.annualIncome || 0);
    return Number(v.hourlyRate || 0) * Number(v.hoursPerWeek || 0) * Number(v.weeksPerYear || 0);
  };

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    setResult(null);

    const grossIncome =
      values.country === "CN" ? Number(values.annualGrossIncome || 0) : computeGrossIncome(values);
    const deductionsTotal =
      values.country === "CN"
        ? Number(values.specialDeductions || 0) +
          Number(values.otherDeductions || 0) +
          Number(values.infantCare || 0) +
          Number(values.childrenEducation || 0) +
          Number(values.continuingEducation || 0) +
          Number(values.seriousIllnessMedical || 0) +
          Number(values.housingLoanInterest || 0) +
          Number(values.housingRent || 0) +
          Number(values.elderlyCare || 0)
        : (values.deductions ?? []).reduce((s, d) => s + Number(d.amount || 0), 0);

    try {
      const payload =
        values.country === "CN"
          ? {
              country: "CN" as const,
              incomeYear: Number(values.incomeYear || 0),
              data: {
                annualGrossIncome: Number(values.annualGrossIncome || 0),
                specialDeductions: Number(values.specialDeductions || 0),
                otherDeductions: Number(values.otherDeductions || 0),
                infantCare: Number(values.infantCare || 0),
                childrenEducation: Number(values.childrenEducation || 0),
                continuingEducation: Number(values.continuingEducation || 0),
                seriousIllnessMedical: Number(values.seriousIllnessMedical || 0),
                housingLoanInterest: Number(values.housingLoanInterest || 0),
                housingRent: Number(values.housingRent || 0),
                elderlyCare: Number(values.elderlyCare || 0),
              },
            }
          : {
              country: "AU" as const,
              taxYear: values.taxYear,
              income: grossIncome,
              deductions: values.deductions.map((d) => ({
                type: d.type,
                amount: Number(d.amount || 0),
              })),
            };

      const data = await apiFetch("/api/tax/calculate", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setLastGrossIncome(grossIncome);
      setLastDeductionsTotal(deductionsTotal);
      setResult(data as CalcResp);
    } catch (e: any) {
      if ((e.message ?? "").toLowerCase().includes("token")) {
        clearToken();
        nav("/login");
        return;
      }
      setServerError(e.message ?? (values.country === "CN" ? "计算失败 / Calculate failed" : "Calculate failed"));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl p-4 sm:p-6">
        {/* Responsive header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-semibold">Tax Calculator</h1>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link className="underline" to="/history">
              History
            </Link>
            <button
              className="underline"
              onClick={() => {
                clearToken();
                nav("/login");
              }}
            >
              Logout
            </button>
          </div>
        </div>

        <form className="mt-6 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-2xl bg-white p-4 sm:p-6 shadow space-y-5">
            {/* Top row */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Country</label>
                <select
                  className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring"
                  {...register("country")}
                >
                  <option value="AU">AU - Australia</option>
                  <option value="CN">CN - China 中国</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {country === "CN" ? "Income year / 收入年度" : "Tax year"}
                </label>
                <input
                  type={country === "CN" ? "number" : "text"}
                  className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring"
                  {...(country === "CN"
                    ? register("incomeYear", { valueAsNumber: true, min: 1900, max: 3000 })
                    : register("taxYear", { required: true }))}
                />
                {country === "CN" ? (
                  errors.incomeYear && (
                    <p className="mt-1 text-sm text-red-600">Income year / 收入年度 must be valid</p>
                  )
                ) : (
                  errors.taxYear && <p className="mt-1 text-sm text-red-600">Tax year required</p>
                )}
              </div>

              {country === "AU" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Income mode</label>
                  <div className="mt-1 flex rounded-lg border p-1">
                    <button
                      type="button"
                      className={`flex-1 rounded-md px-3 py-2 text-sm ${
                        incomeMode === "annual" ? "bg-black text-white" : "text-gray-700"
                      }`}
                      onClick={() => {
                        (document.getElementById("mode-annual") as HTMLInputElement | null)?.click();
                      }}
                    >
                      Annual
                    </button>
                    <button
                      type="button"
                      className={`flex-1 rounded-md px-3 py-2 text-sm ${
                        incomeMode === "hourly" ? "bg-black text-white" : "text-gray-700"
                      }`}
                      onClick={() => {
                        (document.getElementById("mode-hourly") as HTMLInputElement | null)?.click();
                      }}
                    >
                      Hourly
                    </button>
                  </div>

                  <div className="hidden">
                    <label>
                      <input id="mode-annual" type="radio" value="annual" {...register("incomeMode")} />
                      annual
                    </label>
                    <label>
                      <input id="mode-hourly" type="radio" value="hourly" {...register("incomeMode")} />
                      hourly
                    </label>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Annual gross income / 年度税前收入 (CNY)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring"
                    {...register("annualGrossIncome", { valueAsNumber: true })}
                  />
                </div>
              )}
            </div>

            {country === "AU" ? (
              <>
                {/* Income inputs */}
                {incomeMode === "annual" ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Annual income</label>
                    <input
                      type="number"
                      step="0.01"
                      className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring"
                      {...register("annualIncome", { valueAsNumber: true })}
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Hourly</label>
                      <input
                        type="number"
                        step="0.01"
                        className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring"
                        {...register("hourlyRate", { valueAsNumber: true })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Hours/wk</label>
                      <input
                        type="number"
                        step="0.1"
                        className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring"
                        {...register("hoursPerWeek", { valueAsNumber: true })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Weeks/yr</label>
                      <input
                        type="number"
                        step="1"
                        className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring"
                        {...register("weeksPerYear", { valueAsNumber: true })}
                      />
                    </div>
                  </div>
                )}

                {/* Deductions */}
                <div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-sm font-semibold">Deductions</h2>
                    <button
                      type="button"
                      className="rounded-lg border px-3 py-1 text-sm"
                      onClick={() => append({ type: "", amount: 0 })}
                    >
                      + Add
                    </button>
                  </div>

                  <div className="mt-3 space-y-3">
                    {fields.map((f, idx) => (
                      <div key={f.id} className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                        <div className="sm:col-span-7">
                          <input
                            className="w-full rounded-lg border px-3 py-2 outline-none focus:ring"
                            placeholder="type (e.g. donation)"
                            {...register(`deductions.${idx}.type` as const, { required: true })}
                          />
                          {errors.deductions?.[idx]?.type && (
                            <p className="mt-1 text-sm text-red-600">Type required</p>
                          )}
                        </div>

                        <div className="sm:col-span-4">
                          <input
                            type="number"
                            step="0.01"
                            className="w-full rounded-lg border px-3 py-2 outline-none focus:ring"
                            placeholder="amount"
                            {...register(`deductions.${idx}.amount` as const, {
                              valueAsNumber: true,
                              min: 0,
                            })}
                          />
                          {errors.deductions?.[idx]?.amount && (
                            <p className="mt-1 text-sm text-red-600">Amount must be ≥ 0</p>
                          )}
                        </div>

                        <div className="sm:col-span-1 flex sm:justify-end">
                          <button type="button" className="text-sm underline" onClick={() => remove(idx)}>
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div>
                <h2 className="text-sm font-semibold">China deductions / 中国扣除项 (CNY)</h2>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Special deductions / 专项扣除
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring"
                      {...register("specialDeductions", { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Other deductions / 其他扣除</label>
                    <input
                      type="number"
                      step="0.01"
                      className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring"
                      {...register("otherDeductions", { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Infant care / 3岁以下婴幼儿照护</label>
                    <input
                      type="number"
                      step="0.01"
                      className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring"
                      {...register("infantCare", { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Children education / 子女教育
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring"
                      {...register("childrenEducation", { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Continuing education / 继续教育
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring"
                      {...register("continuingEducation", { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Serious illness medical / 大病医疗
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring"
                      {...register("seriousIllnessMedical", { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Housing loan interest / 住房贷款利息
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring"
                      {...register("housingLoanInterest", { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Housing rent / 住房租金</label>
                    <input
                      type="number"
                      step="0.01"
                      className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring"
                      {...register("housingRent", { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Elderly care / 赡养老人</label>
                    <input
                      type="number"
                      step="0.01"
                      className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring"
                      {...register("elderlyCare", { valueAsNumber: true })}
                    />
                  </div>
                </div>
              </div>
            )}

            {serverError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {serverError}
              </div>
            )}

            <button
              disabled={isSubmitting}
              className="w-full rounded-lg bg-black px-4 py-2 text-white disabled:opacity-60"
            >
              {country === "CN"
                ? isSubmitting
                  ? "计算中... / Calculating..."
                  : "计算并保存 / Calculate & Save"
                : isSubmitting
                  ? "Calculating..."
                  : "Calculate & Save"}
            </button>
          </div>
        </form>

        {/* Result + charts */}
        {result && (
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl bg-white p-4 sm:p-6 shadow">
              <h2 className="text-sm font-semibold">{result.country === "CN" ? "结果 / Result" : "Result"}</h2>

              {result.country === "CN" ? (
                <>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
                    <div className="rounded-lg border p-3">
                      <div className="text-gray-500">Gross income / 税前收入 (CNY)</div>
                      <div className="text-lg font-semibold">{result.grossIncome}</div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-gray-500">Taxable income / 应纳税所得额 (CNY)</div>
                      <div className="text-lg font-semibold">{result.taxableIncome}</div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-gray-500">Tax payable / 应纳税额 (CNY)</div>
                      <div className="text-lg font-semibold">{result.taxPayable}</div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-gray-500">Net income / 税后收入 (CNY)</div>
                      <div className="text-lg font-semibold">{result.netIncome}</div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-gray-500">Applied tax rate / 适用税率</div>
                      <div className="text-lg font-semibold">{(result.appliedTaxRate * 100).toFixed(0)}%</div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-gray-500">Quick deduction / 速算扣除数 (CNY)</div>
                      <div className="text-lg font-semibold">{result.quickDeduction}</div>
                    </div>
                  </div>

                  <div className="mt-3 rounded-lg border p-3 text-sm">
                    <div className="font-medium">Deduction breakdown / 扣除明细 (CNY)</div>
                    <div className="mt-2 text-gray-500">
                      Standard 基础减除: {result.deductionBreakdown.standardDeduction} | Special 专项扣除:{" "}
                      {result.deductionBreakdown.specialDeductions} | Special additional 专项附加扣除:{" "}
                      {result.deductionBreakdown.specialAdditionalDeductions} | Other 其他扣除:{" "}
                      {result.deductionBreakdown.otherDeductions}
                    </div>
                    <div className="mt-2 text-gray-500">
                      Infant care 婴幼儿照护: {result.deductionBreakdown.items.infantCare} | Children
                      education 子女教育: {result.deductionBreakdown.items.childrenEducation} | Continuing
                      education 继续教育: {result.deductionBreakdown.items.continuingEducation} | Serious
                      illness medical 大病医疗: {result.deductionBreakdown.items.seriousIllnessMedical}
                    </div>
                    <div className="mt-1 text-gray-500">
                      Housing loan interest 住房贷款利息: {result.deductionBreakdown.items.housingLoanInterest}
                      | Housing rent 住房租金: {result.deductionBreakdown.items.housingRent} | Elderly care
                      赡养老人:{" "}
                      {result.deductionBreakdown.items.elderlyCare}
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-gray-500">
                    本计算器当前仅对中国居民工资薪金所得提供估算结果，仅供参考。This calculator currently
                    provides an estimate for Chinese resident salary income only and is for reference
                    purposes.
                  </div>
                </>
              ) : (
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
                  <div className="rounded-lg border p-3">
                    <div className="text-gray-500">Taxable income</div>
                    <div className="text-lg font-semibold">{result.taxableIncome}</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-gray-500">Income tax</div>
                    <div className="text-lg font-semibold">{result.tax}</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-gray-500">Medicare levy</div>
                    <div className="text-lg font-semibold">{result.medicareLevy}</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-gray-500">Total</div>
                    <div className="text-lg font-semibold">{result.total}</div>
                  </div>
                </div>
              )}

              <div className="mt-3 text-xs text-gray-500">Saved record id: {result.recordId}</div>
            </div>

            <TaxCharts
              country={result.country}
              grossIncome={lastGrossIncome}
              deductionsTotal={lastDeductionsTotal}
              taxableIncome={result.taxableIncome}
              tax={result.country === "CN" ? result.taxPayable : result.tax}
              medicareLevy={result.country === "CN" ? 0 : result.medicareLevy}
              total={result.total}
            />
          </div>
        )}
      </div>
    </div>
  );
}
