import React, { useState } from "react";
import { 
  Bell, 
  Smartphone, 
  Mail, 
  Clock, 
  Save, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import { cn } from "../lib/utils";
import { translations, Language } from "../translations";

export const SettingsPage: React.FC<{ language: Language }> = ({ language }) => {
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

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 pb-32">
      <div className="mb-10 text-start">
        <h2 className="font-headline text-[32px] font-bold text-on-surface tracking-tight mb-2">{t.preferences}</h2>
        <p className="text-on-surface-variant leading-relaxed opacity-80">{t.preferences_desc}</p>
      </div>

      <div className="space-y-6">
        {/* Notification Channels */}
        <section className="space-y-4">
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
                    : "border-outline bg-[#11151C] hover:border-outline-variant",
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
        </section>

        {/* Reminder Logic */}
        <section className="space-y-4 pt-4">
          <h3 className="font-mono text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <Clock size={14} />
            {t.automation_logic}
          </h3>
          
          <div className="bg-[#11151C] border border-outline rounded-2xl p-6 space-y-6">
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
        </section>

        {/* Actions */}
        <div className="pt-8">
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
        </div>
      </div>

      {/* Success Success Success */}
      {showSuccess && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 bg-tertiary text-on-tertiary px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 size={20} />
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider">{t.preferences_sync}</span>
        </div>
      )}
    </main>
  );
};
