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
    <aside className="hidden lg:flex w-64 bg-surface-container-low border-r border-outline flex-col p-6 sticky top-0 h-screen overflow-y-auto">
      <div className="flex items-center gap-2 mb-12 text-primary">
        <LayoutDashboard size={24} />
        <h1 className="font-headline text-xl font-bold tracking-tight text-on-surface">BillManager</h1>
      </div>
      
      <nav className="flex-1 space-y-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn("sidebar-nav-item w-full", isActive && "active")}
            >
              <Icon size={18} />
              <span className="font-medium">{language === "AR" ? tab.labelAr : tab.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-6">
        <div className="bg-surface-container-high p-4 rounded-xl border border-outline-variant">
          <div className="text-[12px] text-on-surface-variant font-medium">{language === "AR" ? "حالة الحساب" : "Account Status"}</div>
          <div className="text-sm mt-1 font-bold">{language === "AR" ? "حساب قياسي" : "Standard Account"}</div>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 rounded-full bg-tertiary" />
            <span className="text-[11px] text-on-surface-variant font-mono uppercase tracking-widest font-bold">{language === "AR" ? "واجهة موثقة" : "Verified Interface"}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export const TopAppBar: React.FC<NavigationProps> = ({ activeTab, onTabChange, language, onLanguageToggle }) => {
  return (
    <header className="lg:hidden bg-surface-container-low border-b border-outline flex justify-between items-center w-full px-4 h-16 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <button className="text-on-surface-variant p-2 hover:bg-surface-container-high transition-colors rounded-full">
          <Menu size={24} />
        </button>
        <h1 className="font-headline text-xl font-bold text-on-surface tracking-tight">BillManager</h1>
      </div>
      <div className="flex items-center gap-3">
        <button 
          onClick={onLanguageToggle}
          className="text-on-surface-variant font-mono text-sm hover:underline"
        >
          {language === "EN" ? "EN | AR" : "عربى | EN"}
        </button>
        <button 
          onClick={() => onTabChange("settings")}
          className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center transition-all bg-surface-container-high border border-outline hover:border-primary/50",
            activeTab === "settings" && "text-primary border-primary bg-primary/10"
          )}
        >
          <Settings size={20} className={cn(activeTab === "settings" && "animate-spin-slow")} />
        </button>
        <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center overflow-hidden border border-outline">
          <img 
            alt="User Profile" 
            className="w-full h-full object-cover" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDDkHooZXEI6s6Ij_rwIoWBjYqMezpO2mz7Z_s2juBfle1XDKcbwW_aaOAMHVlyJu11I2B9AvGFW0lxZO6jyGxMdaS4lOTKuC1MljrS8saTiDM38RBnc0frJHNxhoQbyrb1CbgpFtYp2I3WxZgZDb5UnGV3jm-6SoePu7_MT0VkNXJk9Zrx6imdkc5ugYCEIvp1APIaq0MFM4DEYrLxykFNCqPjVdVihnH9mA5Rsd_v0yYSzopD_Ml754GslLfqvlyXpBGDWphtU9o" 
          />
        </div>
      </div>
    </header>
  );
};

export const BottomNavBar: React.FC<NavigationProps> = ({ activeTab, onTabChange, language }) => {
  const tabs = [
    { id: "dashboard", label: "Dashboard", labelAr: "لوحة التحكم", icon: LayoutDashboard },
    { id: "bills", label: "Bills", labelAr: "الفواتير", icon: ReceiptText },
    { id: "add", label: "Add", labelAr: "إضافة", icon: PlusCircle },
    { id: "reports", label: "Stats", labelAr: "تقارير", icon: BarChart3 },
    { id: "settings", label: "Set", labelAr: "الإعدادات", icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex lg:hidden justify-around items-center px-4 py-3 bg-surface-container-low border-t border-outline shadow-lg ring-1 ring-white/5">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex flex-col items-center gap-1 min-w-[64px] transition-all",
              isActive 
                ? "text-primary scale-110" 
                : "text-on-surface-variant/60 hover:text-on-surface-variant"
            )}
          >
            <Icon size={20} className={cn(isActive && "stroke-[2.5px]")} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">{language === "AR" ? tab.labelAr : tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
