/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { TopAppBar, BottomNavBar, Sidebar } from "./components/Navigation";
import { Dashboard } from "./pages/Dashboard";
import { Bills } from "./pages/Bills";
import { AddLine } from "./pages/AddLine";
import { Reports } from "./pages/Reports";
import { SettingsPage } from "./pages/Settings";
import { mockBills as initialMockBills, monthlyExpenses } from "./mockData";
import { Bill } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [language, setLanguage] = useState<"EN" | "AR">("EN");
  const [bills, setBills] = useState<Bill[]>(initialMockBills);

  const toggleLanguage = () => setLanguage(prev => prev === "EN" ? "AR" : "EN");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard": return <Dashboard bills={bills} language={language} />;
      case "bills": return <Bills bills={bills} setBills={setBills} language={language} />;
      case "add": return <AddLine language={language} onBack={() => setActiveTab("dashboard")} onAdd={(newBill) => setBills(prev => [newBill, ...prev])} />;
      case "reports": return <Reports bills={bills} language={language} />;
      case "settings": return <SettingsPage language={language} />;
      default: return <Dashboard bills={bills} language={language} />;
    }
  };

  const navProps = {
    activeTab,
    onTabChange: setActiveTab,
    language,
    onLanguageToggle: toggleLanguage
  };

  return (
    <div className="min-h-screen bg-surface flex transition-colors duration-300 overflow-hidden" dir={language === "AR" ? "rtl" : "ltr"}>
      {/* Sidebar for Desktop */}
      <Sidebar {...navProps} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden overflow-y-auto">
        <TopAppBar {...navProps} />
        
        <div className="flex-1 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="h-full"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        <BottomNavBar {...navProps} />
      </div>
    </div>
  );
}

