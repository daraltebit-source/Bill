import React, { useState, useEffect } from "react";
import { 
  Calendar as CalendarIcon, 
  RefreshCw, 
  LogOut, 
  CheckCircle, 
  AlertCircle, 
  ToggleLeft, 
  ToggleRight, 
  ExternalLink,
  PlusCircle,
  Clock
} from "lucide-react";
import { cn } from "../lib/utils";
import { translations, Language } from "../translations";
import { Bill } from "../types";
import { googleSignIn, logout, getAccessToken, initAuth } from "../lib/googleAuth";
import { 
  findBillCalendar, 
  createBillCalendar, 
  syncBillsToCalendar,
  GoogleCalendarMetadata 
} from "../lib/googleCalendar";

interface GoogleCalendarSyncProps {
  language: Language;
  bills: Bill[];
  autoCalendarSync: boolean;
  onAutoCalendarSyncToggle: (val: boolean) => void;
  onSuccessMessage: (msg: string) => void;
}

export const GoogleCalendarSync: React.FC<GoogleCalendarSyncProps> = ({
  language,
  bills,
  autoCalendarSync,
  onAutoCalendarSyncToggle,
  onSuccessMessage
}) => {
  const t = translations[language];
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [linkedCalendar, setLinkedCalendar] = useState<GoogleCalendarMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Sync to auth state changes and restore token
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, activeToken) => {
        setUser(currentUser);
        setToken(activeToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Read saved calendar metadata if any
  useEffect(() => {
    const savedCalendar = localStorage.getItem("linked_google_calendar");
    if (savedCalendar) {
      try {
        setLinkedCalendar(JSON.parse(savedCalendar));
      } catch (e) {
        console.error("Failed to parse saved calendar metadata", e);
      }
    }
  }, []);

  // Automatically search for a calendar when connected
  useEffect(() => {
    const checkCalendar = async () => {
      if (token && !linkedCalendar) {
        try {
          const found = await findBillCalendar(token);
          if (found) {
            setLinkedCalendar(found);
            localStorage.setItem("linked_google_calendar", JSON.stringify(found));
          }
        } catch (e) {
          console.error("Error auto-searching for calendar", e);
        }
      }
    };
    checkCalendar();
  }, [token, linkedCalendar]);

  const handleConnect = async () => {
    setIsLoading(true);
    setStatusMsg(null);
    try {
      const authResult = await googleSignIn();
      if (authResult) {
        setUser(authResult.user);
        setToken(authResult.accessToken);
        localStorage.setItem("google_user_logged_in", "true");
        
        const calendar = await findBillCalendar(authResult.accessToken);
        if (calendar) {
          setLinkedCalendar(calendar);
          localStorage.setItem("linked_google_calendar", JSON.stringify(calendar));
          setStatusMsg({
            type: 'success',
            text: language === "AR" 
              ? "تم الاتصال والعثور على تقويم BillMatrix!" 
              : "Connected and found active BillMatrix calendar!"
          });
        } else {
          setStatusMsg({
            type: 'success',
            text: language === "AR" 
              ? "تم الاتصال! يرجى إنشاء تقويم BillMatrix لجدولة المواعيد." 
              : "Connected! Please create a BillMatrix calendar to start scheduling."
          });
        }
      }
    } catch (error: any) {
      console.error(error);
      setStatusMsg({
        type: 'error',
        text: language === "AR" ? "فشل الاتصال بـ Google" : "Failed to connect with Google"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      await logout();
      setUser(null);
      setToken(null);
      setLinkedCalendar(null);
      localStorage.removeItem("google_user_logged_in");
      localStorage.removeItem("linked_google_calendar");
      setStatusMsg({
        type: 'success',
        text: language === "AR" ? "تم قطع الاتصال بنجاح" : "Disconnected successfully"
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCalendar = async () => {
    if (!token) return;
    setIsLoading(true);
    setStatusMsg(null);
    try {
      const newCal = await createBillCalendar(token);
      setLinkedCalendar(newCal);
      localStorage.setItem("linked_google_calendar", JSON.stringify(newCal));
      
      // Sync current bills
      const stats = await syncBillsToCalendar(token, newCal.id, bills, language);
      
      const successText = language === "AR"
        ? `تم إنشاء التقويم وجدولة ${stats.added} فواتير قادمة!`
        : `Created calendar and scheduled ${stats.added} upcoming bills!`;

      setStatusMsg({ type: 'success', text: successText });
      onSuccessMessage(language === "AR" ? "تم إنشاء التقويم ومزامنته!" : "Calendar created & synchronized!");
    } catch (error) {
      console.error(error);
      setStatusMsg({
        type: 'error',
        text: language === "AR" ? "فشل إنشاء تقويم جديد" : "Failed to create new calendar"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    if (!token || !linkedCalendar) return;
    setIsLoading(true);
    setStatusMsg(null);
    try {
      const stats = await syncBillsToCalendar(token, linkedCalendar.id, bills, language);
      
      const details = language === "AR"
        ? `تمت المزامنة: إضافة ${stats.added}، تحديث ${stats.updated}، إزالة ${stats.removed}`
        : `Sync complete: Added ${stats.added}, Updated ${stats.updated}, Cleaned ${stats.removed}`;

      setStatusMsg({ type: 'success', text: details });
      onSuccessMessage(language === "AR" ? "اكتملت مزامنة التقويم!" : "Calendar sync completed!");
    } catch (error) {
      console.error(error);
      setStatusMsg({
        type: 'error',
        text: language === "AR" ? "فشل مزامنة التقويم" : "Failed to sync calendar"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#11151C] border border-outline rounded-3xl p-6 shadow-xl relative overflow-hidden transition-all duration-300">
      {/* Decorative gradient flare */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-[#4285F4]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="text-lg font-bold text-on-surface flex items-center gap-2">
            <CalendarIcon className="text-[#4285F4] w-5 h-5 animate-pulse" />
            {t.google_calendar_sync}
          </h4>
          <p className="text-xs text-on-surface-variant opacity-70 mt-1">
            {t.google_calendar_desc}
          </p>
        </div>
        
        {user && (
          <span className="flex items-center gap-1.5 bg-[#4285F4]/10 border border-[#4285F4]/20 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold text-[#4285F4] uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4285F4] animate-ping" />
            {language === "AR" ? "نشط" : "Active"}
          </span>
        )}
      </div>

      {statusMsg && (
        <div className={cn(
          "mb-4 p-3.5 rounded-xl flex items-start gap-2.5 border text-xs animate-in fade-in slide-in-from-top-1",
          statusMsg.type === 'success' 
            ? "bg-green-500/10 border-green-500/20 text-green-400" 
            : "bg-red-500/10 border-red-500/20 text-red-400"
        )}>
          {statusMsg.type === 'success' ? <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {!user ? (
        <div className="pt-2">
          <button
            onClick={handleConnect}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-neutral-100 text-neutral-900 border border-neutral-300 rounded-2xl py-3.5 px-5 font-bold text-sm transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin text-neutral-900" />
            ) : (
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
            )}
            <span className="font-sans font-semibold">{t.connect_google}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-5 pt-2">
          {/* Linked Calendar info */}
          <div className="p-4 bg-surface-container-low/60 rounded-2xl border border-outline/30 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-on-surface-variant/60 uppercase tracking-widest flex items-center gap-1.5">
                <Clock size={12} />
                {t.calendar_connected}
              </span>
              
              {linkedCalendar && (
                <a 
                  href={`https://calendar.google.com/`} 
                  target="_blank" 
                  rel="noreferrer"
                  title="Open Calendar"
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  <ExternalLink size={14} />
                </a>
              )}
            </div>

            {linkedCalendar ? (
              <div className={cn("flex items-center gap-3 p-3 bg-[#4285F4]/5 rounded-xl border border-[#4285F4]/10", language === "AR" ? "flex-row-reverse text-right" : "text-left")}>
                <div className="w-9 h-9 bg-[#4285F4]/15 text-[#4285F4] rounded-lg flex items-center justify-center shrink-0">
                  <CalendarIcon size={18} />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-on-surface truncate">{linkedCalendar.summary}</p>
                  <p className="text-[9px] font-mono text-on-surface-variant/40 truncate select-all">{linkedCalendar.id}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-2 space-y-3">
                <p className="text-xs text-on-surface-variant opacity-75">
                  {t.calendar_not_found}
                </p>
                <button
                  onClick={handleCreateCalendar}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-primary hover:bg-primary/95 text-on-primary font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98]"
                >
                  <PlusCircle size={14} />
                  {t.create_calendar}
                </button>
              </div>
            )}

            {/* Manual Sync Trigger */}
            {linkedCalendar && (
              <div className="pt-2">
                <button
                  onClick={handleSync}
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-[#161B22] hover:bg-[#21262D] border border-outline/30 text-on-surface font-semibold text-xs rounded-xl flex items-center justify-center gap-2.5 transition-all active:scale-[0.97]"
                >
                  <RefreshCw size={14} className={cn("text-[#4285F4]", isLoading && "animate-spin")} />
                  {t.sync_to_calendar}
                </button>
              </div>
            )}
          </div>

          {/* Auto-sync configuration */}
          {linkedCalendar && (
            <div className={cn("flex items-center justify-between p-3 bg-surface-container-high/20 rounded-xl border border-outline/20", language === "AR" ? "flex-row-reverse" : "")}>
              <div className={cn(language === "AR" ? "text-right" : "text-left")}>
                <p className="text-xs font-bold text-on-surface">{t.auto_sync}</p>
                <p className="text-[10px] text-on-surface-variant/60">
                  {language === "AR" ? "مزامنة التقويم تلقائياً عند أي تعديل" : "Keep Calendar schedules updated with any local modifications"}
                </p>
              </div>
              
              <button
                onClick={() => onAutoCalendarSyncToggle(!autoCalendarSync)}
                className="text-primary hover:scale-105 transition-all"
              >
                {autoCalendarSync ? (
                  <ToggleRight size={32} className="text-primary" />
                ) : (
                  <ToggleLeft size={32} className="text-on-surface-variant/30" />
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
