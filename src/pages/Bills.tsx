import React, { useState, useRef } from "react";
import { Search, FileText, Download, Upload, AlertCircle, CheckCircle2, ChevronDown, SlidersHorizontal } from "lucide-react";
import { BillListItem } from "../components/BillCard";
import { BillDetailModal } from "../components/BillDetailModal";
import { DeleteConfirmationModal } from "../components/DeleteConfirmationModal";
import { cn } from "../lib/utils";
import { Bill, UtilityType, BillStatus } from "../types";
import { translations, Language } from "../translations";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { DatePicker } from "../components/DatePicker";
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

export const Bills: React.FC<{ bills: Bill[]; setBills: React.Dispatch<React.SetStateAction<Bill[]>>; language: Language }> = ({ bills, setBills, language }) => {
  const t = translations[language];
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [branchFilter, setBranchFilter] = useState("All");
  const [recurringFilter, setRecurringFilter] = useState("All");
  const [dateRangeType, setDateRangeType] = useState("All");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });
  const [search, setSearch] = useState("");
  const [searchTarget, setSearchTarget] = useState<"provider" | "account">("provider");
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [isEditingSelected, setIsEditingSelected] = useState(false);
  const [billToDelete, setBillToDelete] = useState<Bill | null>(null);

  const handleEditBill = (bill: Bill) => {
    setSelectedBill(bill);
    setIsEditingSelected(true);
  };
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveCSV = () => {
    if (bills.length === 0) return;
    const headers = ["Provider", "ServiceType", "Amount", "Currency", "DueDate", "Status", "AccountNumber", "BranchName", "Recurring", "Frequency"];
    const rows = bills.map(b => [
      b.provider,
      b.serviceType,
      b.amount,
      b.currency,
      b.dueDate,
      b.status,
      b.accountNumber || "",
      b.branchName || "",
      b.recurring ? "TRUE" : "FALSE",
      b.frequency || ""
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.map(val => `"${val}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `billmatrix_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (filteredBills.length === 0) return;
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
      doc.text("Filtered Expenditure & Status Ledger", 14, 29);

      // Metas
      doc.setFontSize(8.5);
      doc.setTextColor(148, 163, 184); // Slate 400
      doc.text(`LEDGER SCOPE: ACTIVE REAL-TIME REGISTRY`, 14, 38);
      
      const genDateStr = new Date().toLocaleString();
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
      doc.text("FILTERED LEDGER METRICS SUMMARY", 14, 62);
      
      // Calculate totals by currency
      const totalsByCurrency = filteredBills.reduce((acc, curr) => {
        acc[curr.currency] = (acc[curr.currency] || 0) + curr.amount;
        return acc;
      }, {} as Record<string, number>);
      
      const totalString = Object.entries(totalsByCurrency)
        .map(([curr, amt]) => `${(amt as number).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${curr}`)
        .join(" | ");

      // Draw the beautiful 3 KPI Cards!
      // Card 1: RECORDS COUNT
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, 68, 58, 24, 3, 3, "FD");
      
      doc.setFillColor(129, 140, 248); // Indigo
      doc.rect(14, 68, 1.5, 24, "F");

      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text("RECORDS COUNT", 18, 75);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12.5);
      doc.setFont("helvetica", "bold");
      doc.text(`${filteredBills.length} Obligations`, 18, 85);

      // Card 2: TOTAL VALUE
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(76, 68, 58, 24, 3, 3, "FD");

      doc.setFillColor(52, 211, 153); // Green
      doc.rect(76, 68, 1.5, 24, "F");

      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text("AGGREGATED VALUE", 80, 75);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(10.5);
      doc.setFont("helvetica", "bold");
      doc.text(totalString || "0.00 EGP", 80, 84);

      // Card 3: FILTER CONTROLS
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(138, 68, 58, 24, 3, 3, "FD");

      doc.setFillColor(248, 113, 113); // Red
      doc.rect(138, 68, 1.5, 24, "F");

      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text("ACTIVE FILTER CONTROLS", 142, 75);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(`Status: ${statusFilter}`, 142, 82);
      doc.text(`Type/Branch: ${typeFilter}/${branchFilter}`, 142, 87);
      
      // Sort bills ascending by Due Date
      const sortedBills = [...filteredBills].sort((a, b) => {
        const dateA = new Date(a.dueDate).getTime();
        const dateB = new Date(b.dueDate).getTime();
        return dateA - dateB;
      });

      // Build Table column definitions & mapping rows
      const tableColumn = ["Provider", "Service Type", "Amount", "Currency", "Due Date", "Status", "Account Number", "Branch"];
      const tableRows = sortedBills.map(bill => [
        bill.provider,
        bill.serviceType,
        bill.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        bill.currency,
        bill.dueDate,
        bill.status,
        bill.accountNumber || "N/A",
        bill.branchName || "N/A"
      ]);

      // Render the table beautifully using autoTable
      // @ts-ignore
      autoTable(doc, {
        startY: 105,
        margin: { top: 20, bottom: 25, left: 14, right: 14 },
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: { 
          fillColor: [15, 23, 42], // Match dark header slate
          textColor: [255, 255, 255],
          fontSize: 8.5,
          fontStyle: 'bold',
          valign: 'middle'
        },
        styles: { 
          fontSize: 7.5,
          cellPadding: 3,
          textColor: [50, 55, 65],
          valign: 'middle'
        },
        columnStyles: {
          2: { halign: 'right' }, // Right align amount column
          3: { halign: 'center' },
          4: { halign: 'center' },
          5: { halign: 'center' },
          6: { halign: 'center' },
          7: { halign: 'left' }
        },
        didParseCell: function(data) {
          if (data.section === 'body' && data.column.index === 5) {
            const status = data.cell.raw;
            if (status === 'Paid') {
              data.cell.styles.textColor = [16, 124, 65]; // Green
              data.cell.styles.fontStyle = 'bold';
            } else if (status === 'Overdue') {
              data.cell.styles.textColor = [220, 53, 69]; // Red
              data.cell.styles.fontStyle = 'bold';
            } else if (status === 'Pending' || status === 'Unpaid') {
              data.cell.styles.textColor = [217, 119, 6]; // Darker amber
              data.cell.styles.fontStyle = 'bold';
            }
          }
        }
      });

      // Simple footer with dynamic page counts
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // Slate 400
        doc.setFont("helvetica", "normal");
        
        // Horizontal rule above footer
        doc.setDrawColor(241, 245, 249);
        doc.setLineWidth(0.2);
        doc.line(14, 280, 196, 280);

        doc.text("The report was prepared by the IT department.", 14, 286);
        doc.text(`Page ${i} of ${pageCount}`, 196, 286, { align: 'right' });
      }

      doc.save(`IT_Department_Filtered_Statement_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("Failed to generate PDF export:", error);
    }
  };

  const categories = ["All", "Paid", "Unpaid", "Pending", "Draft", "Overdue"];
  const serviceFilters = ["All", "Internet", "Landline", "Mobile"];
  const branchOptions = ["All", ...Array.from(new Set(bills.map(b => b.branchName).filter(Boolean))) as string[]];
  const recurringOptions = ["All", "Recurring", "One-off"];
  const dateRangeOptions = ["All", "30 Days", "90 Days", "This Year", "Custom"];

  const getTranslatedLabel = (key: string) => {
    const translationKey = key.toLowerCase().replace(/ /g, "_").replace(/-/g, "_");
    // @ts-ignore
    return t[translationKey] || key;
  };

  const filteredBills = bills.filter(bill => {
    const matchesSearch = searchTarget === "provider" 
      ? bill.provider.toLowerCase().includes(search.toLowerCase())
      : (bill.accountNumber || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || bill.status === statusFilter;
    const matchesType = typeFilter === "All" || bill.serviceType === typeFilter;
    const matchesBranch = branchFilter === "All" || bill.branchName === branchFilter;
    
    let matchesRecurring = true;
    if (recurringFilter === "Recurring") matchesRecurring = bill.recurring === true;
    if (recurringFilter === "One-off") matchesRecurring = bill.recurring === false;

    let matchesDate = true;
    const billDate = new Date(bill.dueDate);
    const today = new Date();

    if (dateRangeType === "30 Days") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      matchesDate = billDate >= thirtyDaysAgo && billDate <= today;
    } else if (dateRangeType === "90 Days") {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(today.getDate() - 90);
      matchesDate = billDate >= ninetyDaysAgo && billDate <= today;
    } else if (dateRangeType === "This Year") {
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      matchesDate = billDate >= startOfYear && billDate <= today;
    } else if (dateRangeType === "Custom") {
      if (customRange.start && customRange.end) {
        const start = new Date(customRange.start);
        const end = new Date(customRange.end);
        matchesDate = billDate >= start && billDate <= end;
      }
    }

    return matchesSearch && matchesStatus && matchesType && matchesBranch && matchesRecurring && matchesDate;
  });

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setImportStatus({ type: 'error', message: language === "AR" ? 'يرجى تحميل ملف CSV صالح.' : 'Please upload a valid CSV file.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        // Skip header if present
        const startIdx = lines[0].toLowerCase().includes('provider') ? 1 : 0;
        const newBills: Bill[] = [];

        for (let i = startIdx; i < lines.length; i++) {
          const columns = lines[i].split(',').map(col => col.trim());
          if (columns.length < 5) continue;

          // Expecting: Provider, Type(Internet/Landline/etc), Amount, Currency, DueDate(YYYY-MM-DD), Status(Optional), Branch(Optional)
          const [provider, serviceType, amount, currency, dueDate, status, branchName] = columns;

          newBills.push({
            id: `imported-${Date.now()}-${i}`,
            provider,
            serviceType: (serviceType as UtilityType) || "Internet",
            amount: parseFloat(amount) || 0,
            currency: currency || "EGP",
            dueDate: dueDate || new Date().toISOString().split('T')[0],
            status: (status as BillStatus) || "Unpaid",
            branchName: branchName || undefined
          });
        }

        if (newBills.length > 0) {
          setBills(prev => [...newBills, ...prev]);
          setImportStatus({ type: 'success', message: language === "AR" ? `تم استيراد ${newBills.length} سجل بنجاح.` : `Successfully imported ${newBills.length} records.` });
        } else {
          setImportStatus({ type: 'error', message: language === "AR" ? 'لم يتم العثور على بيانات صالحة في ملف CSV.' : 'No valid data found in CSV.' });
        }
      } catch (err) {
        setImportStatus({ type: 'error', message: language === "AR" ? 'فشل تحليل ملف CSV.' : 'Failed to parse CSV file.' });
      }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = '';
  };

  const handleDeleteBill = (id: string) => {
    const bill = bills.find(b => b.id === id);
    if (bill) setBillToDelete(bill);
  };

  const confirmDelete = (id: string) => {
    setBills(prev => prev.filter(b => b.id !== id));
    setBillToDelete(null);
  };

  const handleUpdateBill = (updatedBill: Bill) => {
    setBills(prev => prev.map(b => b.id === updatedBill.id ? updatedBill : b));
    if (selectedBill?.id === updatedBill.id) {
      setSelectedBill(updatedBill);
    }
  };

  const handleMarkPaid = (id: string) => {
    const targetBill = bills.find(b => b.id === id);
    if (!targetBill) return;

    const updatedBills = bills.map(b => b.id === id ? { ...b, status: "Paid" as const } : b);

    if (targetBill.recurring) {
      const currentDate = new Date(targetBill.dueDate);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const day = currentDate.getDate();

      let monthsToAdd = 1;
      if (targetBill.frequency === "Quarterly") {
        monthsToAdd = 3;
      } else if (targetBill.frequency === "Annually") {
        monthsToAdd = 12;
      }

      let nextYear = year;
      let nextMonth = month + monthsToAdd;
      while (nextMonth > 11) {
        nextMonth -= 12;
        nextYear += 1;
      }

      const maxDaysInNextMonth = new Date(nextYear, nextMonth + 1, 0).getDate();
      const clampedDay = Math.min(day, maxDaysInNextMonth);

      const nextDate = new Date(nextYear, nextMonth, clampedDay);

      if (targetBill.serviceType === "Internet") {
        let daysToSubtract = 0;
        for (let i = 0; i < monthsToAdd; i++) {
          let checkMonth = month + i;
          let checkYear = year;
          while (checkMonth > 11) {
            checkMonth -= 12;
            checkYear += 1;
          }
          const daysInCheckMonth = new Date(checkYear, checkMonth + 1, 0).getDate();
          if (daysInCheckMonth === 31) {
            daysToSubtract += 1;
          }
        }
        nextDate.setDate(nextDate.getDate() - daysToSubtract);
      }

      const yyyy = nextDate.getFullYear();
      const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
      const dd = String(nextDate.getDate()).padStart(2, '0');
      const nextDueDateStr = `${yyyy}-${mm}-${dd}`;

      const newNextMonthBill: Bill = {
        ...targetBill,
        id: `recurring-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        dueDate: nextDueDateStr,
        status: "Unpaid" as const,
      };

      setBills([newNextMonthBill, ...updatedBills]);
    } else {
      setBills(updatedBills);
    }
  };

  return (
    <motion.main 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="mt-8 px-4 max-w-4xl mx-auto pb-32"
    >
      {/* Header with technical label */}
      <motion.div variants={itemVariants} className="flex flex-col gap-2 blueprint-header -mx-4 px-4 mb-8">
        <div className="flex items-center justify-between">
          <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface">{t.bills}</h1>
          <div className="flex flex-col items-end">
            <span className="technical-label">{t.ledger_status || "Ledger Status"}</span>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-[10px] font-mono font-bold text-primary uppercase">Active Database</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search and Filter Section */}
      <motion.section variants={itemVariants} className="mb-10 flex flex-col gap-6">
        <div className="flex flex-col gap-4 bg-surface-container-low/40 p-5 rounded-3xl border border-outline/50 bill-card-shadow">
          <div className="flex items-center justify-between px-1">
            <span className="technical-label opacity-60 italic">{t.search_by}</span>
            <div className="flex bg-surface-container-high/60 backdrop-blur-sm rounded-xl p-1 border border-white/5">
              <button 
                onClick={() => setSearchTarget("provider")}
                className={cn(
                  "px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all duration-300",
                  searchTarget === "provider" 
                    ? "bg-primary text-on-primary shadow-lg shadow-primary/20 scale-105" 
                    : "text-on-surface-variant/40 hover:text-on-surface-variant"
                )}
              >
                {t.provider}
              </button>
              <button 
                onClick={() => setSearchTarget("account")}
                className={cn(
                  "px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all duration-300",
                  searchTarget === "account" 
                    ? "bg-primary text-on-primary shadow-lg shadow-primary/20 scale-105" 
                    : "text-on-surface-variant/40 hover:text-on-surface-variant"
                )}
              >
                {t.account_number}
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative group flex-1">
              <div className="absolute inset-y-0 start-5 flex items-center pointer-events-none text-on-surface-variant/40 group-focus-within:text-primary transition-all group-focus-within:scale-110">
                <Search size={18} strokeWidth={2.5} />
              </div>
              <input 
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-surface/40 border border-outline rounded-2xl py-4.5 ps-14 pe-5 font-sans text-on-surface focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/20 shadow-inner"
                placeholder={searchTarget === "provider" ? t.search_placeholder : (language === "AR" ? "البحث برقم الحساب..." : "Search by account number...")}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 bg-surface-container-low/40 p-6 rounded-3xl border border-outline/50 bill-card-shadow">
          <div className="flex items-center justify-between border-b border-outline/30 pb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={14} className="text-primary" />
              <span className="font-sans font-bold text-[13px] tracking-tight text-on-surface">
                {language === "AR" ? "تصفية السجلات" : "Filter Records"}
              </span>
            </div>
            
            {/* Clear Filters Button (Shows only if any filter is active) */}
            {(statusFilter !== "All" || typeFilter !== "All" || branchFilter !== "All" || recurringFilter !== "All" || dateRangeType !== "All") && (
              <button
                onClick={() => {
                  setStatusFilter("All");
                  setTypeFilter("All");
                  setBranchFilter("All");
                  setRecurringFilter("All");
                  setDateRangeType("All");
                  setCustomRange({ start: "", end: "" });
                }}
                className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary hover:text-primary/80 transition-colors"
              >
                {language === "AR" ? "إعادة تعيين" : "Reset Filters"}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div className="space-y-1.5">
              <label className="block font-mono text-[9px] font-bold text-on-surface-variant/60 uppercase tracking-widest">
                {t.status}
              </label>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-surface/40 border border-outline rounded-xl py-3 px-4 pr-10 text-xs font-sans font-semibold text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none cursor-pointer transition-all appearance-none"
                  style={{ direction: language === "AR" ? "rtl" : "ltr" }}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat} className="bg-[#11151C] text-on-surface">
                      {getTranslatedLabel(cat)}
                    </option>
                  ))}
                </select>
                <div className={cn("absolute inset-y-0 flex items-center pointer-events-none text-on-surface-variant/40", language === "AR" ? "left-3" : "right-3")}>
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>

            {/* Asset/Service Filter */}
            <div className="space-y-1.5">
              <label className="block font-mono text-[9px] font-bold text-on-surface-variant/60 uppercase tracking-widest">
                {t.asset}
              </label>
              <div className="relative">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full bg-surface/40 border border-outline rounded-xl py-3 px-4 pr-10 text-xs font-sans font-semibold text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none cursor-pointer transition-all appearance-none"
                  style={{ direction: language === "AR" ? "rtl" : "ltr" }}
                >
                  {serviceFilters.map((cat) => (
                    <option key={cat} value={cat} className="bg-[#11151C] text-on-surface">
                      {getTranslatedLabel(cat)}
                    </option>
                  ))}
                </select>
                <div className={cn("absolute inset-y-0 flex items-center pointer-events-none text-on-surface-variant/40", language === "AR" ? "left-3" : "right-3")}>
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>

            {/* Branch Filter */}
            <div className="space-y-1.5">
              <label className="block font-mono text-[9px] font-bold text-on-surface-variant/60 uppercase tracking-widest">
                {t.branch}
              </label>
              <div className="relative">
                <select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="w-full bg-surface/40 border border-outline rounded-xl py-3 px-4 pr-10 text-xs font-sans font-semibold text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none cursor-pointer transition-all appearance-none"
                  style={{ direction: language === "AR" ? "rtl" : "ltr" }}
                >
                  {branchOptions.map((opt) => (
                    <option key={opt} value={opt} className="bg-[#11151C] text-on-surface">
                      {opt === "All" ? getTranslatedLabel(opt) : opt}
                    </option>
                  ))}
                </select>
                <div className={cn("absolute inset-y-0 flex items-center pointer-events-none text-on-surface-variant/40", language === "AR" ? "left-3" : "right-3")}>
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>

            {/* Obligation Type Filter (Recurring vs One-off) */}
            <div className="space-y-1.5">
              <label className="block font-mono text-[9px] font-bold text-on-surface-variant/60 uppercase tracking-widest">
                {language === "AR" ? "نوع الالتزام" : "Obligation Type"}
              </label>
              <div className="relative">
                <select
                  value={recurringFilter}
                  onChange={(e) => setRecurringFilter(e.target.value)}
                  className="w-full bg-surface/40 border border-outline rounded-xl py-3 px-4 pr-10 text-xs font-sans font-semibold text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none cursor-pointer transition-all appearance-none"
                  style={{ direction: language === "AR" ? "rtl" : "ltr" }}
                >
                  {recurringOptions.map((opt) => (
                    <option key={opt} value={opt} className="bg-[#11151C] text-on-surface">
                      {getTranslatedLabel(opt)}
                    </option>
                  ))}
                </select>
                <div className={cn("absolute inset-y-0 flex items-center pointer-events-none text-on-surface-variant/40", language === "AR" ? "left-3" : "right-3")}>
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>

            {/* Period Filter */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block font-mono text-[9px] font-bold text-on-surface-variant/60 uppercase tracking-widest">
                {t.period}
              </label>
              <div className="relative">
                <select
                  value={dateRangeType}
                  onChange={(e) => setDateRangeType(e.target.value)}
                  className="w-full bg-surface/40 border border-outline rounded-xl py-3 px-4 pr-10 text-xs font-sans font-semibold text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none cursor-pointer transition-all appearance-none"
                  style={{ direction: language === "AR" ? "rtl" : "ltr" }}
                >
                  {dateRangeOptions.map((opt) => (
                    <option key={opt} value={opt} className="bg-[#11151C] text-on-surface">
                      {getTranslatedLabel(opt)}
                    </option>
                  ))}
                </select>
                <div className={cn("absolute inset-y-0 flex items-center pointer-events-none text-on-surface-variant/40", language === "AR" ? "left-3" : "right-3")}>
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>
          </div>

          {/* Custom Date Range Picker */}
          {dateRangeType === "Custom" && (
            <div className="flex flex-col sm:flex-row gap-4 bg-surface-container-highest/10 p-4 rounded-3xl border border-outline/30 animate-in fade-in slide-in-from-right-4 duration-300 w-full">
              <div className="flex-1 flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.15em] opacity-60 px-1">{t.from}</span>
                <DatePicker 
                  value={customRange.start || new Date().toISOString().split('T')[0]}
                  onChange={(val) => setCustomRange(prev => ({ ...prev, start: val }))}
                  language={language}
                  name="startDate"
                />
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.15em] opacity-60 px-1">{t.to}</span>
                <DatePicker 
                  value={customRange.end || new Date().toISOString().split('T')[0]}
                  onChange={(val) => setCustomRange(prev => ({ ...prev, end: val }))}
                  language={language}
                  name="endDate"
                />
              </div>
            </div>
          )}
        </div>
      </motion.section>

      {/* Bill Cards List */}
      <motion.div variants={itemVariants} className="space-y-6">
        <div className="flex items-center justify-between px-1 mb-2">
           <div className="flex flex-col">
              <h2 className="text-[12px] font-bold text-on-surface font-headline tracking-tight">{t.showing} {filteredBills.length} {t.records}</h2>
              <span className="technical-label !opacity-40">System-wide Audit</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${(filteredBills.length / bills.length) * 100}%` }} />
              </div>
           </div>
        </div>
        <div className="space-y-4">
          {filteredBills.map(bill => (
            <BillListItem 
              key={bill.id} 
              bill={bill} 
              onDelete={handleDeleteBill} 
              onViewDetails={setSelectedBill} 
              onEdit={handleEditBill}
              onMarkPaid={handleMarkPaid} 
              language={language} 
            />
          ))}
        </div>
        {filteredBills.length === 0 && (
          <div className="py-24 text-center card bg-surface-container-low/20 border-dashed flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant/20">
              <FileText size={32} />
            </div>
            <p className="font-mono text-sm text-on-surface-variant/40 italic font-bold tracking-tight uppercase">{t.no_records}</p>
          </div>
        )}
      </motion.div>

      {/* Detail Overlay */}
      <BillDetailModal 
        bill={selectedBill} 
        onClose={() => {
          setSelectedBill(null);
          setIsEditingSelected(false);
        }} 
        onUpdate={handleUpdateBill}
        language={language}
        initialEditMode={isEditingSelected}
      />

      {/* Delete Confirmation Overlay */}
      <DeleteConfirmationModal 
        bill={billToDelete}
        onConfirm={confirmDelete}
        onCancel={() => setBillToDelete(null)}
        language={language}
      />

      {/* Export Actions - Technical Style */}
      <motion.div variants={itemVariants} className="mt-16 pt-8 border-t border-outline/30 flex flex-col sm:flex-row justify-center gap-6">
        <button 
          onClick={handlePrint}
          className="group flex items-center gap-4 px-10 py-4.5 border border-outline rounded-2xl font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-on-surface hover:bg-primary hover:text-on-primary hover:border-primary transition-all duration-300 active:scale-95 bill-card-shadow"
        >
          <FileText size={18} className="group-hover:scale-110 transition-transform" />
          {t.print_pdf}
        </button>
        <button 
          onClick={handleSaveCSV}
          className="group flex items-center gap-4 px-10 py-4.5 border border-outline rounded-2xl font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-on-surface hover:bg-tertiary hover:text-on-tertiary hover:border-tertiary transition-all duration-300 active:scale-95 bill-card-shadow"
        >
          <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />
          {t.save_csv}
        </button>
      </motion.div>
    </motion.main>
  );
};
