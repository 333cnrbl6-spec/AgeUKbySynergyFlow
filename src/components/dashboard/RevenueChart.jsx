import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function RevenueChart({ jobs }) {
  const monthlyData = React.useMemo(() => {
    const months = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString("en-GB", { month: "short" });
      months[key] = { month: key, revenue: 0, jobs: 0 };
    }
    
    (jobs || []).forEach((job) => {
      if (job.total_cost && job.payment_status === "paid") {
        const d = new Date(job.created_date);
        const key = d.toLocaleString("en-GB", { month: "short" });
        if (months[key]) {
          months[key].revenue += job.total_cost;
          months[key].jobs += 1;
        }
      }
    });
    
    return Object.values(months);
  }, [jobs]);

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={monthlyData} barSize={32}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis 
            dataKey="month" 
            axisLine={false} 
            tickLine={false}
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false}
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            tickFormatter={(v) => `£${v}`}
          />
          <Tooltip 
            formatter={(value) => [`£${value.toFixed(2)}`, "Revenue"]}
            contentStyle={{ 
              borderRadius: "8px", 
              border: "1px solid hsl(var(--border))",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
            }}
          />
          <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}