import React from "react";
import { motion } from "motion/react";
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

// 120 FPS Spring config
const springConfig = { type: "spring", stiffness: 450, damping: 28 };

export const Sidebar: React.FC<NavigationProps> = ({ activeTab, onTabChange, language, onLanguageToggle }) => {
  const tabs = [
    { id: "dashboard", label: "Dashboard", labelAr: "لوحة التحكم", icon: LayoutDashboard, hoverAnim: { scale: 1.15, rotate: -5, y: -2 } },
    { id: "bills", label: "Bills", labelAr: "الفواتير", icon: ReceiptText, hoverAnim: { scale: 1.15, y: -2, rotate: 5 } },
    { id: "add", label: "Add Line", labelAr: "إضافة خط", icon: PlusCircle, hoverAnim: { scale: 1.15, rotate: 90 } },
    { id: "reports", label: "Reports", labelAr: "التقارير", icon: BarChart3, hoverAnim: { scale: 1.15, y: -3, rotate: -5 } },
    { id: "settings", label: "Settings", labelAr: "الإعدادات", icon: Settings, hoverAnim: { scale: 1.15, rotate: 120 } },
  ];

  return (
    <aside className="hidden lg:flex w-72 bg-surface border-e border-outline flex-col p-8 sticky top-0 h-screen overflow-y-auto selection:bg-primary/30 transform-gpu">
      <div className="flex items-center gap-3 mb-16 px-2">
        <motion.div 
          whileHover={{ scale: 1.08, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
          transition={springConfig}
          className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary shadow-sm cursor-pointer transform-gpu will-change-transform"
        >
          <ReceiptText size={22} strokeWidth={2.5} />
        </motion.div>
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
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              whileHover={{ x: 6, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={springConfig}
              className={cn(
                "w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-[13px] font-bold tracking-tight relative overflow-hidden transition-all duration-300 border border-transparent transform-gpu will-change-transform cursor-pointer",
                isActive 
                  ? "text-on-primary font-bold" 
                  : "text-on-surface-variant hover:bg-surface-container-high/40 hover:text-on-surface"
              )}
            >
              {isActive && (
                <motion.div 
                  layoutId="sidebarActiveBg"
                  transition={springConfig}
                  className="absolute inset-0 bg-primary shadow-lg shadow-primary/25 rounded-2xl -z-10 border border-white/10"
                />
              )}
              
              <motion.div
                variants={{
                  hover: tab.hoverAnim,
                  initial: { scale: 1, rotate: 0, y: 0 }
                }}
                whileHover="hover"
                initial="initial"
                transition={springConfig}
                className="transform-gpu will-change-transform relative z-10"
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className={cn(isActive && "text-white animate-pulse")} />
              </motion.div>
              <span className="uppercase tracking-widest text-[11px] font-mono relative z-10">{language === "AR" ? tab.labelAr : tab.label}</span>
              {isActive && (
                <motion.div 
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={springConfig}
                  className="ml-auto relative z-10"
                >
                  <ChevronRight size={14} className="opacity-60 text-white" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </nav>

      <div className="mt-auto pt-10 space-y-4">
        {/* Sliding Language Selection Bar */}
        <div className="flex items-center justify-between p-1 bg-surface-container-high border border-outline/30 rounded-2xl relative">
          <button 
            onClick={() => language !== "EN" && onLanguageToggle()}
            className={cn(
              "flex-1 py-2 text-center text-[10px] font-mono font-black uppercase tracking-wider rounded-xl transition-all relative cursor-pointer z-10",
              language === "EN" ? "text-on-primary font-bold" : "text-on-surface-variant/60"
            )}
          >
            {language === "EN" && (
              <motion.div 
                layoutId="sidebarLangBg"
                className="absolute inset-0 bg-primary rounded-xl -z-10 shadow-sm"
                transition={springConfig}
              />
            )}
            English
          </button>
          <button 
            onClick={() => language !== "AR" && onLanguageToggle()}
            className={cn(
              "flex-1 py-2 text-center text-[10px] font-mono font-black uppercase tracking-wider rounded-xl transition-all relative cursor-pointer z-10",
              language === "AR" ? "text-on-primary font-bold" : "text-on-surface-variant/60"
            )}
          >
            {language === "AR" && (
              <motion.div 
                layoutId="sidebarLangBg"
                className="absolute inset-0 bg-primary rounded-xl -z-10 shadow-sm"
                transition={springConfig}
              />
            )}
            العربية
          </button>
        </div>

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
    <header className="lg:hidden bg-surface/80 backdrop-blur-xl border-b border-outline flex justify-between items-center w-full px-4 h-18 sticky top-0 z-40 selection:bg-primary/30 transform-gpu">
      <div className="flex items-center gap-4">
        <motion.div 
          whileHover={{ scale: 1.08, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
          transition={springConfig}
          className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary transform-gpu will-change-transform"
        >
          <ReceiptText size={22} strokeWidth={2.5} />
        </motion.div>
        <h1 className="font-headline text-lg font-bold text-on-surface tracking-tighter uppercase italic">BillMatrix</h1>
      </div>
      <div className="flex items-center gap-3">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={springConfig}
          onClick={onLanguageToggle}
          className="text-primary font-mono text-[10px] font-black uppercase tracking-widest bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 hover:bg-primary/20 transition-all transform-gpu will-change-transform"
        >
          {language === "EN" ? "EN" : "AR"}
        </motion.button>
        <motion.button 
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          transition={springConfig}
          onClick={() => onTabChange("settings")}
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-all bg-surface-container-high border border-outline hover:border-primary/50 transform-gpu will-change-transform",
            activeTab === "settings" && "text-primary border-primary bg-primary/10"
          )}
        >
          <motion.div
            animate={activeTab === "settings" ? { rotate: 360 } : { rotate: 0 }}
            whileHover={{ rotate: 90 }}
            transition={activeTab === "settings" ? { repeat: Infinity, duration: 6, ease: "linear" } : springConfig}
            className="transform-gpu will-change-transform"
          >
            <Settings size={20} />
          </motion.div>
        </motion.button>
      </div>
    </header>
  );
};

export const BottomNavBar: React.FC<NavigationProps> = ({ activeTab, onTabChange, language }) => {
  const tabs = [
    { id: "dashboard", label: "Home", labelAr: "الرئيسية", icon: LayoutDashboard, hoverAnim: { scale: 1.2, rotate: -5, y: -2 } },
    { id: "bills", label: "Ledger", labelAr: "السجل", icon: ReceiptText, hoverAnim: { scale: 1.2, y: -2, rotate: 5 } },
    { id: "add", label: "Add", labelAr: "إضافة", icon: PlusCircle, hoverAnim: { scale: 1.25, rotate: 90 } },
    { id: "reports", label: "Stats", labelAr: "تقارير", icon: BarChart3, hoverAnim: { scale: 1.2, y: -3, rotate: -5 } },
    { id: "settings", label: "Admin", labelAr: "الإعدادات", icon: Settings, hoverAnim: { scale: 1.2, rotate: 120 } },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex lg:hidden justify-around items-center px-4 py-4 bg-surface/80 backdrop-blur-2xl border-t border-outline shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)] ring-1 ring-white/5 pb-8 transform-gpu">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <motion.button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            whileTap={{ scale: 0.9 }}
            transition={springConfig}
            className={cn(
              "flex flex-col items-center gap-1.5 min-w-[64px] transition-all duration-300 transform-gpu will-change-transform cursor-pointer",
              isActive 
                ? "text-primary font-bold" 
                : "text-on-surface-variant/40 hover:text-on-surface-variant"
            )}
          >
            <motion.div 
              whileHover={{ scale: 1.12 }}
              transition={springConfig}
              className="p-2 rounded-xl relative transition-all transform-gpu"
            >
              {isActive && (
                <motion.div 
                  layoutId="bottomActiveBg"
                  transition={springConfig}
                  className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-xl -z-10"
                />
              )}
              <motion.div
                variants={{
                  hover: tab.hoverAnim,
                  initial: { scale: 1, rotate: 0, y: 0 }
                }}
                whileHover="hover"
                initial="initial"
                transition={springConfig}
                className="transform-gpu will-change-transform relative z-10"
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={cn(isActive && "animate-pulse")} />
              </motion.div>
            </motion.div>
            <span className="text-[9px] font-black uppercase tracking-widest font-mono">{language === "AR" ? tab.labelAr : tab.label}</span>
          </motion.button>
        );
      })}
    </nav>
  );
};
