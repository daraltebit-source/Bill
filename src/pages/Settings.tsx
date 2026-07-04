import React, { useState } from "react";
import { 
  Bell, 
  Smartphone, 
  Mail, 
  Clock, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  Trash2,
  Type,
  Zap
} from "lucide-react";
import { cn } from "../lib/utils";
import { translations, Language } from "../translations";
import { GoogleSheetsSync } from "../components/GoogleSheetsSync";
import { GoogleCalendarSync } from "../components/GoogleCalendarSync";
import { Bill } from "../types";
import { DevicePermissionsCenter } from "../components/DevicePermissionsCenter";
import { motion } from "motion/react";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 14 } }
};

interface SettingsPageProps {
  language: Language;
  bills: Bill[];
  onBillsImported: (imported: Bill[]) => void;
  autoSync: boolean;
  onAutoSyncToggle: (val: boolean) => void;
  autoCalendarSync: boolean;
  onAutoCalendarSyncToggle: (val: boolean) => void;
  onSuccessMessage: (msg: string) => void;
  fontSize: "small" | "medium" | "large" | "xlarge";
  onFontSizeChange: (size: "small" | "medium" | "large" | "xlarge") => void;
  fpsMode: "60" | "120";
  onFpsModeChange: (mode: "60" | "120") => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ 
  language,
  bills,
  onBillsImported,
  autoSync,
  onAutoSyncToggle,
  autoCalendarSync,
  onAutoCalendarSyncToggle,
  onSuccessMessage,
  fontSize,
  onFontSizeChange,
  fpsMode,
  onFpsModeChange
}) => {
  const t = translations[language];
  const [notifications, setNotifications] = useState({
    push: true,
    email: true,
    weeklyReports: true,
    reminders: true,
    marketing: false
  });

  const [reminderDays, setReminderDays] = useState("3");
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const handleToggle = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API save
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1000);
  };

  const handleFactoryReset = () => {
    // Clear all related keys in localStorage
    localStorage.removeItem("billmanager_bills");
    localStorage.removeItem("google_user_logged_in");
    localStorage.removeItem("linked_google_sheet");
    localStorage.removeItem("linked_google_calendar");
    localStorage.removeItem("google_sheets_auto_sync");
    localStorage.removeItem("google_calendar_auto_sync");
    localStorage.removeItem("billmatrix_notified_alerts");
    localStorage.setItem("billmanager_data_cleared_v1", "true");
    
    // Clear state of bills
    onBillsImported([]);
    
    // Turn off sync state toggles
    onAutoSyncToggle(false);
    onAutoCalendarSyncToggle(false);
    
    // Notify success
    onSuccessMessage(t.factory_reset_success);
    setShowConfirmReset(false);
  };

  return (
    <motion.main 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-4xl mx-auto px-4 py-8 pb-32"
    >
      <motion.div variants={itemVariants} className="mb-10 text-start">
        <h2 className="font-headline text-[32px] font-bold text-on-surface tracking-tight mb-2">{t.preferences}</h2>
        <p className="text-on-surface-variant leading-relaxed opacity-80">{t.preferences_desc}</p>
      </motion.div>

      <div className="space-y-6">
        {/* Notification Channels */}
        <motion.section variants={itemVariants} className="space-y-4">
          <h3 className="font-mono text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <Bell size={14} />
            {t.alert_channels}
          </h3>
          
          <div className="grid grid-cols-1 gap-3">
            {[
              { id: 'push', label: t.push_notifications, desc: t.push_desc, icon: Smartphone },
              { id: 'email', label: t.email_summaries, desc: t.email_summaries_desc, icon: Mail },
              { id: 'weeklyReports', label: t.email_notifications, desc: t.email_notifications_desc, icon: Bell },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => handleToggle(item.id as keyof typeof notifications)}
                className={cn(
                  "flex items-center justify-between p-5 rounded-2xl border transition-all truncate group text-left",
                  notifications[item.id as keyof typeof notifications]
                    ? "border-primary bg-primary/5" 
                    : "border-outline bg-surface-container-low hover:border-outline-variant",
                  language === "AR" && "text-right"
                )}
              >
                <div className={cn("flex items-center gap-4", language === "AR" && "flex-row-reverse")}>
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center transition-colors shadow-sm",
                    notifications[item.id as keyof typeof notifications] ? "bg-primary/20 text-primary" : "bg-surface-container-high text-on-surface-variant"
                  )}>
                    <item.icon size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-on-surface text-sm">{item.label}</p>
                    <p className="text-[12px] text-on-surface-variant opacity-70">{item.desc}</p>
                  </div>
                </div>
                <div className={cn(
                  "w-12 h-6 rounded-full relative transition-colors shrink-0",
                  notifications[item.id as keyof typeof notifications] ? "bg-primary" : "bg-surface-container-high"
                )}>
                  <div className={cn(
                    "absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-md",
                    notifications[item.id as keyof typeof notifications] ? "left-7" : "left-1"
                  )} />
                </div>
              </button>
            ))}
          </div>
        </motion.section>

        {/* Reminder Logic */}
        <motion.section variants={itemVariants} className="space-y-4 pt-4">
          <h3 className="font-mono text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <Clock size={14} />
            {t.automation_logic}
          </h3>
          
          <div className="bg-surface-container-low border border-outline rounded-2xl p-6 space-y-6">
            <div className={cn("flex items-center justify-between gap-4", language === "AR" && "flex-row-reverse")}>
              <div className={cn(language === "AR" && "text-right")}>
                <p className="font-bold text-on-surface text-sm">{t.preemptive_reminders}</p>
                <p className="text-[12px] text-on-surface-variant opacity-70 mt-1">{t.reminders_desc}</p>
              </div>
              <div className="flex items-center gap-2 bg-surface-container-high px-3 py-1.5 rounded-lg border border-outline-variant">
                <input 
                  type="number" 
                  value={reminderDays}
                  onChange={(e) => setReminderDays(e.target.value)}
                  className="w-10 bg-transparent text-center font-bold text-primary text-sm outline-none"
                />
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{t.days}</span>
              </div>
            </div>

            <div className="h-px bg-outline-variant w-full" />

            <div className={cn("flex items-center justify-between", language === "AR" && "flex-row-reverse")}>
              <div className={cn(language === "AR" && "text-right")}>
                <p className="font-bold text-on-surface text-sm">{t.security_hardening}</p>
                <p className="text-[12px] text-on-surface-variant opacity-70 mt-1">{t.security_hardening_desc}</p>
              </div>
              <button
                onClick={() => handleToggle('marketing')}
                className={cn(
                  "w-12 h-6 rounded-full relative transition-colors shrink-0",
                  notifications.marketing ? "bg-primary" : "bg-surface-container-high"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-md",
                  notifications.marketing ? "left-7" : "left-1"
                )} />
              </button>
            </div>
          </div>
        </motion.section>

        {/* Interface Sizing & Dynamic Engine */}
        <motion.section variants={itemVariants} className="space-y-4 pt-4">
          <h3 className="font-mono text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <Zap size={14} className="text-primary animate-pulse" />
            {language === "AR" ? "التحكم بالنظام والأداء" : "System Engine & UI Scale"}
          </h3>

          <div className="bg-surface-container-low border border-outline rounded-2xl p-6 space-y-6">
            {/* Font Size Selector */}
            <div className={cn("flex flex-col gap-4", language === "AR" && "items-end")}>
              <div className={cn("flex items-center gap-2", language === "AR" && "flex-row-reverse")}>
                <Type size={16} className="text-primary animate-bounce" />
                <p className="font-bold text-on-surface text-sm">
                  {language === "AR" ? "حجم خط البرنامج" : "Global Font Sizing"}
                </p>
              </div>
              <p className={cn("text-[11px] text-on-surface-variant opacity-75 leading-relaxed -mt-2", language === "AR" && "text-right")}>
                {language === "AR" 
                  ? "قم بتكبير أو تصغير واجهة البرنامج بأكملها لتسهيل القراءة وتخصيص تجربة الاستخدام."
                  : "Increase or decrease the entire application typography dynamically to optimize reading comfort."}
              </p>

              <div className="grid grid-cols-4 gap-2 w-full mt-2">
                {[
                  { id: "small", label: language === "AR" ? "صغير" : "Small", sizeText: "text-xs" },
                  { id: "medium", label: language === "AR" ? "متوسط" : "Medium", sizeText: "text-sm" },
                  { id: "large", label: language === "AR" ? "كبير" : "Large", sizeText: "text-base" },
                  { id: "xlarge", label: language === "AR" ? "كبير جداً" : "X-Large", sizeText: "text-lg" },
                ].map((item) => (
                  <motion.button
                    type="button"
                    key={item.id}
                    onClick={() => onFontSizeChange(item.id as any)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className={cn(
                      "py-3 px-1 rounded-xl font-bold border transition-all text-center flex flex-col justify-center items-center gap-1 cursor-pointer transform-gpu will-change-transform",
                      fontSize === item.id 
                        ? "border-primary bg-primary/10 text-primary shadow-sm" 
                        : "border-outline bg-surface-container-high text-on-surface-variant hover:border-outline-variant hover:text-on-surface"
                    )}
                  >
                    <span className={cn("font-bold", item.sizeText)}>{item.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="h-px bg-outline-variant w-full" />

            {/* Performance Mode Switcher */}
            <div className={cn("flex items-center justify-between gap-4", language === "AR" && "flex-row-reverse")}>
              <div className={cn("space-y-1", language === "AR" && "text-right")}>
                <div className={cn("flex items-center gap-2", language === "AR" && "flex-row-reverse")}>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <p className="font-bold text-on-surface text-sm">
                    {language === "AR" ? "معدل الإطارات الفائق (120 إطار)" : "120 FPS High-Refresh Render"}
                  </p>
                </div>
                <p className="text-[12px] text-on-surface-variant opacity-70 mt-1">
                  {language === "AR" 
                    ? "يقوم بتشغيل معالجة الرسوم بـ 120 إطار بالثانية لتوفير تجربة تنقل فائقة النعومة على الشاشات المدعومة."
                    : "Unlocks hyper-smooth 120 FPS frame rate utilizing advanced hardware acceleration and optimized physics springs."}
                </p>
                {fpsMode === "120" && (
                  <span className="inline-block mt-1 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 font-mono text-[9px] font-bold uppercase tracking-wider border border-emerald-500/20">
                    ⚡ {language === "AR" ? "نشط الآن بمعدل 120Hz" : "Realtime GPU Acceleration 120Hz Active"}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => onFpsModeChange(fpsMode === "120" ? "60" : "120")}
                className={cn(
                  "w-12 h-6 rounded-full relative transition-colors shrink-0 cursor-pointer",
                  fpsMode === "120" ? "bg-primary" : "bg-surface-container-high"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-md",
                  fpsMode === "120" ? "left-7" : "left-1"
                )} />
              </button>
            </div>
          </div>
        </motion.section>

        {/* Google Sheets Sync Section */}
        <motion.section variants={itemVariants} className="space-y-4 pt-4">
          <GoogleSheetsSync
            language={language}
            bills={bills}
            onBillsImported={onBillsImported}
            autoSync={autoSync}
            onAutoSyncToggle={onAutoSyncToggle}
            onSuccessMessage={onSuccessMessage}
          />
        </motion.section>

        {/* Google Calendar Sync Section */}
        <motion.section variants={itemVariants} className="space-y-4 pt-4">
          <GoogleCalendarSync
            language={language}
            bills={bills}
            autoCalendarSync={autoCalendarSync}
            onAutoCalendarSyncToggle={onAutoCalendarSyncToggle}
            onSuccessMessage={onSuccessMessage}
          />
        </motion.section>

        {/* Device Permissions & Local Storage Management */}
        <motion.section variants={itemVariants} className="space-y-4 pt-4 border-t border-outline-variant/30">
          <DevicePermissionsCenter
            language={language}
            bills={bills}
            onBillsImported={onBillsImported}
            onSuccessMessage={onSuccessMessage}
          />
        </motion.section>

        {/* Factory Reset Section */}
        <motion.section variants={itemVariants} className="space-y-4 pt-4 border-t border-outline-variant/30">
          <h3 className="font-mono text-[10px] font-bold text-red-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
            <AlertCircle size={14} className="text-red-500" />
            {t.factory_reset_title}
          </h3>
          <div className="bg-surface-container-low border border-red-500/20 rounded-3xl p-6 space-y-4">
            <p className={cn("text-[12px] text-on-surface-variant opacity-75 leading-relaxed", language === "AR" && "text-right")}>
              {t.factory_reset_desc}
            </p>
            
            {showConfirmReset ? (
              <div className="bg-red-500/5 border border-red-500/30 rounded-2xl p-4 space-y-3 animate-in fade-in zoom-in-95 duration-200">
                <p className={cn("text-xs font-bold text-red-400 font-sans", language === "AR" && "text-right")}>
                  {t.factory_reset_confirm}
                </p>
                <div className={cn("flex items-center gap-3 justify-end", language === "AR" && "justify-start")}>
                  <button
                    onClick={() => setShowConfirmReset(false)}
                    className="px-4 py-2.5 rounded-xl border border-outline text-[11px] font-black uppercase tracking-wider font-sans text-on-surface hover:bg-surface-container-high transition-all active:scale-95"
                  >
                    {language === "AR" ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    onClick={handleFactoryReset}
                    className="px-4 py-2.5 rounded-xl bg-red-600 text-white text-[11px] font-black uppercase tracking-wider font-sans hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-600/20"
                  >
                    {language === "AR" ? "مسح وإعادة ضبط" : "Yes, Erase & Reset"}
                  </button>
                </div>
              </div>
            ) : (
              <div className={cn("flex justify-end", language === "AR" && "justify-start")}>
                <button
                  onClick={() => setShowConfirmReset(true)}
                  className="px-5 py-3 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/30 font-headline text-xs font-black uppercase tracking-wider transition-all active:scale-[0.98] flex items-center gap-2"
                >
                  <Trash2 size={14} />
                  {t.factory_reset_btn}
                </button>
              </div>
            )}
          </div>
        </motion.section>

        {/* Actions */}
        <motion.div variants={itemVariants} className="pt-8">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              "w-full py-5 px-6 rounded-2xl font-headline text-lg font-bold shadow-xl transition-all flex items-center justify-center gap-3 group border border-white/10",
              isSaving ? "bg-primary/50 cursor-wait" : "bg-primary text-on-primary hover:brightness-110 active:scale-[0.98] shadow-primary/20"
            )}
          >
            {isSaving ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save size={20} className="group-hover:scale-110 transition-transform" />
                {t.sync_changes}
              </>
            )}
          </button>
        </motion.div>
      </div>

      {/* Success Success Success */}
      {showSuccess && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 bg-tertiary text-on-tertiary px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 size={20} />
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider">{t.preferences_sync}</span>
        </div>
      )}
    </motion.main>
  );
};
