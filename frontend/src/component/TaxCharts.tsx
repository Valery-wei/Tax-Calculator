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
    grossIncome: number;
    deductionsTotal: number;
    taxableIncome: number;
    tax: number;
    medicareLevy: number;
    total: number;
  };
  
  export default function TaxCharts(props: Props) {
    const net = Math.max(0, props.grossIncome - props.total);
  
    const pieData = [
      { name: "Income tax", value: props.tax },
      { name: "Medicare levy", value: props.medicareLevy },
      { name: "Take-home", value: net },
    ];
  
    const barData = [
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
          <div className="text-sm font-semibold">Tax breakdown</div>
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
          <div className="mt-2 text-xs text-gray-500">Shares are based on gross income.</div>
        </div>
  
        <div className="rounded-2xl bg-white p-5 shadow">
          <div className="text-sm font-semibold">Income flow</div>
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
          <div className="mt-2 text-xs text-gray-500">Gross → Deductions → Taxable → Tax → Net.</div>
        </div>
      </div>
    );
  }
  