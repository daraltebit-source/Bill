import React, { useState, useEffect } from "react";
import { 
  Cloud, 
  CloudRain, 
  Database, 
  RefreshCw, 
  FileSpreadsheet, 
  LogOut, 
  CheckCircle, 
  AlertCircle, 
  ToggleLeft, 
  ToggleRight, 
  Download, 
  Upload,
  ExternalLink
} from "lucide-react";
import { cn } from "../lib/utils";
import { translations, Language } from "../translations";
import { Bill } from "../types";
import { googleSignIn, logout, getAccessToken } from "../lib/googleAuth";
import { 
  findLedgerSpreadsheet, 
  createLedgerSpreadsheet, 
  importBillsFromSheet, 
  exportBillsToSheet,
  GoogleSheetMetadata 
} from "../lib/googleSheets";

interface GoogleSheetsSyncProps {
  language: Language;
  bills: Bill[];
  onBillsImported: (imported: Bill[]) => void;
  autoSync: boolean;
  onAutoSyncToggle: (val: boolean) => void;
  onSuccessMessage: (msg: string) => void;
}

export const GoogleSheetsSync: React.FC<GoogleSheetsSyncProps> = ({
  language,
  bills,
  onBillsImported,
  autoSync,
  onAutoSyncToggle,
  onSuccessMessage
}) => {
  const t = translations[language];
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [linkedSheet, setLinkedSheet] = useState<GoogleSheetMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [syncDirection, setSyncDirection] = useState<"import" | "export" | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Read saved sheet metadata if any
  useEffect(() => {
    const savedSheet = localStorage.getItem("linked_google_sheet");
    if (savedSheet) {
      try {
        setLinkedSheet(JSON.parse(savedSheet));
      } catch (e) {
        console.error("Failed to parse saved sheet metadata", e);
      }
    }
    
    // We can't auto-restore the token from localStorage (security guideline), 
    // but we can look for whether a user was previously logged in
    const wasLoggedIn = localStorage.getItem("google_user_logged_in") === "true";
    if (wasLoggedIn) {
      // Just set a prompt or we can let them click reconnect
    }
  }, []);

  const handleConnect = async () => {
    setIsLoading(true);
    setStatusMsg(null);
    try {
      const authResult = await googleSignIn();
      if (authResult) {
        setUser(authResult.user);
        setToken(authResult.accessToken);
        localStorage.setItem("google_user_logged_in", "true");
        
        // Search if spreadsheet already exists on Drive
        const sheet = await findLedgerSpreadsheet(authResult.accessToken);
        if (sheet) {
          setLinkedSheet(sheet);
          localStorage.setItem("linked_google_sheet", JSON.stringify(sheet));
          setStatusMsg({
            type: 'success',
            text: language === "AR" ? "تم الاتصال والعثور على ملف السجل الحالي!" : "Connected and found existing Ledger file!"
          });
        } else {
          setStatusMsg({
            type: 'success',
            text: language === "AR" ? "تم الاتصال! يرجى إنشاء ملف السجل لبدء المزامنة." : "Connected! Please create a Ledger file to start syncing."
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
      setLinkedSheet(null);
      localStorage.removeItem("google_user_logged_in");
      localStorage.removeItem("linked_google_sheet");
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

  const handleCreateSheet = async () => {
    if (!token) return;
    setIsLoading(true);
    setStatusMsg(null);
    try {
      const newSheet = await createLedgerSpreadsheet(token);
      setLinkedSheet(newSheet);
      localStorage.setItem("linked_google_sheet", JSON.stringify(newSheet));
      
      // Export current local bills to this new sheet
      await exportBillsToSheet(token, newSheet.id, bills);
      
      setStatusMsg({
        type: 'success',
        text: language === "AR" ? "تم إنشاء 'BillMatrix Ledger' ومزامنة فواتيرك بنجاح!" : "Created 'BillMatrix Ledger' and exported your bills successfully!"
      });
      onSuccessMessage(language === "AR" ? "تم إنشاء وتصدير الفواتير بنجاح!" : "Spreadsheet created and exported successfully!");
    } catch (error) {
      console.error(error);
      setStatusMsg({
        type: 'error',
        text: language === "AR" ? "فشل إنشاء جدول البيانات" : "Failed to create spreadsheet"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    if (!token || !linkedSheet) return;
    setIsLoading(true);
    setSyncDirection("export");
    setStatusMsg(null);
    try {
      await exportBillsToSheet(token, linkedSheet.id, bills);
      setStatusMsg({
        type: 'success',
        text: language === "AR" ? "تم تصدير الفواتير بنجاح إلى Google Sheets!" : "Bills successfully exported to Google Sheets!"
      });
      onSuccessMessage(language === "AR" ? "تم التصدير بنجاح!" : "Exported successfully!");
    } catch (error) {
      console.error(error);
      setStatusMsg({
        type: 'error',
        text: language === "AR" ? "فشل تصدير البيانات" : "Failed to export data"
      });
    } finally {
      setIsLoading(false);
      setSyncDirection(null);
    }
  };

  const handleImport = async () => {
    if (!token || !linkedSheet) return;
    
    const confirmImport = window.confirm(
      language === "AR" 
        ? "هل أنت متأكد أنك تريد الاستيراد من Google Sheets؟ سيؤدي هذا إلى الكتابة فوق فواتيرك المحلية." 
        : "Are you sure you want to import from Google Sheets? This will overwrite your current local bills."
    );
    if (!confirmImport) return;

    setIsLoading(true);
    setSyncDirection("import");
    setStatusMsg(null);
    try {
      const importedBills = await importBillsFromSheet(token, linkedSheet.id);
      onBillsImported(importedBills);
      setStatusMsg({
        type: 'success',
        text: language === "AR" ? `تم استيراد ${importedBills.length} فاتورة بنجاح!` : `Successfully imported ${importedBills.length} bills!`
      });
      onSuccessMessage(language === "AR" ? "تم الاستيراد بنجاح!" : "Imported successfully!");
    } catch (error) {
      console.error(error);
      setStatusMsg({
        type: 'error',
        text: language === "AR" ? "فشل استيراد البيانات" : "Failed to import data"
      });
    } finally {
      setIsLoading(false);
      setSyncDirection(null);
    }
  };

  return (
    <div className="bg-[#11151C] border border-outline rounded-3xl p-6 shadow-xl relative overflow-hidden transition-all duration-300">
      {/* Decorative cloud sync grid */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="text-lg font-bold text-on-surface flex items-center gap-2">
            <Cloud className="text-primary w-5 h-5 animate-pulse" />
            {t.google_sheets_sync}
          </h4>
          <p className="text-xs text-on-surface-variant opacity-70 mt-1">
            {t.google_sheets_desc}
          </p>
        </div>
        
        {user && (
          <span className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold text-green-400 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping" />
            {language === "AR" ? "متصل" : "Connected"}
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
          {/* User Profile display */}
          <div className={cn("flex items-center justify-between p-3.5 bg-surface-container-high/40 rounded-2xl border border-outline/30", language === "AR" ? "flex-row-reverse" : "")}>
            <div className={cn("flex items-center gap-3", language === "AR" ? "flex-row-reverse" : "")}>
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || "User"} 
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full border border-primary/30 shadow-sm"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold font-sans">
                  {user.displayName?.[0] || 'U'}
                </div>
              )}
              <div className={cn(language === "AR" ? "text-right" : "text-left")}>
                <p className="font-bold text-on-surface text-sm">{user.displayName || 'Google User'}</p>
                <p className="text-[11px] text-on-surface-variant opacity-60 font-mono">{user.email}</p>
              </div>
            </div>
            
            <button
              onClick={handleDisconnect}
              disabled={isLoading}
              title={t.disconnect}
              className="p-2 text-on-surface-variant/50 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
            >
              <LogOut size={16} />
            </button>
          </div>

          {/* Ledger connection details */}
          <div className="p-4 bg-surface-container-low/60 rounded-2xl border border-outline/30 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-on-surface-variant/60 uppercase tracking-widest flex items-center gap-1.5">
                <Database size={12} />
                {t.ledger_connected}
              </span>
              
              {linkedSheet && (
                <a 
                  href={`https://docs.google.com/spreadsheets/d/${linkedSheet.id}`} 
                  target="_blank" 
                  rel="noreferrer"
                  title="Open Spreadsheet"
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  <ExternalLink size={14} />
                </a>
              )}
            </div>

            {linkedSheet ? (
              <div className={cn("flex items-center gap-3 p-3 bg-green-500/5 rounded-xl border border-green-500/10", language === "AR" ? "flex-row-reverse text-right" : "text-left")}>
                <div className="w-9 h-9 bg-green-500/15 text-green-400 rounded-lg flex items-center justify-center shrink-0">
                  <FileSpreadsheet size={18} />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-on-surface truncate">{linkedSheet.name}</p>
                  <p className="text-[9px] font-mono text-on-surface-variant/40 truncate select-all">{linkedSheet.id}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-2 space-y-3">
                <p className="text-xs text-on-surface-variant opacity-75">
                  {t.sheet_not_found}
                </p>
                <button
                  onClick={handleCreateSheet}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-primary hover:bg-primary/95 text-on-primary font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98]"
                >
                  <FileSpreadsheet size={14} />
                  {t.create_ledger}
                </button>
              </div>
            )}

            {/* Sync Controls (Import / Export) */}
            {linkedSheet && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleImport}
                  disabled={isLoading}
                  className="py-2.5 px-3 bg-[#161B22] hover:bg-[#21262D] border border-outline/30 text-on-surface font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
                >
                  <Download size={14} className={cn("text-blue-400", isLoading && syncDirection === "import" && "animate-spin")} />
                  {t.import_from_sheets}
                </button>
                <button
                  onClick={handleExport}
                  disabled={isLoading}
                  className="py-2.5 px-3 bg-[#161B22] hover:bg-[#21262D] border border-outline/30 text-on-surface font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
                >
                  <Upload size={14} className={cn("text-green-400", isLoading && syncDirection === "export" && "animate-spin")} />
                  {t.export_to_sheets}
                </button>
              </div>
            )}
          </div>

          {/* Auto-sync configuration */}
          {linkedSheet && (
            <div className={cn("flex items-center justify-between p-3 bg-surface-container-high/20 rounded-xl border border-outline/20", language === "AR" ? "flex-row-reverse" : "")}>
              <div className={cn(language === "AR" ? "text-right" : "text-left")}>
                <p className="text-xs font-bold text-on-surface">{t.auto_sync}</p>
                <p className="text-[10px] text-on-surface-variant/60">{language === "AR" ? "مزامنة الفواتير تلقائياً عند أي إضافة أو تعديل" : "Keep Sheets ledger updated with any local modifications"}</p>
              </div>
              
              <button
                onClick={() => onAutoSyncToggle(!autoSync)}
                className="text-primary hover:scale-105 transition-all"
              >
                {autoSync ? (
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
