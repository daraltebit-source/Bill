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
    <main className="px-4 pt-6 space-y-6 max-w-2xl mx-auto pb-32">
      {/* Total Due Card */}
      <section className="bg-[#11151C] border border-outline p-8 rounded-2xl relative overflow-hidden ring-1 ring-white/5">
        <div className="relative z-10">
          <p className="font-mono text-[11px] text-on-surface-variant uppercase tracking-[0.2em] mb-4">{t.wealth_overview}</p>
          <div className="flex items-baseline gap-3">
            <span className="font-headline text-[44px] font-bold tracking-tight text-on-surface">{totalDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            <span className="font-headline text-lg font-medium text-on-surface/60">{t.egp}</span>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-tertiary bg-tertiary/10 px-3 py-1 rounded-full text-[12px] font-bold border border-tertiary/10">
              <TrendingUp size={14} />
              <span>+ {t.egp} 4,200.00 (3.4%)</span>
            </div>
            <span className="text-[12px] text-on-surface-variant font-mono">{t.market_up}</span>
          </div>
        </div>
        {/* Glow effect */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-[100px]" />
      </section>

      {/* Stats Chart */}
      <StatsChart data={monthlyExpenses} />

      {/* Stats Cards Grid - Sleek Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card flex items-center justify-between">
           <div>
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mb-1">{t.liquidity}</p>
              <p className="text-xl font-bold">84,200.00 <span className="text-xs text-on-surface-variant font-medium">{t.egp}</span></p>
           </div>
           <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary border border-white/5">
              <CreditCard size={20} />
           </div>
        </div>
        <div className="card flex items-center justify-between">
           <div>
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mb-1">{t.active_accounts}</p>
              <p className="text-xl font-bold">14 {language === "AR" ? "نشط" : "Active"} <span className="text-xs text-on-surface-variant font-medium">{t.active_lines}</span></p>
           </div>
           <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-tertiary border border-white/5">
              <TrendingUp size={20} />
           </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 gap-4">
        <button className="bg-surface-container-low hover:bg-primary/10 transition-all p-5 rounded-2xl flex flex-col items-center gap-3 border border-outline group">
          <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary transition-colors text-primary group-hover:text-white border border-primary/20">
            <QrCode size={22} />
          </div>
          <span className="font-mono text-[11px] text-on-surface font-bold uppercase tracking-widest">{t.scan_receipt}</span>
        </button>
        <button className="bg-surface-container-low hover:bg-primary/10 transition-all p-5 rounded-2xl flex flex-col items-center gap-3 border border-outline group">
          <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary transition-colors text-primary group-hover:text-white border border-primary/20">
            <History size={22} />
          </div>
          <span className="font-mono text-[11px] text-on-surface font-bold uppercase tracking-widest">{t.view_ledger}</span>
        </button>
      </div>

      {/* Upcoming Bills Section */}
      <section className="space-y-5">
        <div className="flex items-center justify-between px-2">
          <h2 className="font-headline text-lg text-on-surface font-bold tracking-tight">{t.recent_obligations}</h2>
          <button className="text-primary font-mono text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5 hover:underline">
            {t.all_records} <ChevronRight size={14} className={cn(language === "AR" && "rotate-180")} />
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

      {/* Export Buttons */}
      <div className="flex gap-4 pt-6">
        <button className="flex-1 flex items-center justify-center gap-3 bg-primary text-on-primary py-4 rounded-xl font-headline font-bold shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all">
          <FileText size={18} />
          {t.add_obligation}
        </button>
        <button className="flex-1 flex items-center justify-center gap-3 border border-outline py-4 rounded-xl font-headline font-bold text-on-surface-variant hover:bg-surface-container-low transition-all">
          <Download size={18} />
          {t.export_ledger}
        </button>
      </div>

      {/* Floating Action - Sleek style */}
      <button className="lg:hidden fixed bottom-28 right-6 w-14 h-14 bg-primary text-on-primary rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-50 ring-2 ring-white/10">
        <Plus size={32} />
      </button>
    </main>
  );
};
