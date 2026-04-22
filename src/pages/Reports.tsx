import React from "react";
import { Wallet, TrendingUp, FileText, Download, List, Globe, Smartphone, Bolt, Droplets, ArrowUpRight, ArrowDownRight, Loader2, CheckCircle2 } from "lucide-react";
import { monthlyExpenses } from "../mockData";
import { cn } from "../lib/utils";
import { Bill } from "../types";
import { translations, Language } from "../translations";
import { ComparisonChart } from "../components/ComparisonChart";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

export const Reports: React.FC<{ bills: Bill[]; language: Language }> = ({ bills, language }) => {
  const t = translations[language];
  const [projectedTotal, setProjectedTotal] = React.useState(2450.00);
  const [isExportingPDF, setIsExportingPDF] = React.useState(false);
  const [isExportingXLSX, setIsExportingXLSX] = React.useState(false);
  const [showToast, setShowToast] = React.useState<{ show: boolean, message: string }>({ show: false, message: "" });

  const triggerToast = (message: string) => {
    setShowToast({ show: true, message });
    setTimeout(() => setShowToast({ show: false, message: "" }), 3000);
  };

  const exportToPDF = () => {
    setIsExportingPDF(true);
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(20, 20, 20);
      doc.text("STRATOS EXPENDITURE REPORT", 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
      
      // Summary Section
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("EXECUTIVE SUMMARY", 14, 40);
      
      doc.setFontSize(11);
      doc.text(`Projected Net Liability: ${projectedTotal.toFixed(2)} EGP`, 14, 50);
      doc.text(`Analysis Window: OCTOBER 2023`, 14, 56);
      
      // Table data
      const tableColumn = ["Provider", "Branch", "Type", "Amount (EGP)", "Due Date", "Status"];
      const tableRows = bills.map(bill => [
        bill.provider,
        bill.branchName || "N/A",
        bill.serviceType,
        bill.amount.toFixed(2),
        bill.dueDate,
        bill.status
      ]);

      // @ts-ignore
      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 65,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
        styles: { fontSize: 9 }
      });

      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Stratos Insight Engine - Internal Compliance Document - Page ${i} of ${pageCount}`, 14, 285);
      }

      doc.save("Stratos_Expenditure_Report.pdf");
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
      // Prepare data
      const data = bills.map(bill => ({
        Provider: bill.provider,
        Branch: bill.branchName || "N/A",
        "Service Type": bill.serviceType,
        "Amount": bill.amount,
        "Currency": bill.currency,
        "Due Date": bill.dueDate,
        "Status": bill.status
      }));

      // Summaries sheet
      const summaryData = [
        { Metric: "Projected Total", Value: projectedTotal, Currency: "EGP" },
        { Metric: "Report Date", Value: "Oct 2023", Currency: "" },
        { Metric: "Total Records", Value: bills.length, Currency: "" }
      ];

      const workbook = XLSX.utils.book_new();
      
      const worksheetBills = XLSX.utils.json_to_sheet(data);
      const worksheetSummary = XLSX.utils.json_to_sheet(summaryData);

      XLSX.utils.book_append_sheet(workbook, worksheetSummary, "Summary");
      XLSX.utils.book_append_sheet(workbook, worksheetBills, "Detailed Obligations");

      XLSX.writeFile(workbook, "Stratos_Ledger_Export.xlsx");
      triggerToast("Excel Ledger Downloaded Successfully");
    } catch (error) {
      console.error("XLSX Export failed:", error);
      triggerToast("An error occurred during Excel generation");
    } finally {
      setIsExportingXLSX(false);
    }
  };
  
  return (
    <main className="max-w-screen-md mx-auto px-4 pt-8 space-y-8 pb-32">
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="font-headline text-[32px] font-bold text-on-surface tracking-tight">Projection Metrics</h2>
          <span className="bg-secondary-container text-on-secondary-container px-4 py-1.5 rounded-lg font-mono text-[11px] font-bold uppercase tracking-widest border border-white/5 shadow-sm">OCT 2023</span>
        </div>
        <p className="font-sans text-on-surface-variant leading-relaxed opacity-80">Predictive analysis for ensuing billing cycles initiated within the Q4 window.</p>
      </div>

      {/* Total Summary Card */}
      <div className="bg-[#11151C] border border-outline p-8 rounded-2xl relative overflow-hidden ring-1 ring-white/5">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl opacity-50"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <span className="font-mono text-[11px] text-on-surface-variant uppercase tracking-[0.2em] font-bold">Projected Net Liability</span>
            <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
               <Wallet size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="font-headline text-[48px] font-bold leading-tight text-on-surface">{projectedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            <span className="font-headline text-lg font-medium text-on-surface-variant uppercase tracking-widest font-bold">EGP</span>
          </div>
          <div className="mt-6 flex items-center gap-2 font-mono text-[12px] bg-tertiary/10 text-tertiary w-fit px-4 py-2 rounded-lg border border-tertiary/10">
            <TrendingUp size={16} />
            <span className="font-bold">+4.2% Variance</span>
          </div>
        </div>
      </div>

      {/* Spending Trends Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1 mb-2">
           <h3 className="text-[12px] font-bold text-on-surface-variant uppercase tracking-[0.2em] flex items-center gap-2 italic">
              <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
              Trend Analysis
           </h3>
        </div>
        <ComparisonChart />
        
        {/* Trend Summary Chips */}
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-4 border-primary/20 bg-primary/5">
             <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase">{t.highest_surge}</span>
                <ArrowUpRight className="text-error" size={16} />
             </div>
             <p className="font-bold text-on-surface">Fiber Net <span className="text-error text-xs ml-1">+12%</span></p>
          </div>
          <div className="card p-4 border-tertiary/20 bg-tertiary/5">
             <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase">{t.best_savings}</span>
                <ArrowDownRight className="text-tertiary" size={16} />
             </div>
             <p className="font-bold text-on-surface">Landline <span className="text-tertiary text-xs ml-1">-5%</span></p>
          </div>
        </div>
      </section>

      {/* Bills List Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1 mb-4">
           <h3 className="text-[12px] font-bold text-on-surface-variant uppercase tracking-[0.2em] flex items-center gap-2 italic">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              {t.categorical_breakdown}
           </h3>
        </div>
        
        {/* Dynamic breakdown items from bills */}
        {bills.map((bill) => {
          const Icon = bill.serviceType === "Internet" ? Globe : 
                       bill.serviceType === "Landline" ? Smartphone :
                       bill.serviceType === "Water" ? Droplets : List;
          
          const colorClass = bill.serviceType === "Internet" ? "text-primary" :
                             bill.serviceType === "Landline" ? "text-red-500" :
                             bill.serviceType === "Water" ? "text-cyan-400" : "text-on-surface-variant";

          const bgClass = colorClass.replace("text-", "bg-") + "/10";

          return (
            <div key={bill.id} className="card flex items-center justify-between group hover:border-primary transition-all cursor-pointer p-5">
              <div className="flex items-center gap-5">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border border-white/5", bgClass, colorClass)}>
                  <Icon size={22} />
                </div>
                <div>
                  <h4 className="font-headline text-base font-bold text-on-surface group-hover:text-primary transition-colors">{bill.provider}</h4>
                  {bill.branchName ? (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="w-1 h-1 rounded-full bg-primary/40"></div>
                      <p className="text-primary text-[10px] font-bold uppercase tracking-wider leading-none">
                        {bill.branchName} {language === "AR" ? "فرع" : "Branch"}
                      </p>
                    </div>
                  ) : (
                    <p className="text-on-surface-variant/40 text-[9px] font-mono uppercase mt-0.5 italic">{language === "AR" ? "المكتب الرئيسي" : "Head Office / Primary"}</p>
                  )}
                  <p className="font-mono text-[11px] text-on-surface-variant uppercase tracking-tighter mt-1.5 opacity-60">{language === "AR" ? "تاريخ الاستحقاق" : "DUE"}: {new Date(bill.dueDate).toLocaleDateString(language === "AR" ? 'ar-EG' : 'en-US', { month: 'short', day: '2-digit' })}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-headline text-base font-bold text-on-surface leading-none mb-1.5">{bill.amount.toFixed(2)} {t.egp}</p>
                <span className={cn("text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ring-1 ring-inset", bgClass, colorClass, "ring-current/20")}>
                  {t[bill.status.toLowerCase() as keyof typeof t] || bill.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Export Actions */}
      <div className="pt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <button 
          onClick={exportToPDF}
          disabled={isExportingPDF}
          className="h-14 bg-primary text-on-primary rounded-xl font-headline font-bold flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all group border border-white/10 text-sm italic tracking-wide disabled:opacity-50"
        >
          {isExportingPDF ? <Loader2 className="animate-spin" size={20} /> : <FileText size={20} className="group-hover:scale-110 transition-transform" />}
          {t.generate_pdf}
        </button>
        <button 
          onClick={exportToXLSX}
          disabled={isExportingXLSX}
          className="h-14 border border-outline text-on-surface-variant rounded-xl font-headline font-bold flex items-center justify-center gap-3 hover:bg-surface-container transition-all active:scale-[0.98] group text-sm italic tracking-wide disabled:opacity-50"
        >
          {isExportingXLSX ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} className="group-hover:translate-y-0.5 transition-transform" />}
          {t.download_ledger}
        </button>
      </div>

      {/* Success Toast */}
      {showToast.show && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 bg-tertiary text-on-tertiary px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 size={20} />
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider">{language === "AR" ? "تم بنجاح" : showToast.message}</span>
        </div>
      )}

    </main>
  );
};
