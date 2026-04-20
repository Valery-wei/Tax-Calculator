import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
  } from "recharts";
  
  type Props = {
  country?: "AU" | "CN";
    grossIncome: number;
    deductionsTotal: number;
    taxableIncome: number;
    tax: number;
    medicareLevy: number;
    total: number;
  };
  
  export default function TaxCharts(props: Props) {
    const net = Math.max(0, props.grossIncome - props.total);
  const isCn = props.country === "CN";
  
  const pieData = isCn
    ? [
        { name: "应纳税额 Tax payable", value: props.tax },
        { name: "到手收入 Net income", value: net },
      ]
    : [
        { name: "Income tax", value: props.tax },
        { name: "Medicare levy", value: props.medicareLevy },
        { name: "Take-home", value: net },
      ];
  
  const barData = isCn
    ? [
        { name: "总收入 Gross", value: props.grossIncome },
        { name: "扣除 Deductions", value: props.deductionsTotal },
        { name: "应纳税所得额 Taxable", value: props.taxableIncome },
        { name: "应纳税额 Tax payable", value: props.total },
        { name: "到手收入 Net", value: net },
      ]
    : [
        { name: "Gross", value: props.grossIncome },
        { name: "Deductions", value: props.deductionsTotal },
        { name: "Taxable", value: props.taxableIncome },
        { name: "Total tax", value: props.total },
        { name: "Net", value: net },
      ];
  
    const COLORS = ["#6B7B8C", "#B7A99A", "#A3B18A", "#C9A3A4", "#8E8DAA"];

  
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow">
          <div className="text-sm font-semibold">
            {isCn ? "税务构成 Tax breakdown" : "Tax breakdown"}
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {isCn ? "占比按总收入计算。Shares are based on gross income." : "Shares are based on gross income."}
          </div>
        </div>
  
        <div className="rounded-2xl bg-white p-5 shadow">
          <div className="text-sm font-semibold">{isCn ? "收入流向 Income flow" : "Income flow"}</div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {barData.map((_, i) => (
                            <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {isCn
              ? "总收入 → 扣除 → 应纳税所得额 → 应纳税额 → 到手收入。"
              : "Gross → Deductions → Taxable → Tax → Net."}
          </div>
        </div>
      </div>
    );
  }
  