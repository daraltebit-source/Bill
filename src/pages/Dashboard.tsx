import React from "react";
import { QrCode, History, ChevronRight, CreditCard, FileText, Download, Plus, Calendar, TrendingUp } from "lucide-react";
import { StatsChart } from "../components/StatsChart";
import { BillCard } from "../components/BillCard";
import { cn } from "../lib/utils";
import { BillDetailModal } from "../components/BillDetailModal";
import { monthlyExpenses } from "../mockData";
import { Bill } from "../types";
import { translations, Language } from "../translations";

export const Dashboard: React.FC<{ bills: Bill[]; language: Language }> = ({ bills, language }) => {
  const t = translations[language];
  const upcomingBills = bills.filter(b => b.status !== "Paid").slice(0, 3);
  const totalDue = upcomingBills.reduce((acc, curr) => acc + curr.amount, 0);
  const [selectedBill, setSelectedBill] = React.useState<Bill | null>(null);

  return (
    <main className="px-4 pt-8 space-y-8 max-w-2xl mx-auto pb-32">
      {/* Header with technical label */}
      <div className="flex flex-col gap-2 blueprint-header -mx-4 px-4">
        <div className="flex items-center justify-between">
          <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface">{t.dashboard}</h1>
          <div className="flex flex-col items-end">
            <span className="technical-label">{t.system_status || "System Status"}</span>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-tertiary uppercase">Operational</span>
            </div>
          </div>
        </div>
      </div>

      {/* Total Due Card - Refined */}
      <section className="bg-surface-container-high/40 backdrop-blur-xl border border-outline p-8 rounded-3xl relative overflow-hidden ring-1 ring-white/5 bill-card-shadow">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={14} className="text-primary" />
            <p className="technical-label !text-primary/80">{t.wealth_overview}</p>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="font-headline text-[52px] font-bold tracking-tight text-on-surface leading-none">
              {totalDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            <span className="font-headline text-xl font-medium text-on-surface/40">{t.egp}</span>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-tertiary bg-tertiary/10 px-3 py-1.5 rounded-lg text-[11px] font-bold border border-tertiary/20">
              <TrendingUp size={14} />
              <span>+ 3.4% {t.variance || "Variance"}</span>
            </div>
            <div className="h-10 w-px bg-outline-variant mx-1 hidden sm:block" />
            <div className="flex flex-col">
              <span className="technical-label">{t.last_updated || "Last Updated"}</span>
              <span className="text-[11px] font-mono text-on-surface/60 font-bold uppercase mt-0.5">22 APR 2026 12:43</span>
            </div>
          </div>
        </div>
        {/* Abstract shapes for tech vibe */}
        <div className="absolute -end-16 -top-16 w-64 h-64 bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute -start-16 -bottom-16 w-48 h-48 bg-tertiary/5 rounded-full blur-[80px]" />
      </section>

      {/* Stats Chart */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="technical-label">{t.expenditure_curve || "Expenditure Curve"}</h3>
          <span className="text-[10px] font-mono text-on-surface-variant font-bold">FY2026-Q2</span>
        </div>
        <StatsChart data={monthlyExpenses} />
      </section>

      {/* Stats Cards Grid - Sleek Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card flex items-center justify-between group cursor-default">
           <div className="space-y-1">
              <p className="technical-label">{t.liquidity}</p>
              <p className="text-2xl font-bold tracking-tight">84,200.00 <span className="text-xs text-on-surface-variant font-semibold">{t.egp}</span></p>
           </div>
           <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center text-primary border border-white/5 group-hover:scale-110 transition-transform shadow-inner">
              <CreditCard size={22} />
           </div>
        </div>
        <div className="card flex items-center justify-between group cursor-default">
           <div className="space-y-1">
              <p className="technical-label">{t.active_accounts}</p>
              <p className="text-2xl font-bold tracking-tight">14 {t.active} <span className="text-xs text-on-surface-variant font-semibold">{t.active_lines}</span></p>
           </div>
           <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center text-tertiary border border-white/5 group-hover:scale-110 transition-transform shadow-inner">
              <TrendingUp size={22} />
           </div>
        </div>
      </div>

      {/* Quick Actions Grid - More Graphic */}
      <div className="grid grid-cols-2 gap-4">
        <button className="bg-surface-container-low/40 hover:bg-primary/5 transition-all p-6 rounded-2xl flex flex-col items-center gap-4 border border-outline group shadow-sm">
          <div className="w-14 h-14 bg-surface-container-highest rounded-2xl flex items-center justify-center text-primary shadow-lg border border-white/5 group-hover:bg-primary group-hover:text-white transition-all duration-300">
            <QrCode size={26} />
          </div>
          <span className="technical-label !text-on-surface group-hover:text-primary transition-colors">{t.scan_receipt}</span>
        </button>
        <button className="bg-surface-container-low/40 hover:bg-tertiary/5 transition-all p-6 rounded-2xl flex flex-col items-center gap-4 border border-outline group shadow-sm">
          <div className="w-14 h-14 bg-surface-container-highest rounded-2xl flex items-center justify-center text-tertiary shadow-lg border border-white/5 group-hover:bg-tertiary group-hover:text-white transition-all duration-300">
            <History size={26} />
          </div>
          <span className="technical-label !text-on-surface group-hover:text-tertiary transition-colors">{t.view_ledger}</span>
        </button>
      </div>

      {/* Upcoming Bills Section */}
      <section className="space-y-6 pt-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex flex-col gap-0.5">
            <h2 className="font-headline text-xl text-on-surface font-bold tracking-tight">{t.recent_obligations}</h2>
            <p className="text-[10px] text-on-surface-variant font-mono uppercase tracking-widest opacity-60">Pending Settlement</p>
          </div>
          <button className="group text-primary font-mono text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-all">
            {t.all_records} 
            <ChevronRight size={14} className={cn("transition-transform group-hover:translate-x-1", language === "AR" && "rotate-180 group-hover:-translate-x-1")} />
          </button>
        </div>
        
        <div className="space-y-4">
          {upcomingBills.map(bill => (
            <BillCard key={bill.id} bill={bill} onViewDetails={setSelectedBill} language={language} />
          ))}
        </div>
      </section>

      <BillDetailModal 
        bill={selectedBill} 
        onClose={() => setSelectedBill(null)} 
        onUpdate={() => {}} 
        language={language}
      />

      {/* Export Buttons - More prominent */}
      <div className="flex flex-col sm:flex-row gap-4 pt-8">
        <button className="flex-1 flex items-center justify-center gap-3 bg-primary text-on-primary py-5 rounded-2xl font-headline font-bold text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all ring-offset-2 ring-offset-surface focus:ring-2 focus:ring-primary ring-0">
          <Plus size={22} strokeWidth={2.5} />
          {t.add_obligation}
        </button>
        <button className="flex-1 flex items-center justify-center gap-3 bg-surface-container-highest/60 border border-outline py-5 rounded-2xl font-headline font-bold text-on-surface hover:bg-surface-container-highest transition-all active:scale-[0.98]">
          <Download size={20} />
          {t.export_ledger}
        </button>
      </div>

      {/* Floating Action - Sleek style */}
      <button className="lg:hidden fixed bottom-28 end-6 w-14 h-14 bg-primary text-on-primary rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-50 ring-2 ring-white/10">
        <Plus size={32} />
      </button>
    </main>
  );
};
