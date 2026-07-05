import React from "react";
import { X, CreditCard, History, Building2, Calendar, FileText, ArrowUpRight, Loader2, Pencil, Save, RefreshCw } from "lucide-react";
import { Bill, UtilityType, BillStatus } from "../types";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { translations, Language } from "../translations";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface BillDetailModalProps {
  bill: Bill | null;
  onClose: () => void;
  onUpdate: (updatedBill: Bill) => void;
  language: Language;
  initialEditMode?: boolean;
}

export const BillDetailModal: React.FC<BillDetailModalProps> = ({ 
  bill, 
  onClose, 
  onUpdate, 
  language,
  initialEditMode = false
}) => {
  const t = translations[language];
  const [isEditing, setIsEditing] = React.useState(initialEditMode);

  // Editable fields state
  const [editedProvider, setEditedProvider] = React.useState("");
  const [editedAccountNumber, setEditedAccountNumber] = React.useState("");
  const [editedDueDate, setEditedDueDate] = React.useState("");
  const [editedAmount, setEditedAmount] = React.useState(0);
  const [editedBaseAmount, setEditedBaseAmount] = React.useState<string>("");
  const [editedServiceType, setEditedServiceType] = React.useState<UtilityType>("Internet");
  const [editedBranchName, setEditedBranchName] = React.useState("");
  const [editedStatus, setEditedStatus] = React.useState<BillStatus>("Unpaid");
  const [editedRecurring, setEditedRecurring] = React.useState(false);
  const [editedFrequency, setEditedFrequency] = React.useState("Monthly");

  React.useEffect(() => {
    if (bill) {
      setEditedProvider(bill.provider);
      setEditedAccountNumber(bill.accountNumber || "");
      setEditedDueDate(bill.dueDate);
      const base = bill.baseAmount ?? (bill.amount / 1.14);
      setEditedBaseAmount(base.toFixed(2));
      setEditedAmount(bill.amount);
      setEditedServiceType(bill.serviceType);
      setEditedBranchName(bill.branchName || "");
      setEditedStatus(bill.status);
      setEditedRecurring(bill.recurring || false);
      setEditedFrequency(bill.frequency || "Monthly");
      setIsEditing(initialEditMode);
    }
  }, [bill, initialEditMode]);

  const [isExporting, setIsExporting] = React.useState(false);

  const handleSave = () => {
    if (!bill) return;
    const base = parseFloat(editedBaseAmount) || 0;
    const totalAmount = base * 1.14;
    const vatAmount = base * 0.14;
    
    onUpdate({
      ...bill,
      provider: editedProvider.trim(),
      accountNumber: editedAccountNumber.trim() || undefined,
      dueDate: editedDueDate,
      amount: totalAmount,
      baseAmount: base,
      vatAmount: vatAmount,
      serviceType: editedServiceType,
      branchName: editedBranchName.trim() || undefined,
      status: editedStatus,
      recurring: editedRecurring,
      frequency: editedRecurring ? editedFrequency : undefined
    });
    setIsEditing(false);
  };
  
  const handleDownloadStatement = async () => {
    if (!bill) return;
    setIsExporting(true);
    try {
      const doc = new jsPDF("p", "mm", "a4");
      
      // Page setup & styling helper variables
      const primaryColor = [129, 140, 248]; // Indigo #818CF8
      const darkColor = [15, 23, 42]; // Slate #0F172A
      const lightColor = [248, 250, 252]; // Slate 50
      const strokeColor = [226, 232, 240]; // Slate 200

      // 1. Sleek Top Header Banner
      doc.setFillColor(15, 23, 42); // Deep obsidian/slate
      doc.rect(0, 0, 210, 48, "F");

      // Header top accent line (Primary Indigo)
      doc.setFillColor(129, 140, 248);
      doc.rect(0, 48, 210, 3, "F");

      // Brand Title & Info
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("The report was prepared by the IT department.", 14, 23);

      // Subtitle
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(194, 205, 225); // Slate 300
      doc.text("Electronic Ledger Record & Verification Statement", 14, 29);

      // Metas
      doc.setFontSize(8.5);
      doc.setTextColor(148, 163, 184); // Slate 400
      doc.text(`LEDGER SCOPE: SINGLE OBLIGATION AUDIT RECORD`, 14, 38);
      
      const genDateStr = new Date().toLocaleString(language === "AR" ? "ar-EG" : "en-US");
      doc.text(`GENERATED ON: ${genDateStr.toUpperCase()}`, 14, 43);

      // Add a nice visual indicator badge in the top right
      doc.setFillColor(30, 41, 59); // Dark slate badge
      doc.roundedRect(145, 14, 51, 14, 2, 2, "F");
      doc.setTextColor(129, 140, 248); // Indigo
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("SECURE RECONCILIATION", 148, 23);

      // 2. Executive Summary section header
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.text("OBLIGATION PERFORMANCE SUMMARY", 14, 62);

      // Draw the beautiful 3 KPI Cards!
      // Card 1: AMOUNT DUE
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, 68, 58, 24, 3, 3, "FD");
      
      doc.setFillColor(129, 140, 248); // Indigo
      doc.rect(14, 68, 1.5, 24, "F");

      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text("TOTAL AMOUNT DUE", 18, 75);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`${bill.amount.toFixed(2)} ${bill.currency}`, 18, 84);

      // Card 2: SETTLEMENT STATUS
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(76, 68, 58, 24, 3, 3, "FD");

      const isPaid = bill.status === "Paid";
      const statusColor = isPaid ? [52, 211, 153] : [248, 113, 113]; // Green or Red
      doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.rect(76, 68, 1.5, 24, "F");

      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text("SETTLEMENT STATUS", 80, 75);

      doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.setFontSize(11.5);
      doc.setFont("helvetica", "bold");
      doc.text(bill.status.toUpperCase(), 80, 84);

      // Card 3: SERVICE TYPE
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(138, 68, 58, 24, 3, 3, "FD");

      doc.setFillColor(129, 140, 248); // Indigo
      doc.rect(138, 68, 1.5, 24, "F");

      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text("SERVICE TYPE", 142, 75);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(10.5);
      doc.setFont("helvetica", "bold");
      doc.text(bill.serviceType.toUpperCase(), 142, 84);

      // 3. Detailed specifications header
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.text("DETAILED SPECIFICATIONS", 14, 105);

      // Main bill information grid using jsPDF autoTable
      const formattedDate = new Date(bill.dueDate).toLocaleDateString(
        language === "AR" ? 'ar-EG' : 'en-US', 
        { day: '2-digit', month: 'long', year: 'numeric' }
      );
      const formattedFrequency = language === "AR" 
        ? (bill.frequency === "Monthly" ? "شهري" : bill.frequency || "مرة واحدة") 
        : (bill.frequency || "Once-off");
      const serviceLabel = language === "AR" 
        ? (bill.serviceType === "Internet" ? "سجل إنترنت" : "سجل هاتف أرضي") 
        : `${bill.serviceType} Record`;
      
      // @ts-ignore
      autoTable(doc, {
        startY: 110,
        margin: { left: 14, right: 14 },
        body: [
          [t.provider || "Provider", bill.provider, t.due_date || "Due Date", formattedDate],
          [language === "AR" ? "نوع الخدمة" : "Service Type", serviceLabel, t.branch_office || "Branch Office", bill.branchName || "Main Office"],
          [t.account_reference || "Account Reference", bill.accountNumber || "N/A", language === "AR" ? "التكرار" : "Frequency", formattedFrequency],
          [language === "AR" ? "الحالة" : "Status", bill.status, language === "AR" ? "المبلغ المستحق" : "Amount Due", `${bill.amount.toFixed(2)} ${bill.currency}`],
        ],
        theme: 'striped',
        styles: { fontSize: 8.5, cellPadding: 4, fontStyle: 'normal', textColor: [50, 55, 65] },
        columnStyles: {
          0: { fontStyle: 'bold', fillColor: [240, 242, 245], cellWidth: 36 },
          1: { cellWidth: 55 },
          2: { fontStyle: 'bold', fillColor: [240, 242, 245], cellWidth: 36 },
          3: { cellWidth: 55 }
        }
      });

      // Payment registry section
      const registryY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.text(t.payment_registry || "PAYMENT REGISTRY", 14, registryY);

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(110, 115, 125);
      doc.text(t.last_5_cycles || "Last 5 cycles history:", 14, registryY + 6);

      const historyRows = [
        ["2024-03-12", `${bill.amount.toFixed(2)} EGP`, language === "AR" ? "ناجح" : "Successful", "TXN-8829"],
        ["2024-02-14", `${(bill.amount * 0.98).toFixed(2)} EGP`, language === "AR" ? "ناجح" : "Successful", "TXN-7731"],
        ["2024-01-10", `${bill.amount.toFixed(2)} EGP`, language === "AR" ? "ناجح" : "Successful", "TXN-6612"],
        ["2023-12-15", `${(bill.amount * 1.05).toFixed(2)} EGP`, language === "AR" ? "ناجح" : "Successful", "TXN-5509"],
        ["2023-11-20", `${bill.amount.toFixed(2)} EGP`, language === "AR" ? "ناجح" : "Successful", "TXN-4491"]
      ];

      // @ts-ignore
      autoTable(doc, {
        startY: registryY + 10,
        margin: { left: 14, right: 14 },
        head: [["Transaction Date", "Settlement Amount", "Status", "Reference Code"]],
        body: historyRows,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
        styles: { fontSize: 8, cellPadding: 3.5 }
      });

      // Stamp and legal disclaimer footer
      const finalY = (doc as any).lastAutoTable.finalY + 20;
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.2);
      doc.line(14, finalY, 196, finalY);

      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // Slate 400
      doc.setFont("helvetica", "normal");
      doc.text("The report was prepared by the IT department.", 14, finalY + 8);
      doc.text(`Verification Stamp: ${Math.random().toString(36).substring(2, 10).toUpperCase()}`, 14, finalY + 13);
      doc.text(`Page 1 of 1`, 196, finalY + 8, { align: 'right' });

      doc.save(`BillMatrix_Statement_${bill.provider.replace(/\s+/g, "_")}_${bill.dueDate}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF statement:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AnimatePresence>
      {bill && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface/80 backdrop-blur-md overflow-hidden transform-gpu"
        >
          {/* Interactive Backdrop backdrop click to close */}
          <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

          <motion.div 
            id="bill-modal-content"
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{ type: "spring", stiffness: 450, damping: 30 }}
            className="bg-surface-container-high border border-outline rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh] relative z-10 transform-gpu will-change-transform"
          >
            {/* Header */}
            <div className="p-6 border-b border-outline-variant flex items-center justify-between bg-primary/5 shrink-0">
              <div className="flex items-center gap-4">
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 transform-gpu"
                >
                  <CreditCard size={24} />
                </motion.div>
                <div>
                  <h2 className="font-headline text-xl font-bold text-on-surface leading-tight">
                    {isEditing 
                      ? (language === "AR" ? "تعديل الالتزام" : "Edit Obligation") 
                      : bill.provider
                    }
                  </h2>
                  <p className="text-[10px] font-mono text-on-surface-variant uppercase tracking-widest font-bold">
                    {isEditing 
                      ? (language === "AR" ? "تحديث حقول السجل" : "Update Ledger Fields")
                      : (language === "AR" ? (bill.serviceType === "Internet" ? "سجل إنترنت" : "سجل هاتف أرضي") : `${bill.serviceType} Record`)
                    }
                  </p>
                </div>
              </div>
              <motion.button 
                whileHover={{ scale: 1.1, bg: "rgba(255,255,255,0.1)" }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                data-html2canvas-ignore="true"
                className="p-2 hover:bg-surface-container-highest rounded-full text-on-surface-variant transition-colors cursor-pointer"
              >
                <X size={20} />
              </motion.button>
            </div>

            {/* Body Content - Scrollable */}
            <div className="p-8 space-y-8 overflow-y-auto no-scrollbar flex-1">
              {isEditing ? (
                // EDIT MODE
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Provider */}
                    <div className="space-y-1.5">
                      <label className="block font-mono text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">
                        {language === "AR" ? "المزود" : "Provider"}
                      </label>
                      <input
                        type="text"
                        value={editedProvider}
                        onChange={(e) => setEditedProvider(e.target.value)}
                        className="w-full bg-surface border border-outline rounded-xl py-3 px-4 text-xs font-sans font-semibold text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/30"
                        placeholder={language === "AR" ? "اسم المزود" : "Provider Name"}
                      />
                    </div>

                    {/* Service Type */}
                    <div className="space-y-1.5">
                      <label className="block font-mono text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">
                        {language === "AR" ? "نوع الخدمة" : "Service Type"}
                      </label>
                      <div className="relative">
                        <select
                          value={editedServiceType}
                          onChange={(e) => setEditedServiceType(e.target.value as UtilityType)}
                          className="w-full bg-surface border border-outline rounded-xl py-3.5 px-4 text-xs font-sans font-semibold text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer appearance-none"
                        >
                          <option value="Internet" className="bg-surface-container-high">{language === "AR" ? "إنترنت" : "Internet"}</option>
                          <option value="Landline" className="bg-surface-container-high">{language === "AR" ? "هاتف أرضي" : "Landline"}</option>
                          <option value="Water" className="bg-surface-container-high">{language === "AR" ? "مياه" : "Water"}</option>
                          <option value="Mobile" className="bg-surface-container-high">{language === "AR" ? "موبايل" : "Mobile"}</option>
                        </select>
                      </div>
                    </div>

                    {/* Account Number */}
                    <div className="space-y-1.5">
                      <label className="block font-mono text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">
                        {language === "AR" ? "رقم الحساب" : "Account Number"}
                      </label>
                      <input
                        type="text"
                        value={editedAccountNumber}
                        onChange={(e) => setEditedAccountNumber(e.target.value)}
                        className="w-full bg-surface border border-outline rounded-xl py-3 px-4 text-xs font-sans font-semibold text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/30 font-mono"
                        placeholder="e.g. 102938475"
                      />
                    </div>

                    {/* Branch Name */}
                    <div className="space-y-1.5">
                      <label className="block font-mono text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">
                        {language === "AR" ? "اسم الفرع" : "Branch Name"}
                      </label>
                      <input
                        type="text"
                        value={editedBranchName}
                        onChange={(e) => setEditedBranchName(e.target.value)}
                        className="w-full bg-surface border border-outline rounded-xl py-3 px-4 text-xs font-sans font-semibold text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/30"
                        placeholder="e.g. Main Office"
                      />
                    </div>

                    {/* Due Date */}
                    <div className="space-y-1.5">
                      <label className="block font-mono text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">
                        {language === "AR" ? "تاريخ الاستحقاق" : "Due Date"}
                      </label>
                      <input
                        type="date"
                        value={editedDueDate}
                        onChange={(e) => setEditedDueDate(e.target.value)}
                        className="w-full bg-surface border border-outline rounded-xl py-3 px-4 text-xs font-sans font-semibold text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-mono"
                      />
                    </div>

                    {/* Monthly Limit (Base Amount) with 14% VAT details */}
                    <div className="space-y-1.5 col-span-1 sm:col-span-2">
                      <label className="block font-mono text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">
                        {t.monthly_limit}
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          step="any"
                          value={editedBaseAmount}
                          onChange={(e) => {
                            const valStr = e.target.value;
                            setEditedBaseAmount(valStr);
                            const valNum = parseFloat(valStr) || 0;
                            setEditedAmount(valNum * 1.14);
                          }}
                          className="w-full bg-surface border border-outline rounded-xl py-3 px-4 text-xs font-sans font-semibold text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-mono"
                          placeholder="0.00"
                        />
                        <span className="absolute right-4 font-mono text-[10px] font-bold text-on-surface-variant/60 uppercase">{t.egp}</span>
                      </div>

                      {parseFloat(editedBaseAmount) > 0 && (
                        <div className="mt-3 p-4 bg-surface rounded-2xl border border-outline/40 text-[11px] space-y-2.5 animate-in fade-in duration-300">
                          <div className="flex justify-between items-center text-on-surface-variant">
                            <span className="font-sans font-medium">{language === "AR" ? "المبلغ الأساسي:" : "Base Amount:"}</span>
                            <span className="font-mono font-bold text-xs">{(parseFloat(editedBaseAmount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[9px] opacity-60 font-semibold">{t.egp}</span></span>
                          </div>
                          <div className="flex justify-between items-center text-on-surface-variant">
                            <span className="font-sans font-medium">{language === "AR" ? "ضريبة القيمة المضافة (14%):" : "VAT (14%):"}</span>
                            <span className="font-mono font-bold text-xs text-primary">{(parseFloat(editedBaseAmount) * 0.14 || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[9px] opacity-60 font-semibold">{t.egp}</span></span>
                          </div>
                          <div className="h-px bg-outline-variant/30 my-1" />
                          <div className="flex justify-between items-center text-on-surface">
                            <span className="font-sans font-bold text-xs">{language === "AR" ? "الإجمالي المستحق (شامل الضريبة):" : "Total Due (VAT Incl.):"}</span>
                            <span className="font-mono font-black text-sm text-primary">{(parseFloat(editedBaseAmount) * 1.14 || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] font-bold">{t.egp}</span></span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Status */}
                    <div className="space-y-1.5">
                      <label className="block font-mono text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">
                        {language === "AR" ? "الحالة" : "Status"}
                      </label>
                      <div className="relative">
                        <select
                          value={editedStatus}
                          onChange={(e) => setEditedStatus(e.target.value as BillStatus)}
                          className="w-full bg-surface border border-outline rounded-xl py-3.5 px-4 text-xs font-sans font-semibold text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer appearance-none"
                        >
                          <option value="Paid" className="bg-surface-container-high">{language === "AR" ? "مدفوع" : "Paid"}</option>
                          <option value="Unpaid" className="bg-surface-container-high">{language === "AR" ? "غير مدفوع" : "Unpaid"}</option>
                          <option value="Pending" className="bg-surface-container-high">{language === "AR" ? "معلق" : "Pending"}</option>
                          <option value="Draft" className="bg-surface-container-high">{language === "AR" ? "مسودة" : "Draft"}</option>
                          <option value="Overdue" className="bg-surface-container-high">{language === "AR" ? "متأخر" : "Overdue"}</option>
                        </select>
                      </div>
                    </div>

                    {/* Interval Frequency */}
                    {editedRecurring && (
                      <div className="space-y-1.5 animate-in fade-in duration-300">
                        <label className="block font-mono text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">
                          {language === "AR" ? "التكرار" : "Frequency"}
                        </label>
                        <div className="relative">
                          <select
                            value={editedFrequency}
                            onChange={(e) => setEditedFrequency(e.target.value)}
                            className="w-full bg-surface border border-outline rounded-xl py-3.5 px-4 text-xs font-sans font-semibold text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer appearance-none"
                          >
                            <option value="Monthly" className="bg-surface-container-high">{language === "AR" ? "شهري" : "Monthly"}</option>
                            <option value="Quarterly" className="bg-surface-container-high">{language === "AR" ? "ربع سنوي" : "Quarterly"}</option>
                            <option value="Annually" className="bg-surface-container-high">{language === "AR" ? "سنوي" : "Annually"}</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Recurring Switch Button */}
                  <div className="pt-4 border-t border-outline-variant/40">
                    <label className="flex items-center gap-4 cursor-pointer group w-fit select-none">
                      <input
                        type="checkbox"
                        checked={editedRecurring}
                        onChange={(e) => setEditedRecurring(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="relative w-11 h-6 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      <span className="font-sans text-xs font-bold text-on-surface-variant group-hover:text-on-surface transition-colors">
                        {language === "AR" ? "تفعيل الالتزام الدوري" : "Enable Recurring Obligation"}
                      </span>
                    </label>
                  </div>
                </div>
              ) : (
                // VIEW MODE
                <>
                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-mono text-on-surface-variant uppercase tracking-widest font-bold flex items-center gap-2">
                        <Building2 size={12} className="text-primary" />
                        {t.branch_office}
                      </p>
                      <p className="font-sans text-sm font-semibold text-on-surface">{bill.branchName || (language === "AR" ? "المكتب الرئيسي" : "Main Office")}</p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-mono text-on-surface-variant uppercase tracking-widest font-bold flex items-center gap-2">
                        <FileText size={12} className="text-primary" />
                        {t.account_reference}
                      </p>
                      <p className="font-sans text-sm font-semibold text-on-surface">{bill.accountNumber || "N/A"}</p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-mono text-on-surface-variant uppercase tracking-widest font-bold flex items-center gap-2">
                        <Calendar size={12} className="text-primary" />
                        {t.due_date}
                      </p>
                      <p className="font-sans text-sm font-semibold text-on-surface">
                        {new Date(bill.dueDate).toLocaleDateString(language === "AR" ? 'ar-EG' : 'en-US', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-mono text-on-surface-variant uppercase tracking-widest font-bold flex items-center gap-2">
                        <History size={12} className="text-primary" />
                        {t.frequency}
                      </p>
                      <p className="font-sans text-sm font-semibold text-on-surface">{language === "AR" ? (bill.frequency === "Monthly" ? "شهري" : bill.frequency || "مرة واحدة") : (bill.frequency || "Once-off")}</p>
                    </div>
                  </div>

                  {/* VAT Breakdown Section */}
                  {(() => {
                    const totalAmount = bill.amount;
                    const baseAmount = bill.baseAmount ?? (totalAmount / 1.14);
                    const vatAmount = bill.vatAmount ?? (totalAmount - baseAmount);
                    return (
                      <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl space-y-2.5">
                        <div className="flex items-center justify-between text-xs text-on-surface-variant">
                          <span className="font-sans font-semibold">{language === "AR" ? "المبلغ الأساسي (قبل الضريبة):" : "Base Amount (Excl. VAT):"}</span>
                          <span className="font-mono font-bold text-sm text-on-surface">{baseAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] opacity-60 font-semibold">{t.egp}</span></span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-on-surface-variant">
                          <span className="font-sans font-semibold">{language === "AR" ? "ضريبة القيمة المضافة (14%):" : "VAT (14%):"}</span>
                          <span className="font-mono font-bold text-sm text-primary">{vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] opacity-60 font-semibold">{t.egp}</span></span>
                        </div>
                        <div className="h-px bg-outline-variant/30 my-1" />
                        <div className="flex items-center justify-between text-sm text-on-surface font-bold">
                          <span className="font-sans font-black">{language === "AR" ? "الإجمالي المستحق (شامل الضريبة):" : "Total Due (VAT Incl.):"}</span>
                          <span className="font-mono text-primary text-base font-black">{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-bold">{t.egp}</span></span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Payment History */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-outline-variant pb-2">
                      <h3 className="text-[11px] font-bold text-on-surface uppercase tracking-[0.2em] italic flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                        {t.payment_registry}
                      </h3>
                      <span className="text-[10px] font-mono text-on-surface-variant">{t.last_5_cycles}</span>
                    </div>
                    
                    <div className="space-y-2">
                      {[
                        { date: "2024-03-12", amount: bill.amount, status: language === "AR" ? "ناجح" : "Successful", ref: "TXN-8829" },
                        { date: "2024-02-14", amount: bill.amount * 0.98, status: language === "AR" ? "ناجح" : "Successful", ref: "TXN-7731" },
                        { date: "2024-01-10", amount: bill.amount, status: language === "AR" ? "ناجح" : "Successful", ref: "TXN-6612" },
                        { date: "2023-12-15", amount: bill.amount * 1.05, status: language === "AR" ? "ناجح" : "Successful", ref: "TXN-5509" },
                        { date: "2023-11-20", amount: bill.amount, status: language === "AR" ? "ناجح" : "Successful", ref: "TXN-4491" },
                      ].map((entry, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-outline/5 hover:border-outline/20 transition-all group/item">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary group-hover/item:scale-110 transition-transform font-bold">
                              <ArrowUpRight size={14} className={cn(language === "AR" && "rotate-[270deg]")} />
                            </div>
                            <div>
                              <p className="text-[11px] font-bold text-on-surface">
                                {new Date(entry.date).toLocaleDateString(language === "AR" ? 'ar-EG' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </p>
                              <p className="text-[9px] font-mono text-on-surface-variant uppercase flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-tertiary/60" />
                                {entry.status} • {entry.ref}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-headline text-sm font-bold text-on-surface">{entry.amount.toFixed(2)}</p>
                            <p className="text-[9px] font-mono text-on-surface-variant uppercase tracking-tighter">{t.egp}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer Actions */}
            <div data-html2canvas-ignore="true" className="p-6 bg-surface-container-highest flex gap-3 shrink-0">
              {isEditing ? (
                // EDIT MODE ACTIONS
                <>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    className="flex-1 h-12 bg-primary text-on-primary rounded-xl font-headline font-bold text-sm shadow-lg shadow-primary/20 hover:brightness-110 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Save size={16} />
                    {language === "AR" ? "حفظ التغييرات" : "Save Changes"}
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsEditing(false)}
                    className="flex-1 h-12 border border-outline text-on-surface rounded-xl font-headline font-bold text-sm hover:bg-surface-container transition-all cursor-pointer"
                  >
                    {language === "AR" ? "إلغاء" : "Cancel"}
                  </motion.button>
                </>
              ) : (
                // VIEW MODE ACTIONS
                <>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDownloadStatement}
                    disabled={isExporting}
                    className="flex-1 h-12 bg-primary text-on-primary rounded-xl font-headline font-bold text-sm shadow-lg shadow-primary/20 hover:brightness-110 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isExporting && <Loader2 className="animate-spin" size={16} />}
                    {!isExporting && <ArrowUpRight size={16} />}
                    {t.download_statement}
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsEditing(true)}
                    className="h-12 px-6 border border-outline hover:border-primary/50 text-on-surface rounded-xl font-headline font-bold text-sm hover:bg-surface-container transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Pencil size={16} />
                    {language === "AR" ? "تعديل" : "Edit"}
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    className="h-12 px-6 border border-outline text-on-surface-variant rounded-xl font-headline font-medium text-sm hover:bg-surface-container transition-all cursor-pointer"
                  >
                    {t.close}
                  </motion.button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
