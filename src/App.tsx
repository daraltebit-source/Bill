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
import { useEffect } from "react";
import { getAccessToken, initAuth } from "./lib/googleAuth";
import { exportBillsToSheet } from "./lib/googleSheets";
import { syncBillsToCalendar } from "./lib/googleCalendar";
import { CheckCircle2 } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [language, setLanguage] = useState<"EN" | "AR">("EN");
  const [bills, setBills] = useState<Bill[]>(() => {
    const saved = localStorage.getItem("billmanager_bills");
    return saved ? JSON.parse(saved) : initialMockBills;
  });

  const [autoSync, setAutoSync] = useState(() => {
    return localStorage.getItem("google_sheets_auto_sync") === "true";
  });

  const [autoCalendarSync, setAutoCalendarSync] = useState(() => {
    return localStorage.getItem("google_calendar_auto_sync") === "true";
  });

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const toggleLanguage = () => setLanguage(prev => prev === "EN" ? "AR" : "EN");

  // Persist bills locally
  useEffect(() => {
    localStorage.setItem("billmanager_bills", JSON.stringify(bills));
  }, [bills]);

  // Persist autoSync preference
  useEffect(() => {
    localStorage.setItem("google_sheets_auto_sync", autoSync ? "true" : "false");
  }, [autoSync]);

  // Persist autoCalendarSync preference
  useEffect(() => {
    localStorage.setItem("google_calendar_auto_sync", autoCalendarSync ? "true" : "false");
  }, [autoCalendarSync]);

  // Initialize Firebase Auth listener on startup
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        console.log("Active Google Session restored for:", user.email);
      },
      () => {
        console.log("No active Google Session in memory");
      }
    );
    return () => unsubscribe();
  }, []);

  // Automatic Background Cloud Sync
  useEffect(() => {
    const triggerAutoSync = async () => {
      if (!autoSync) return;
      const savedSheet = localStorage.getItem("linked_google_sheet");
      if (!savedSheet) return;

      try {
        const sheet = JSON.parse(savedSheet);
        const token = await getAccessToken();
        if (token && sheet.id) {
          console.log("Auto-syncing ledger to Google Sheets...");
          await exportBillsToSheet(token, sheet.id, bills);
        }
      } catch (error) {
        console.error("Auto-sync failed:", error);
      }
    };

    triggerAutoSync();
  }, [bills, autoSync]);

  // Automatic Background Calendar Sync
  useEffect(() => {
    const triggerCalendarSync = async () => {
      if (!autoCalendarSync) return;
      const savedCalendar = localStorage.getItem("linked_google_calendar");
      if (!savedCalendar) return;

      try {
        const calendar = JSON.parse(savedCalendar);
        const token = await getAccessToken();
        if (token && calendar.id) {
          console.log("Auto-syncing bill deadlines to Google Calendar...");
          await syncBillsToCalendar(token, calendar.id, bills, language);
        }
      } catch (error) {
        console.error("Calendar auto-sync failed:", error);
      }
    };

    triggerCalendarSync();
  }, [bills, autoCalendarSync, language]);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard": return <Dashboard bills={bills} language={language} />;
      case "bills": return <Bills bills={bills} setBills={setBills} language={language} />;
      case "add": return <AddLine language={language} onBack={() => setActiveTab("dashboard")} onAdd={(newBill) => setBills(prev => [newBill, ...prev])} />;
      case "reports": return <Reports bills={bills} language={language} />;
      case "settings": return (
        <SettingsPage 
          language={language} 
          bills={bills}
          onBillsImported={setBills}
          autoSync={autoSync}
          onAutoSyncToggle={setAutoSync}
          autoCalendarSync={autoCalendarSync}
          onAutoCalendarSyncToggle={setAutoCalendarSync}
          onSuccessMessage={showToast}
        />
      );
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

        {successMessage && (
          <div className="fixed bottom-24 right-6 z-50 bg-primary text-on-primary px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 border border-white/10">
            <CheckCircle2 size={18} />
            <span className="font-sans font-bold text-xs tracking-wide">{successMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}

