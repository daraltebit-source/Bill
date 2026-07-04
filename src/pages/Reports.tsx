import React from "react";
import { 
  Wallet, 
  TrendingUp, 
  FileText, 
  Download, 
  List, 
  Globe, 
  Smartphone, 
  Bolt, 
  Droplets, 
  ArrowUpRight, 
  ArrowDownRight, 
  Loader2, 
  CheckCircle2,
  Calendar,
  Activity,
  Percent,
  CheckCircle,
  Clock
} from "lucide-react";
import { cn } from "../lib/utils";
import { Bill } from "../types";
import { translations, Language } from "../translations";
import { ComparisonChart } from "../components/ComparisonChart";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { motion, AnimatePresence } from "motion/react";

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

export const Reports: React.FC<{ bills: Bill[]; language: Language }> = ({ bills, language }) => {
  const t = translations[language];
  const [isExportingPDF, setIsExportingPDF] = React.useState(false);
  const [isExportingXLSX, setIsExportingXLSX] = React.useState(false);
  const [showToast, setShowToast] = React.useState<{ show: boolean, message: string }>({ show: false, message: "" });

  const triggerToast = (message: string) => {
    setShowToast({ show: true, message });
    setTimeout(() => setShowToast({ show: false, message: "" }), 3000);
  };

  // 1. DYNAMIC CALCULATIONS
  const dynamicProjectedTotal = React.useMemo(() => {
    const unpaid = bills.filter(b => b.status !== "Paid").reduce((acc, curr) => acc + curr.amount, 0);
    return unpaid > 0 ? unpaid : 0;
  }, [bills]);

  const uniqueYears = React.useMemo(() => {
    const years = Array.from(new Set(bills.map(b => {
      const d = new Date(b.dueDate);
      return isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();
    }))) as number[];
    const sortedYears = [...years].sort((a, b) => b - a);
    return sortedYears.length > 0 ? sortedYears : [new Date().getFullYear()];
  }, [bills]);

  const [selectedReportYear, setSelectedReportYear] = React.useState<number>(() => {
    return uniqueYears[0];
  });

  const [reportTab, setReportTab] = React.useState<"monthly" | "annual">("monthly");

  // Dynamic Monthly Payments Grouping
  const monthlyData = React.useMemo(() => {
    const months = [
      { key: 0, nameEn: "January", nameAr: "يناير" },
      { key: 1, nameEn: "February", nameAr: "فبراير" },
      { key: 2, nameEn: "March", nameAr: "مارس" },
      { key: 3, nameEn: "April", nameAr: "أبريل" },
      { key: 4, nameEn: "May", nameAr: "مايو" },
      { key: 5, nameEn: "June", nameAr: "يونيو" },
      { key: 6, nameEn: "July", nameAr: "يوليو" },
      { key: 7, nameEn: "August", nameAr: "أغسطس" },
      { key: 8, nameEn: "September", nameAr: "سبتمبر" },
      { key: 9, nameEn: "October", nameAr: "أكتوبر" },
      { key: 10, nameEn: "November", nameAr: "نوفمبر" },
      { key: 11, nameEn: "December", nameAr: "ديسمبر" }
    ];

    return months.map(m => {
      const monthlyBills = bills.filter(b => {
        const d = new Date(b.dueDate);
        return !isNaN(d.getTime()) && d.getFullYear() === selectedReportYear && d.getMonth() === m.key;
      });

      const paid = monthlyBills.filter(b => b.status === "Paid").reduce((sum, b) => sum + b.amount, 0);
      const unpaid = monthlyBills.filter(b => b.status !== "Paid").reduce((sum, b) => sum + b.amount, 0);
      const total = paid + unpaid;

      return {
        ...m,
        name: language === "AR" ? m.nameAr : m.nameEn,
        paid,
        unpaid,
        total,
        count: monthlyBills.length
      };
    });
  }, [bills, selectedReportYear, language]);

  // Dynamic Annual Payments Grouping
  const annualData = React.useMemo(() => {
    return uniqueYears.map(yr => {
      const annualBills = bills.filter(b => {
        const d = new Date(b.dueDate);
        return !isNaN(d.getTime()) && d.getFullYear() === yr;
      });

      const paid = annualBills.filter(b => b.status === "Paid").reduce((sum, b) => sum + b.amount, 0);
      const unpaid = annualBills.filter(b => b.status !== "Paid").reduce((sum, b) => sum + b.amount, 0);
      const total = paid + unpaid;

      return {
        year: yr,
        paid,
        unpaid,
        total,
        count: annualBills.length
      };
    });
  }, [bills, uniqueYears]);

  // Dynamic Overall Payments Statistics
  const reportStats = React.useMemo(() => {
    const paidAll = bills.filter(b => b.status === "Paid").reduce((sum, b) => sum + b.amount, 0);
    const unpaidAll = bills.filter(b => b.status !== "Paid").reduce((sum, b) => sum + b.amount, 0);
    const totalAll = paidAll + unpaidAll;
    const rate = totalAll > 0 ? (paidAll / totalAll) * 100 : 0;

    return {
      paidAll,
      unpaidAll,
      totalAll,
      rate
    };
  }, [bills]);

  // Dynamic Highest Surge & Best Savings
  const categoryTrends = React.useMemo(() => {
    const categories: Record<string, number[]> = {};
    bills.forEach(b => {
      if (!categories[b.serviceType]) {
        categories[b.serviceType] = [];
      }
      categories[b.serviceType].push(b.amount);
    });

    const trends = Object.keys(categories).map(cat => {
      const list = categories[cat];
      const avg = list.reduce((sum, val) => sum + val, 0) / list.length;
      return { category: cat, average: avg, list };
    });

    return trends;
  }, [bills]);

  // Dynamic Highest Surge & Best Savings Deltas
  const deltaTrends = React.useMemo(() => {
    const categories = ["Internet", "Landline", "Mobile", "Water", "Electricity"];
    let highestSurge = { category: "N/A", change: 0, amount: 0 };
    let bestSavings = { category: "N/A", change: 0, amount: 0 };
    
    let maxSurge = -Infinity;
    let maxSavings = Infinity;
    
    categories.forEach(cat => {
      const catBills = bills
        .filter(b => b.serviceType.toLowerCase() === cat.toLowerCase())
        .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
        
      if (catBills.length >= 2) {
        const current = catBills[0].amount;
        const previous = catBills[1].amount;
        if (previous > 0) {
          const change = ((current - previous) / previous) * 100;
          if (change > 0 && change > maxSurge) {
            maxSurge = change;
            highestSurge = { category: cat, change, amount: current };
          }
          if (change < 0 && change < maxSavings) {
            maxSavings = change;
            bestSavings = { category: cat, change: Math.abs(change), amount: current };
          }
        }
      }
    });
    
    return {
      highestSurge: maxSurge !== -Infinity ? highestSurge : null,
      bestSavings: maxSavings !== Infinity ? bestSavings : null
    };
  }, [bills]);

  const exportToPDF = async () => {
    setIsExportingPDF(true);
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
      doc.text("Strategic Expenditure & Compliance Statement", 14, 29);

      // Metas
      doc.setFontSize(8.5);
      doc.setTextColor(148, 163, 184); // Slate 400
      doc.text(`STATEMENT PERIOD: Q4 COMPLIANCE WINDOW`, 14, 38);
      
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
      doc.text("EXECUTIVE PERFORMANCE ANALYSIS", 14, 62);

      // Draw the beautiful 3 KPI Cards!
      // Card 1: TOTAL SETTLED (PAID)
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, 68, 58, 24, 3, 3, "FD");
      
      // Little accent colored line on the left border of the card
      doc.setFillColor(52, 211, 153); // Tertiary / green
      doc.rect(14, 68, 1.5, 24, "F");

      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text("TOTAL DISBURSED (PAID)", 18, 75);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11.5);
      doc.setFont("helvetica", "bold");
      doc.text(`${reportStats.paidAll.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP`, 18, 84);

      // Card 2: NET LIABILITY (UNPAID)
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(76, 68, 58, 24, 3, 3, "FD");

      // Little accent colored line on the left border of the card
      doc.setFillColor(248, 113, 113); // Red / error
      doc.rect(76, 68, 1.5, 24, "F");

      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text("NET LIABILITY (UNPAID)", 80, 75);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11.5);
      doc.setFont("helvetica", "bold");
      doc.text(`${reportStats.unpaidAll.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP`, 80, 84);

      // Card 3: SETTLEMENT EFFICIENCY
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(138, 68, 58, 24, 3, 3, "FD");

      // Little accent colored line on the left border of the card
      doc.setFillColor(129, 140, 248); // Indigo / primary
      doc.rect(138, 68, 1.5, 24, "F");

      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text("SETTLEMENT EFFICIENCY", 142, 75);

      doc.setTextColor(129, 140, 248); // Styled with primary indigo
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text(`${reportStats.rate.toFixed(1)}%`, 142, 84);

      // 3. Detailed Obligations Ledger header
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.text("DETAILED OBLIGATIONS LEDGER (DUE DATE ASCENDING)", 14, 105);

      const tableColumn = ["Provider", "Branch Office", "Service Type", "Amount", "Currency", "Due Date", "Status"];
      const sortedBills = [...bills].sort((a, b) => {
        const dateA = new Date(a.dueDate).getTime();
        const dateB = new Date(b.dueDate).getTime();
        return dateA - dateB;
      });
      const tableRows = sortedBills.map(bill => [
        bill.provider,
        bill.branchName || "Main Office",
        bill.serviceType,
        bill.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        bill.currency,
        bill.dueDate,
        bill.status
      ]);

      // Render the table using autoTable
      // @ts-ignore
      autoTable(doc, {
        startY: 110,
        margin: { top: 20, bottom: 25, left: 14, right: 14 },
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: { 
          fillColor: [15, 23, 42], // Match dark header slate
          textColor: [255, 255, 255], 
          fontStyle: 'bold',
          fontSize: 8.5,
          valign: 'middle'
        },
        styles: { 
          fontSize: 8, 
          cellPadding: 3.5, 
          textColor: [50, 55, 65],
          valign: 'middle'
        },
        columnStyles: {
          3: { halign: 'right' }, 
          4: { halign: 'center' },
          5: { halign: 'center' },
          6: { halign: 'center' }
        },
        didParseCell: function(data) {
          if (data.section === 'body' && data.column.index === 6) {
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

      // Footer with page numbering
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

      doc.save("IT_Department_Expenditure_Report.pdf");
      triggerToast("PDF Statement Downloaded Successfully");
    } catch (error) {
      console.error("PDF Export failed:", error);
      triggerToast("An error occurred during PDF generation");
    } finally {
      setIsExportingPDF(false);
    }
  };

  const exportToXLSX = () => {
    setIsExportingXLSX(true);
    try {
      const data = bills.map(bill => ({
        Provider: bill.provider,
        Branch: bill.branchName || "N/A",
        "Service Type": bill.serviceType,
        "Amount": bill.amount,
        "Currency": bill.currency,
        "Due Date": bill.dueDate,
        "Status": bill.status
      }));

      const summaryData = [
        { Metric: "Total Paid", Value: reportStats.paidAll, Currency: "EGP" },
        { Metric: "Total Unpaid", Value: reportStats.unpaidAll, Currency: "EGP" },
        { Metric: "Settlement Efficiency (%)", Value: reportStats.rate.toFixed(2), Currency: "" },
        { Metric: "Total active lines", Value: bills.length, Currency: "" }
      ];

      const workbook = XLSX.utils.book_new();
      
      const worksheetBills = XLSX.utils.json_to_sheet(data);
      const worksheetSummary = XLSX.utils.json_to_sheet(summaryData);

      XLSX.utils.book_append_sheet(workbook, worksheetSummary, "Executive Summary");
      XLSX.utils.book_append_sheet(workbook, worksheetBills, "Detailed Ledger");

      XLSX.writeFile(workbook, "IT_Ledger_Export.xlsx");
      triggerToast("Excel Ledger Downloaded Successfully");
    } catch (error) {
      console.error("XLSX Export failed:", error);
      triggerToast("An error occurred during Excel generation");
    } finally {
      setIsExportingXLSX(false);
    }
  };

  return (
    <motion.main 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 space-y-10 pb-32"
    >
      
      {/* 2. HEADER SECTION - IMPROVED APPEARANCE */}
      <motion.div variants={itemVariants} className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-on-surface uppercase italic flex items-center gap-3">
              <Activity className="text-primary animate-pulse" size={32} />
              {t.projection_metrics}
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="technical-label !text-primary/70 !opacity-100 bg-primary/10 px-2.5 py-0.5 rounded-md">Ledger Analytics Engine</span>
              <div className="w-1.5 h-1.5 rounded-full bg-outline opacity-40"></div>
              <span className="technical-label !text-tertiary">Real-time DB Feed</span>
            </div>
          </div>
          <div className="bg-surface-container-high/60 backdrop-blur-md px-5 py-2.5 rounded-2xl font-mono text-xs font-bold uppercase tracking-widest border border-white/5 shadow-lg text-primary self-start sm:self-auto">
            FY2026 AUDIT CYCLE
          </div>
        </div>
        <p className="font-sans text-on-surface-variant text-sm leading-relaxed max-w-2xl opacity-80">
          {t.projection_desc}
        </p>
      </motion.div>

      {/* 3. CORE SUMMARY METRICS GAUGE (AESTHETIC UPGRADE) */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Settled Card */}
        <div className="bg-gradient-to-br from-surface-container/80 to-surface-container-low/40 border border-outline-variant/60 rounded-[2rem] p-8 relative overflow-hidden shadow-xl hover:border-tertiary/20 transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-tertiary/10 rounded-full blur-[40px] -mr-16 -mt-16 group-hover:bg-tertiary/20 transition-all" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="technical-label !text-tertiary">{t.total_paid}</span>
              <div className="w-10 h-10 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary border border-tertiary/20 shadow-inner">
                <CheckCircle size={20} />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="font-display text-3xl font-extrabold text-on-surface tracking-tight">
                {reportStats.paidAll.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-[10px] font-mono text-on-surface-variant font-bold uppercase tracking-wider">{t.egp} • ALL-TIME DISBURSED</p>
            </div>
          </div>
        </div>

        {/* Total Liability Card */}
        <div className="bg-gradient-to-br from-surface-container/80 to-surface-container-low/40 border border-outline-variant/60 rounded-[2rem] p-8 relative overflow-hidden shadow-xl hover:border-error/20 transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-error/10 rounded-full blur-[40px] -mr-16 -mt-16 group-hover:bg-error/20 transition-all" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="technical-label !text-error/80">{t.unpaid_outstanding}</span>
              <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center text-error border border-error/20 shadow-inner">
                <Clock size={20} />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="font-display text-3xl font-extrabold text-on-surface tracking-tight">
                {dynamicProjectedTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-[10px] font-mono text-on-surface-variant font-bold uppercase tracking-wider">{t.egp} • PENDING CLEARANCE</p>
            </div>
          </div>
        </div>

        {/* Settlement Efficiency Card */}
        <div className="bg-gradient-to-br from-surface-container/80 to-surface-container-low/40 border border-outline-variant/60 rounded-[2rem] p-8 relative overflow-hidden shadow-xl hover:border-primary/20 transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[40px] -mr-16 -mt-16 group-hover:bg-primary/20 transition-all" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="technical-label !text-primary">{t.settlement_rate}</span>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                <Percent size={18} />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="font-display text-3xl font-extrabold text-on-surface tracking-tight">
                {reportStats.rate.toFixed(1)}%
              </h3>
              <p className="text-[10px] font-mono text-on-surface-variant font-bold uppercase tracking-wider">PORTFOLIO CLEARANCE RATIO</p>
            </div>
          </div>
        </div>

      </motion.div>

      {/* 4. THE PAYMENTS STATUS REPORT (ANNUALLY OR MONTHLY) - CORE NEW FEATURE */}
      <motion.section variants={itemVariants} className="bg-surface-container-low/60 border border-outline rounded-[2.5rem] p-6 sm:p-10 shadow-2xl space-y-8 relative overflow-hidden">
        <div className="absolute -right-32 -bottom-32 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        
        {/* Section Header with bilingual toggle */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-outline-variant/60">
          <div className="space-y-1">
            <h3 className="font-display text-xl sm:text-2xl font-bold text-on-surface flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_12px_rgba(99,102,241,0.6)] animate-pulse" />
              {t.payments_report}
            </h3>
            <p className="text-xs text-on-surface-variant font-sans font-medium">
              {reportTab === "monthly" ? t.monthly_overview : t.annual_overview}
            </p>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            {/* Year filter (Only visible in Monthly tab) */}
            {reportTab === "monthly" && (
              <div className="flex items-center gap-2 bg-surface-container-high/40 px-3 py-1.5 rounded-xl border border-outline-variant">
                <Calendar size={14} className="text-on-surface-variant" />
                <select
                  value={selectedReportYear}
                  onChange={(e) => setSelectedReportYear(parseInt(e.target.value))}
                  className="bg-transparent text-xs font-mono font-bold text-on-surface outline-none cursor-pointer pr-1"
                >
                  {uniqueYears.map(yr => (
                    <option key={yr} value={yr} className="bg-surface-container-high text-on-surface">{yr}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Monthly / Annual Toggle Switch */}
            <div className="bg-surface-container-highest p-1.5 rounded-2xl flex border border-outline-variant/60">
              <button
                onClick={() => setReportTab("monthly")}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-headline font-bold uppercase tracking-wider transition-all duration-300",
                  reportTab === "monthly"
                    ? "bg-primary text-on-primary shadow-lg shadow-primary/25"
                    : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                {language === "AR" ? "شهري" : "Monthly"}
              </button>
              <button
                onClick={() => setReportTab("annual")}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-headline font-bold uppercase tracking-wider transition-all duration-300",
                  reportTab === "annual"
                    ? "bg-primary text-on-primary shadow-lg shadow-primary/25"
                    : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                {language === "AR" ? "سنوي" : "Annually"}
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Display Grid */}
        <AnimatePresence mode="wait">
          {reportTab === "monthly" ? (
            <motion.div
              key="monthly-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {monthlyData.filter(m => m.total > 0).length === 0 ? (
                <div className="text-center py-16 border border-dashed border-outline-variant/50 rounded-2xl bg-surface/20">
                  <Calendar size={36} className="text-on-surface-variant/40 mx-auto mb-3" />
                  <p className="text-sm text-on-surface-variant/70 font-sans font-semibold">
                    {language === "AR" ? `لا توجد التزامات مسجلة لعام ${selectedReportYear}` : `No records found for year ${selectedReportYear}`}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {monthlyData.filter(m => m.total > 0).map(item => {
                    const paidPercent = item.total > 0 ? (item.paid / item.total) * 100 : 0;
                    const unpaidPercent = item.total > 0 ? (item.unpaid / item.total) * 100 : 0;
                    return (
                      <div key={item.key} className="bg-surface-container-high/30 border border-outline-variant/40 p-5 rounded-3xl hover:border-primary/20 transition-all flex flex-col justify-between space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-display font-black text-on-surface text-base uppercase">{item.name}</h4>
                            <p className="text-[10px] font-mono text-on-surface-variant opacity-60 uppercase">{item.count} {t.records || "Schedules"}</p>
                          </div>
                          <span className="font-mono text-[11px] font-black bg-primary/10 px-2.5 py-1 rounded-lg text-primary">
                            {paidPercent.toFixed(0)}% PAID
                          </span>
                        </div>

                        {/* Split progress bar */}
                        <div className="space-y-1.5">
                          <div className="flex h-2 w-full bg-outline-variant/20 rounded-full overflow-hidden">
                            <div className="bg-tertiary h-full transition-all" style={{ width: `${paidPercent}%` }} />
                            <div className="bg-error/80 h-full transition-all" style={{ width: `${unpaidPercent}%` }} />
                          </div>
                          <div className="flex justify-between items-center text-[11px] font-mono font-bold">
                            <span className="text-tertiary">{item.paid.toFixed(0)} EGP</span>
                            <span className="text-error">{item.unpaid.toFixed(0)} EGP</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="annual-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {annualData.map(item => {
                  const paidPercent = item.total > 0 ? (item.paid / item.total) * 100 : 0;
                  const unpaidPercent = item.total > 0 ? (item.unpaid / item.total) * 100 : 0;
                  return (
                    <div key={item.year} className="bg-surface-container-high/30 border border-outline-variant/40 p-5 rounded-3xl hover:border-primary/20 transition-all flex flex-col justify-between space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-display font-black text-on-surface text-lg">{item.year}</h4>
                          <p className="text-[10px] font-mono text-on-surface-variant opacity-60 uppercase">{item.count} {t.records || "Schedules"}</p>
                        </div>
                        <span className="font-mono text-[11px] font-black bg-primary/10 px-2.5 py-1 rounded-lg text-primary">
                          {paidPercent.toFixed(1)}% PAID
                        </span>
                      </div>

                      {/* Split progress bar */}
                      <div className="space-y-1.5">
                        <div className="flex h-2.5 w-full bg-outline-variant/20 rounded-full overflow-hidden">
                          <div className="bg-tertiary h-full transition-all" style={{ width: `${paidPercent}%` }} />
                          <div className="bg-error/80 h-full transition-all" style={{ width: `${unpaidPercent}%` }} />
                        </div>
                        <div className="flex justify-between items-center text-[11px] font-mono font-bold">
                          <span className="text-tertiary">{item.paid.toLocaleString('en-US', { maximumFractionDigits: 0 })} EGP</span>
                          <span className="text-error">{item.unpaid.toLocaleString('en-US', { maximumFractionDigits: 0 })} EGP</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.section>

      {/* 5. SPENDING TRENDS ANALYSIS (Delta graph and summary cards) */}
      <motion.section variants={itemVariants} className="space-y-6">
        <div className="flex items-center gap-4 mb-2">
          <div className="h-px bg-outline/20 flex-1"></div>
          <h3 className="text-[11px] font-black text-on-surface-variant uppercase tracking-[0.3em] flex items-center gap-3 italic bg-surface px-4 py-1.5 rounded-full border border-outline/30">
            <div className="w-2 h-2 rounded-full bg-tertiary shadow-[0_0_10px_rgba(20,255,20,0.5)] animate-pulse" />
            {t.trend_analysis}
          </h3>
          <div className="h-px bg-outline/20 flex-1"></div>
        </div>
        
        <div className="card p-1 pb-4 bg-surface-container-low/40 rounded-[2.5rem] bill-card-shadow">
          <ComparisonChart bills={bills} />
        </div>
        
        {/* Dynamic Trend Summary Chips */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6 border-outline/20 bg-surface-container-low/40 rounded-3xl group relative overflow-hidden flex flex-col justify-between min-h-[160px]">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-150 transition-transform duration-700">
              <ArrowUpRight size={100} />
            </div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <span className="technical-label !text-red-500/80">{t.highest_surge}</span>
              <div className="p-2 rounded-xl bg-red-500/10 text-red-500">
                <ArrowUpRight strokeWidth={3} size={20} />
              </div>
            </div>
            <div>
              <p className="font-headline text-lg sm:text-xl font-bold text-on-surface relative z-10">
                {deltaTrends.highestSurge ? deltaTrends.highestSurge.category.toUpperCase() : "N/A"}{" "}
                <span className="text-red-500 font-black ml-2 animate-pulse">
                  +{deltaTrends.highestSurge ? deltaTrends.highestSurge.change.toFixed(1) : "0.0"}%
                </span>
              </p>
              <p className="text-[10px] font-mono text-on-surface-variant font-bold uppercase tracking-widest mt-2 opacity-40">
                {deltaTrends.highestSurge ? "EXCEEDS BUDGET QUOTA" : "NO SIGNIFICANT SURGE DETECTED"}
              </p>
            </div>
          </div>
          
          <div className="card p-6 border-outline/20 bg-surface-container-low/40 rounded-3xl group relative overflow-hidden flex flex-col justify-between min-h-[160px]">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-150 transition-transform duration-700">
              <ArrowDownRight size={100} />
            </div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <span className="technical-label !text-teal-400">{t.best_savings}</span>
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
                <ArrowDownRight strokeWidth={3} size={20} />
              </div>
            </div>
            <div>
              <p className="font-headline text-lg sm:text-xl font-bold text-on-surface relative z-10">
                {deltaTrends.bestSavings ? deltaTrends.bestSavings.category.toUpperCase() : "N/A"}{" "}
                <span className="text-teal-400 font-black ml-2">
                  -{deltaTrends.bestSavings ? deltaTrends.bestSavings.change.toFixed(1) : "0.0"}%
                </span>
              </p>
              <p className="text-[10px] font-mono text-on-surface-variant font-bold uppercase tracking-widest mt-2 opacity-40">
                {deltaTrends.bestSavings ? "OPTIMIZATION SUCCESS" : "AWAITING EFFICIENCY RECONCILIATION"}
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* 6. CATEGORICAL BREAKDOWN & RE-STYLED LIST */}
      <motion.div variants={itemVariants} className="space-y-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-px bg-outline/20 flex-1"></div>
          <h3 className="text-[11px] font-black text-on-surface-variant uppercase tracking-[0.3em] flex items-center gap-3 italic bg-surface px-4 py-1.5 rounded-full border border-outline/30">
            <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)] animate-pulse" />
            {t.categorical_breakdown}
          </h3>
          <div className="h-px bg-outline/20 flex-1"></div>
        </div>
        
        <div className="space-y-4">
          {bills.slice(0, 5).map((bill) => {
            const Icon = bill.serviceType === "Internet" ? Globe : 
                         bill.serviceType === "Landline" ? Smartphone :
                         bill.serviceType === "Water" ? Droplets : List;
            
            const colorClass = bill.serviceType === "Internet" ? "text-primary border-primary/20" :
                               bill.serviceType === "Landline" ? "text-error border-error/20" :
                               bill.serviceType === "Water" ? "text-cyan-400 border-cyan-400/20" : "text-on-surface-variant border-outline";

            const bgClass = bill.serviceType === "Internet" ? "bg-primary/10" :
                             bill.serviceType === "Landline" ? "bg-error/10" :
                             bill.serviceType === "Water" ? "bg-cyan-400/10" : "bg-surface-container";

            return (
              <div key={bill.id} className="card flex items-center justify-between group hover:border-primary/50 transition-all cursor-default p-6 rounded-3xl bill-card-shadow">
                <div className="flex items-center gap-6">
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border shadow-inner transition-transform group-hover:scale-105", bgClass, colorClass)}>
                    <Icon size={24} strokeWidth={2.5} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-display text-base sm:text-lg font-black text-on-surface tracking-tight uppercase italic">{bill.provider}</h4>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="technical-label bg-surface-container-high px-2 py-0.5 rounded-md">{bill.serviceType.toUpperCase()}</span>
                      <div className="w-1 h-1 rounded-full bg-outline/40"></div>
                      <span className="font-mono text-[11px] text-on-surface-variant font-bold uppercase opacity-70">
                        {new Date(bill.dueDate).toLocaleDateString(language === "AR" ? 'ar-EG' : 'en-US', { month: 'short', day: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-end space-y-1.5">
                  <p className="font-headline text-lg sm:text-xl font-black text-on-surface leading-none tracking-tighter italic">
                    {bill.amount.toFixed(2)} <span className="text-[10px] font-mono opacity-30 uppercase">{t.egp}</span>
                  </p>
                  <span className={cn("text-[9px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-md border", bgClass, colorClass)}>
                    {t[bill.status.toLowerCase() as keyof typeof t] || bill.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* 7. RE-STYLED REPORT ACTION BUTTONS */}
      <motion.div variants={itemVariants} className="pt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
        <button 
          onClick={exportToPDF}
          disabled={isExportingPDF}
          className="h-16 bg-primary text-on-primary rounded-2xl font-headline font-black flex items-center justify-center gap-4 shadow-xl shadow-primary/20 hover:brightness-110 hover:scale-[1.01] active:scale-[0.99] transition-all group border border-white/10 text-sm uppercase italic tracking-[0.1em] disabled:opacity-50"
        >
          {isExportingPDF ? <Loader2 className="animate-spin" size={24} /> : <FileText size={24} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />}
          {t.generate_pdf}
        </button>
        <button 
          onClick={exportToXLSX}
          disabled={isExportingXLSX}
          className="h-16 border border-outline bg-surface-container-high/40 backdrop-blur-md text-on-surface rounded-2xl font-headline font-black flex items-center justify-center gap-4 hover:bg-surface-container-high hover:border-primary/40 hover:scale-[1.01] transition-all active:scale-[0.99] group text-sm uppercase italic tracking-[0.1em] disabled:opacity-50"
        >
          {isExportingXLSX ? <Loader2 className="animate-spin" size={24} /> : <Download size={24} strokeWidth={2.5} className="group-hover:translate-y-1 transition-transform" />}
          {t.download_ledger}
        </button>
      </motion.div>

      {/* 8. SUCCESS TOAST */}
      {showToast.show && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 bg-tertiary text-on-tertiary px-8 py-4 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-4 animate-in zoom-in-95 slide-in-from-bottom-8">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <CheckCircle2 size={20} strokeWidth={3} />
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-[10px] font-black uppercase tracking-[0.2em] opacity-80">System Alert</span>
            <span className="font-headline text-xs font-black uppercase italic tracking-wider">{language === "AR" ? "تم بنجاح" : showToast.message}</span>
          </div>
        </div>
      )}

    </motion.main>
  );
};
