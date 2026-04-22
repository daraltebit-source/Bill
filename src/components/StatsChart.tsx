import React from "react";
import { TrendingUp } from "lucide-react";
import { MonthlyExpense } from "../types";
import { cn } from "../lib/utils";

interface StatsChartProps {
  data: MonthlyExpense[];
}

export const StatsChart: React.FC<StatsChartProps> = ({ data }) => {
  const maxAmount = Math.max(...data.map(d => d.amount));
  const avgAmount = data.reduce((acc, curr) => acc + curr.amount, 0) / data.length;
  const currentMonth = data[data.length - 1];

  return (
    <section className="card">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-headline text-lg text-on-surface font-bold">Performance Index</h2>
          <p className="text-[12px] text-on-surface-variant mt-1">High: EGP {maxAmount.toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-2 text-primary font-mono text-[11px] font-bold bg-primary/10 px-3 py-1.5 rounded-full border border-white/5">
          <TrendingUp size={14} />
          <span>+2.4%</span>
        </div>
      </div>
      
      <div className="h-48 flex items-end justify-between gap-3 px-1">
        {data.map((item, index) => {
          const isLast = index === data.length - 1;
          const height = (item.amount / maxAmount) * 100;
          
          return (
            <div key={item.month} className="flex-1 flex flex-col items-center gap-3 group relative">
              <div className="w-full bg-outline-variant/10 rounded-t-xl relative h-32 overflow-hidden cursor-help border-x border-t border-transparent hover:border-outline-variant transition-all">
                <div 
                  className={cn(
                    "absolute bottom-0 w-full rounded-t-xl transition-all duration-1000 ease-in-out shadow-[0_-8px_20px_rgba(99,102,241,0.2)]",
                    isLast ? "bg-primary" : "bg-primary/40 group-hover:bg-primary/60"
                  )}
                  style={{ height: `${height}%` }}
                />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 flex flex-col items-center justify-center p-1">
                   <span className="bg-surface-container-highest text-on-surface text-[10px] font-bold px-2 py-1 rounded shadow-xl border border-white/10 text-center">
                    EGP {item.amount.toLocaleString()}
                   </span>
                </div>
              </div>
              <span className={cn(
                "font-mono text-[10px] font-bold tracking-widest",
                isLast ? "text-primary" : "text-on-surface-variant/70"
              )}>
                {item.month.toUpperCase()}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-8 pt-6 border-t border-outline-variant grid grid-cols-2 gap-8">
        <div className="flex flex-col gap-2">
          <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Average Monthly Spend</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-on-surface tracking-tight">{Math.round(avgAmount).toLocaleString()}</span>
            <span className="text-xs font-bold text-on-surface-variant">EGP</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 border-l border-outline-variant pl-8">
          <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Available Credit</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-tertiary tracking-tight">12,400</span>
            <span className="text-xs font-bold text-on-surface-variant">EGP</span>
          </div>
        </div>
      </div>
    </section>
  );
};
