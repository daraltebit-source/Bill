import React from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  Legend,
  LabelList
} from "recharts";

const data = [
  { name: "Internet", current: 450, previous: 420 },
  { name: "Landline", current: 85, previous: 90 },
  { name: "Mobile", current: 980, previous: 920 },
  { name: "Water", current: 200, previous: 190 },
];

export const ComparisonChart: React.FC = () => {
  return (
    <div className="card w-full h-[400px] p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
           <h3 className="text-[12px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-1">Expenditure Comparison</h3>
           <p className="text-[10px] text-on-surface-variant/60 font-mono italic">Side-by-side delta analysis</p>
        </div>
        <div className="flex gap-6">
           <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-sm bg-primary shadow-[0_0_8px_rgba(99,102,241,0.4)]" />
              <span className="text-[10px] font-bold text-on-surface uppercase tracking-widest">Current</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-sm bg-[#2DD4BF] shadow-[0_0_8px_rgba(45,212,191,0.4)]" />
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Previous</span>
           </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="80%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
          barGap={12}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#ffffff05" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "#94A3B8", fontSize: 10, fontWeight: "bold" }}
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "#94A3B8", fontSize: 10, fontWeight: "bold" }}
          />
          <Tooltip 
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
            contentStyle={{ 
              backgroundColor: "#11151C", 
              border: "1px solid #ffffff10", 
              borderRadius: "12px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
            }}
            itemStyle={{ fontSize: 12, fontWeight: "bold", fontFamily: "monospace" }}
            labelStyle={{ fontSize: 10, color: "#94A3B8", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.1em" }}
          />
          <Bar 
            dataKey="current" 
            fill="#6366F1" 
            radius={[4, 4, 0, 0]} 
            barSize={20}
          >
            <LabelList 
              dataKey="current" 
              position="top" 
              fill="#F8FAFC" 
              fontSize={9} 
              fontWeight="bold" 
              fontFamily="monospace"
              offset={8}
            />
          </Bar>
          <Bar 
            dataKey="previous" 
            fill="#2DD4BF" 
            radius={[4, 4, 0, 0]}
            barSize={20}
          >
            <LabelList 
              dataKey="previous" 
              position="top" 
              fill="#94A3B8" 
              fontSize={9} 
              fontWeight="bold" 
              fontFamily="monospace"
              offset={8}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
