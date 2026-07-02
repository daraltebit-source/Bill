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
    <div className="w-full h-[400px] p-8 pt-4">
      <div className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-primary rounded-full" />
          <div className="flex flex-col">
             <h3 className="technical-label !text-primary/60 !opacity-100">Expenditure Delta Analysis</h3>
             <span className="text-[10px] text-on-surface-variant/40 font-mono font-black uppercase tracking-widest leading-none">Side-by-side node comparison</span>
          </div>
        </div>
        <div className="flex gap-8 bg-surface-container-high/20 px-5 py-2.5 rounded-2xl border border-white/5">
           <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-md bg-primary shadow-[0_0_15px_rgba(59,130,246,0.6)]" />
              <span className="text-[10px] font-black text-on-surface uppercase tracking-widest font-mono">Current</span>
           </div>
           <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-md bg-[#2DD4BF] shadow-[0_0_15px_rgba(45,212,191,0.6)]" />
              <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest font-mono">Previous</span>
           </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="80%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
          barGap={12}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#ffffff08" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "#94A3B8", fontSize: 10, fontWeight: "900", fontFamily: "monospace" }}
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "#94A3B8", fontSize: 10, fontWeight: "900", fontFamily: "monospace" }}
          />
          <Tooltip 
            cursor={{ fill: "rgba(255,255,255,0.02)" }}
            contentStyle={{ 
              backgroundColor: "rgba(17, 21, 28, 0.9)", 
              backdropFilter: "blur(12px)",
              border: "2px solid rgba(255,255,255,0.05)", 
              borderRadius: "20px",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
              padding: "16px"
            }}
            itemStyle={{ fontSize: 13, fontWeight: "900", fontFamily: "monospace" }}
            labelStyle={{ fontSize: 10, fontWeight: "900", color: "#94A3B8", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.2em", fontFamily: "monospace" }}
          />
          <Bar 
            dataKey="current" 
            fill="#3B82F6" 
            radius={[6, 6, 0, 0]} 
            barSize={24}
          >
            <LabelList 
              dataKey="current" 
              position="top" 
              fill="#F8FAFC" 
              fontSize={10} 
              fontWeight="900" 
              fontFamily="monospace"
              offset={12}
            />
          </Bar>
          <Bar 
            dataKey="previous" 
            fill="#2DD4BF" 
            radius={[6, 6, 0, 0]}
            barSize={24}
          >
            <LabelList 
              dataKey="previous" 
              position="top" 
              fill="#94A3B8" 
              fontSize={10} 
              fontWeight="900" 
              fontFamily="monospace"
              offset={12}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
