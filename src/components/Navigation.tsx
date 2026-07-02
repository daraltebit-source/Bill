import React from "react";
import { 
  LayoutDashboard, 
  ReceiptText, 
  PlusCircle, 
  BarChart3, 
  Menu, 
  Settings, 
  ChevronRight 
} from "lucide-react";
import { translations } from "../translations";
import { cn } from "@/src/lib/utils";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  language: "EN" | "AR";
  onLanguageToggle: () => void;
}

export const Sidebar: React.FC<NavigationProps> = ({ activeTab, onTabChange, language }) => {
  const tabs = [
    { id: "dashboard", label: "Dashboard", labelAr: "لوحة التحكم", icon: LayoutDashboard },
    { id: "bills", label: "Bills", labelAr: "الفواتير", icon: ReceiptText },
    { id: "add", label: "Add Line", labelAr: "إضافة خط", icon: PlusCircle },
    { id: "reports", label: "Reports", labelAr: "التقارير", icon: BarChart3 },
    { id: "settings", label: "Settings", labelAr: "الإعدادات", icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex w-72 bg-surface border-e border-outline flex-col p-8 sticky top-0 h-screen overflow-y-auto selection:bg-primary/30">
      <div className="flex items-center gap-3 mb-16 px-2">
        <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary shadow-sm">
          <ReceiptText size={22} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col">
          <h1 className="font-headline text-lg font-bold tracking-tighter text-on-surface leading-none uppercase italic">BillMatrix</h1>
          <span className="technical-label !text-primary/60 !opacity-100">Ledger Protocol</span>
        </div>
      </div>
      
      <nav className="flex-1 space-y-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-[13px] font-bold tracking-tight transition-all duration-300 border-2 border-transparent",
                isActive 
                  ? "bg-primary text-on-primary shadow-lg shadow-primary/20 border-white/10" 
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              )}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className={cn(isActive && "animate-pulse")} />
              <span className="uppercase tracking-widest text-[11px] font-mono">{language === "AR" ? tab.labelAr : tab.label}</span>
              {isActive && <ChevronRight size={14} className="ml-auto opacity-60" />}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-10">
        <div className="bg-surface-container-low/40 border border-outline/50 p-5 rounded-3xl bill-card-shadow relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-primary/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10">
            <div className="technical-label opacity-40 mb-2">{translations[language].account_status}</div>
            <div className="text-sm font-black tracking-tight text-on-surface uppercase italic flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
              {translations[language].standard_account}
            </div>
            <div className="mt-4 flex flex-col gap-1.5 border-t border-outline/30 pt-4">
              <div className="flex justify-between items-center text-[10px] font-mono font-bold uppercase text-on-surface-variant opacity-60">
                <span>Node ID</span>
                <span>#420-X9</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono font-bold uppercase text-on-surface-variant opacity-60">
                <span>Access</span>
                <span className="text-tertiary">{translations[language].verified_interface}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export const TopAppBar: React.FC<NavigationProps> = ({ activeTab, onTabChange, language, onLanguageToggle }) => {
  return (
    <header className="lg:hidden bg-surface/80 backdrop-blur-xl border-b border-outline flex justify-between items-center w-full px-4 h-18 sticky top-0 z-40 selection:bg-primary/30">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary">
          <ReceiptText size={22} strokeWidth={2.5} />
        </div>
        <h1 className="font-headline text-lg font-bold text-on-surface tracking-tighter uppercase italic">BillMatrix</h1>
      </div>
      <div className="flex items-center gap-3">
        <button 
          onClick={onLanguageToggle}
          className="text-primary font-mono text-[10px] font-black uppercase tracking-widest bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 hover:bg-primary/20 transition-all"
        >
          {language === "EN" ? "EN" : "AR"}
        </button>
        <button 
          onClick={() => onTabChange("settings")}
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-all bg-surface-container-high border border-outline hover:border-primary/50",
            activeTab === "settings" && "text-primary border-primary bg-primary/10"
          )}
        >
          <Settings size={20} className={cn(activeTab === "settings" && "animate-spin-slow")} />
        </button>
      </div>
    </header>
  );
};

export const BottomNavBar: React.FC<NavigationProps> = ({ activeTab, onTabChange, language }) => {
  const tabs = [
    { id: "dashboard", label: "Home", labelAr: "الرئيسية", icon: LayoutDashboard },
    { id: "bills", label: "Ledger", labelAr: "السجل", icon: ReceiptText },
    { id: "add", label: "Add", labelAr: "إضافة", icon: PlusCircle },
    { id: "reports", label: "Stats", labelAr: "تقارير", icon: BarChart3 },
    { id: "settings", label: "Admin", labelAr: "الإعدادات", icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex lg:hidden justify-around items-center px-4 py-4 bg-surface/80 backdrop-blur-2xl border-t border-outline shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)] ring-1 ring-white/5 pb-8">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex flex-col items-center gap-1.5 min-w-[64px] transition-all duration-300",
              isActive 
                ? "text-primary scale-110" 
                : "text-on-surface-variant/40 hover:text-on-surface-variant"
            )}
          >
            <div className={cn(
               "p-2 rounded-xl transition-all",
               isActive && "bg-primary/10 border border-primary/20 shadow-sm"
            )}>
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={cn(isActive && "animate-pulse")} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest font-mono">{language === "AR" ? tab.labelAr : tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
