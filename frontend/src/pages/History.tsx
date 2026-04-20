import { useEffect, useState } from "react";
import { apiFetch, clearToken } from "../api/client";
import { Link, useNavigate } from "react-router-dom";

type HistoryItem = {
  id: string;
  taxYear: string;
  income: number;
  createdAt: string;
  total: number;
  taxableIncome: number;
  country: "AU" | "CN";
  currency: "AUD" | "CNY";
};

export default function History() {
  const nav = useNavigate();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch("/api/history");
        setItems(data);
      } catch (e: any) {
        if ((e.message ?? "").toLowerCase().includes("token")) {
          clearToken();
          nav("/login");
          return;
        }
        setErr(e.message ?? "Failed to load history");
      }
    })();
  }, [nav]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">History</h1>
          <div className="flex gap-3 text-sm">
            <Link className="underline" to="/calculator">Calculator</Link>
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

        {err && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {err}
          </div>
        )}

        <div className="mt-6 space-y-3">
          {items.map((it) => (
            <div key={it.id} className="rounded-2xl bg-white p-5 shadow">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-gray-500">{new Date(it.createdAt).toLocaleString()}</div>
                  <div className="mt-1 font-semibold">
                    {it.country} {it.taxYear} — income {it.income} {it.currency}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Total</div>
                  <div className="text-lg font-semibold">
                    {it.total} {it.currency}
                  </div>
                </div>
              </div>

              <div className="mt-3 text-sm text-gray-600">
                Taxable income: <span className="font-medium">{it.taxableIncome}</span>
              </div>
              <div className="mt-2 text-xs text-gray-400 break-all">id: {it.id}</div>
            </div>
          ))}

          {items.length === 0 && !err && (
            <div className="rounded-2xl bg-white p-6 shadow text-sm text-gray-600">
              No records yet. Go to Calculator and create one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
