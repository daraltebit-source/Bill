import React, { useState, useEffect, useRef } from "react";
import { 
  Bell, 
  HardDrive, 
  Download, 
  Upload, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  FileJson,
  Check,
  RefreshCw
} from "lucide-react";
import { cn } from "../lib/utils";
import { Language } from "../translations";
import { Bill } from "../types";

interface DevicePermissionsCenterProps {
  language: Language;
  bills: Bill[];
  onBillsImported: (imported: Bill[]) => void;
  onSuccessMessage: (msg: string) => void;
}

export const DevicePermissionsCenter: React.FC<DevicePermissionsCenterProps> = ({
  language,
  bills,
  onBillsImported,
  onSuccessMessage
}) => {
  const [notificationPermission, setNotificationPermission] = useState<string>("default");
  const [localStorageKB, setLocalStorageKB] = useState<string>("0.00");
  const [isDragActive, setIsDragActive] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Translations
  const texts = {
    EN: {
      title: "Device Permissions & Local Storage",
      desc: "Manage device alert capabilities, storage read/write operations, and backup ledger ledgers.",
      notification_perm: "System Notification Permission",
      notification_desc: "Configure push notifications directly to your system tray.",
      storage_usage: "Device Sandbox Storage",
      storage_desc: "Monitor offline database capacity within your browser local sandbox.",
      request_permission: "Request System Permission",
      trigger_test: "Trigger Test Notification",
      granted: "Permission Granted",
      denied: "Permission Blocked",
      default: "Action Required",
      test_title: "BillMatrix Ledger Active",
      test_body: "System alert channels are successfully registered and synchronized!",
      backup_ledger: "Download Ledger Backup",
      backup_desc: "Download secure local database ledger (.json) for storage archival.",
      import_ledger: "Upload Ledger Backup",
      import_desc: "Select or drop a ledger JSON backup file to overwrite/restore your database.",
      drag_drop: "Drag & drop your backup here, or browse files",
      invalid_file: "Invalid Backup: The file format is invalid or missing required bill properties.",
      import_success: "Ledger Backup successfully restored!",
      recalculating: "Recalculating...",
      diagnostics_title: "Ledger Integrity Diagnostics",
      records_count: "Current Active Rows",
      kb_used: "Storage Allocation",
      sandbox_status: "Sandbox Status",
      optimal: "Optimal (Offline Secured)"
    },
    AR: {
      title: "صلاحيات الجهاز والتخزين المحلي",
      desc: "إدارة إمكانيات تنبيهات الجهاز، عمليات القراءة والكتابة للتخزين، ونسخ دفاتر السجلات الاحتياطية.",
      notification_perm: "صلاحية إشعارات النظام",
      notification_desc: "تكوين دفع الإشعارات مباشرة إلى علبة نظام التشغيل الخاصة بك.",
      storage_usage: "تخزين بيئة عمل الجهاز",
      storage_desc: "مراقبة سعة قاعدة البيانات غير المتصلة بالإنترنت داخل متصفحك.",
      request_permission: "طلب صلاحية النظام",
      trigger_test: "إرسال إشعار تجريبي",
      granted: "تم منح الصلاحية",
      denied: "تم رفض الصلاحية",
      default: "مطلوب اتخاذ إجراء",
      test_title: "مزامنة سجل BillMatrix",
      test_body: "قنوات تنبيه النظام مسجلة ومزامنة بنجاح!",
      backup_ledger: "تحميل نسخة احتياطية للسجل",
      backup_desc: "تحميل نسخة احتياطية من قاعدة البيانات (.json) لحفظها وتخزينها.",
      import_ledger: "رفع نسخة احتياطية للسجل",
      import_desc: "اختر أو اسحب ملف JSON لنسخة احتياطية لاستعادة قاعدة بياناتك.",
      drag_drop: "اسحب وأسقط النسخة الاحتياطية هنا، أو تصفح الملفات",
      invalid_file: "نسخة احتياطية غير صالحة: تنسيق الملف غير صحيح أو يفتقد لخصائص الفواتير المطلوبة.",
      import_success: "تم استعادة النسخة الاحتياطية للسجل بنجاح!",
      recalculating: "جاري إعادة الحساب...",
      diagnostics_title: "تشخيصات سلامة السجل",
      records_count: "الصفوف النشطة حالياً",
      kb_used: "تخصيص التخزين",
      sandbox_status: "حالة البيئة التجريبية",
      optimal: "مثالية (أوفلاين آمن)"
    }
  };

  const t = texts[language];

  // Calculate local storage size
  const calculateStorageSize = () => {
    try {
      let total = 0;
      for (let x in localStorage) {
        if (localStorage.hasOwnProperty(x)) {
          total += (localStorage[x].length + x.length) * 2; // Roughly 2 bytes per char
        }
      }
      setLocalStorageKB((total / 1024).toFixed(2));
    } catch (e) {
      setLocalStorageKB("0.00");
    }
  };

  useEffect(() => {
    // Check permission status
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
    calculateStorageSize();
  }, [bills]);

  const handleRequestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      onSuccessMessage(language === "AR" ? "الإشعارات غير مدعومة في متصفحك" : "Notifications not supported by this browser");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === "granted") {
        onSuccessMessage(language === "AR" ? "تم منح صلاحية الإشعارات!" : "Notifications permission granted!");
      } else {
        onSuccessMessage(language === "AR" ? "تم رفض صلاحية الإشعارات" : "Notifications permission denied");
      }
    } catch (err) {
      console.error("Failed to request permission:", err);
      // Fallback in case of sandboxed iframe limitations
      onSuccessMessage(language === "AR" ? "البيئة التجريبية تحظر إشعارات النظام" : "Sandbox restricts system notifications");
    }
  };

  const handleTriggerTestNotification = () => {
    if (!("Notification" in window)) {
      onSuccessMessage(language === "AR" ? "الإشعارات غير مدعومة" : "Notifications not supported");
      return;
    }

    if (Notification.permission === "granted") {
      try {
        new Notification(t.test_title, {
          body: t.test_body,
          icon: "/favicon.ico"
        });
        onSuccessMessage(language === "AR" ? "تم إرسال الإشعار التجريبي!" : "Test notification triggered!");
      } catch (err) {
        // Fallback for security restriction inside some iframes
        console.error("Native notification failed, showing local toast fallback:", err);
        onSuccessMessage(`${t.test_title}: ${t.test_body}`);
      }
    } else {
      handleRequestNotificationPermission();
    }
  };

  // Download/Export ledger backup (.json)
  const handleDownloadBackup = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(bills, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `BillMatrix_Backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      onSuccessMessage(language === "AR" ? "تم تحميل النسخة الاحتياطية بنجاح" : "Ledger backup downloaded successfully!");
    } catch (err) {
      console.error("Backup download failed:", err);
    }
  };

  // Upload/Import file handler
  const processImportFile = (file: File) => {
    setImportError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        
        // Validation: Must be array of bills with necessary attributes
        if (!Array.isArray(parsed)) {
          throw new Error("Must be an array");
        }

        const isValid = parsed.every((item: any) => {
          return (
            typeof item === "object" &&
            item !== null &&
            typeof item.id === "string" &&
            typeof item.provider === "string" &&
            typeof item.amount === "number" &&
            typeof item.dueDate === "string" &&
            typeof item.status === "string"
          );
        });

        if (!isValid) {
          throw new Error("Missing key attributes");
        }

        onBillsImported(parsed);
        onSuccessMessage(t.import_success);
        calculateStorageSize();
      } catch (err) {
        console.error("Import parsing failed:", err);
        setImportError(t.invalid_file);
      }
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImportFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImportFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="mb-6 text-start">
        <h3 className="font-mono text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
          <ShieldCheck size={14} />
          {t.title}
        </h3>
        <p className="text-on-surface-variant text-[13px] opacity-80 leading-relaxed">{t.desc}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Notification Permission Card */}
        <div className="bg-[#11151C] border border-outline rounded-2xl p-5 flex flex-col justify-between text-start">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Bell size={20} />
              </div>
              <span className={cn(
                "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                notificationPermission === "granted" && "bg-green-500/10 text-green-400",
                notificationPermission === "default" && "bg-amber-500/10 text-amber-400",
                notificationPermission === "denied" && "bg-red-500/10 text-red-400"
              )}>
                {notificationPermission === "granted" && t.granted}
                {notificationPermission === "default" && t.default}
                {notificationPermission === "denied" && t.denied}
              </span>
            </div>
            <div>
              <p className="font-bold text-on-surface text-sm">{t.notification_perm}</p>
              <p className="text-[12px] text-on-surface-variant opacity-70 mt-1 leading-relaxed">{t.notification_desc}</p>
            </div>
          </div>
          
          <div className="pt-5 flex flex-col sm:flex-row gap-2 mt-auto">
            {notificationPermission !== "granted" ? (
              <button
                onClick={handleRequestNotificationPermission}
                className="flex-1 py-2.5 px-4 bg-primary text-on-primary rounded-xl font-headline font-bold text-xs hover:brightness-110 transition-all text-center"
              >
                {t.request_permission}
              </button>
            ) : (
              <button
                onClick={handleTriggerTestNotification}
                className="flex-1 py-2.5 px-4 bg-surface-container-high text-on-surface border border-outline rounded-xl font-headline font-bold text-xs hover:bg-surface-container-highest transition-all text-center"
              >
                {t.trigger_test}
              </button>
            )}
          </div>
        </div>

        {/* Local Storage Card */}
        <div className="bg-[#11151C] border border-outline rounded-2xl p-5 flex flex-col justify-between text-start">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <HardDrive size={20} />
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary">
                {t.optimal}
              </span>
            </div>
            <div>
              <p className="font-bold text-on-surface text-sm">{t.storage_usage}</p>
              <p className="text-[12px] text-on-surface-variant opacity-70 mt-1 leading-relaxed">{t.storage_desc}</p>
            </div>
          </div>

          <div className="pt-5 grid grid-cols-3 gap-2 mt-auto border-t border-outline-variant/50">
            <div className="text-center">
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{t.records_count}</p>
              <p className="font-bold text-sm text-on-surface mt-1">{bills.length}</p>
            </div>
            <div className="text-center border-x border-outline-variant/50">
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{t.kb_used}</p>
              <p className="font-bold text-sm text-on-surface mt-1">{localStorageKB} KB</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Limits</p>
              <p className="font-bold text-sm text-on-surface mt-1">5.0 MB</p>
            </div>
          </div>
        </div>
      </div>

      {/* Backup and Import Storage Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Download Local Backup (Write/Export) */}
        <div className="bg-[#11151C] border border-outline rounded-2xl p-5 flex flex-col justify-between text-start">
          <div className="space-y-2 mb-4">
            <p className="font-bold text-on-surface text-sm flex items-center gap-2">
              <Download size={16} className="text-primary" />
              {t.backup_ledger}
            </p>
            <p className="text-[12px] text-on-surface-variant opacity-70 leading-relaxed">{t.backup_desc}</p>
          </div>
          <button
            onClick={handleDownloadBackup}
            className="w-full py-3 px-4 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl font-headline font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-2 mt-auto"
          >
            <FileJson size={14} />
            {language === "AR" ? "تحميل ملف JSON" : "Download JSON Ledger"}
          </button>
        </div>

        {/* Upload Local Backup (Read/Import) */}
        <div className="bg-[#11151C] border border-outline rounded-2xl p-5 flex flex-col justify-between text-start">
          <div className="space-y-2 mb-4">
            <p className="font-bold text-on-surface text-sm flex items-center gap-2">
              <Upload size={16} className="text-primary" />
              {t.import_ledger}
            </p>
            <p className="text-[12px] text-on-surface-variant opacity-70 leading-relaxed">{t.import_desc}</p>
          </div>

          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200 mt-auto",
              isDragActive 
                ? "border-primary bg-primary/5" 
                : "border-outline-variant hover:border-primary/55 bg-surface/30"
            )}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept=".json"
              className="hidden"
            />
            <Upload size={20} className="mx-auto text-on-surface-variant opacity-50 mb-1" />
            <p className="text-[11px] text-on-surface font-semibold">{t.drag_drop}</p>
          </div>

          {importError && (
            <p className="text-red-400 text-[11px] mt-2 font-semibold flex items-center gap-1">
              <AlertCircle size={12} />
              {importError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
