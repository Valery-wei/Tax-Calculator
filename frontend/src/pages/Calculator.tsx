import { useMemo, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch, clearToken } from "../api/client";
import TaxCharts from "../component/TaxCharts";

type Deduction = { type: string; amount: number };

type IncomeMode = "annual" | "hourly";

type FormValues = {
  taxYear: string;
  incomeMode: IncomeMode;

  // annual mode
  annualIncome: number;

  // hourly mode
  hourlyRate: number;
  hoursPerWeek: number;
  weeksPerYear: number;

  deductions: Deduction[];
};

type CalcResp = {
  recordId: string;
  taxableIncome: number;
  tax: number;
  medicareLevy: number;
  total: number;
};

export default function Calculator() {
  const nav = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [result, setResult] = useState<CalcResp | null>(null);
  const [lastGrossIncome, setLastGrossIncome] = useState<number>(0);
  const [lastDeductionsTotal, setLastDeductionsTotal] = useState<number>(0);

  const defaultValues = useMemo<FormValues>(
    () => ({
      taxYear: "2025-2026",
      incomeMode: "annual",
      annualIncome: 0,
      hourlyRate: 40,
      hoursPerWeek: 38,
      weeksPerYear: 52,
      deductions: [{ type: "donation", amount: 0 }],
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

    const grossIncome = computeGrossIncome(values);
    const deductionsTotal = (values.deductions ?? []).reduce((s, d) => s + Number(d.amount || 0), 0);

    try {
      const payload = {
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
      setResult(data);
    } catch (e: any) {
      if ((e.message ?? "").toLowerCase().includes("token")) {
        clearToken();
        nav("/login");
        return;
      }
      setServerError(e.message ?? "Calculate failed");
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
                <label className="block text-sm font-medium text-gray-700">Tax year</label>
                <input
                  className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring"
                  {...register("taxYear", { required: true })}
                />
                {errors.taxYear && <p className="mt-1 text-sm text-red-600">Tax year required</p>}
              </div>

              {/* Income mode toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Income mode</label>
                <div className="mt-1 flex rounded-lg border p-1">
                  <button
                    type="button"
                    className={`flex-1 rounded-md px-3 py-2 text-sm ${
                      incomeMode === "annual" ? "bg-black text-white" : "text-gray-700"
                    }`}
                    onClick={() => {
                      // setValue without importing: we use register + hidden? simplest is just use a normal select
                      // But toggle feels nicer: we can rely on HTML by clicking a hidden radio
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

                {/* real values stored via radios */}
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
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:col-span-1">
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
            </div>

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
                        {...register(`deductions.${idx}.amount` as const, { valueAsNumber: true, min: 0 })}
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

            {serverError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {serverError}
              </div>
            )}

            <button
              disabled={isSubmitting}
              className="w-full rounded-lg bg-black px-4 py-2 text-white disabled:opacity-60"
            >
              {isSubmitting ? "Calculating..." : "Calculate & Save"}
            </button>
          </div>
        </form>

        {/* Result + charts */}
        {result && (
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl bg-white p-4 sm:p-6 shadow">
              <h2 className="text-sm font-semibold">Result</h2>

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

              <div className="mt-3 text-xs text-gray-500">Saved record id: {result.recordId}</div>
            </div>

            <TaxCharts
              grossIncome={lastGrossIncome}
              deductionsTotal={lastDeductionsTotal}
              taxableIncome={result.taxableIncome}
              tax={result.tax}
              medicareLevy={result.medicareLevy}
              total={result.total}
            />
          </div>
        )}
      </div>
    </div>
  );
}
