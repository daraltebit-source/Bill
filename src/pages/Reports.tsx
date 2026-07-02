import React from "react";
import { Wallet, TrendingUp, FileText, Download, List, Globe, Smartphone, Bolt, Droplets, ArrowUpRight, ArrowDownRight, Loader2, CheckCircle2 } from "lucide-react";
import { monthlyExpenses } from "../mockData";
import { cn } from "../lib/utils";
import { Bill } from "../types";
import { translations, Language } from "../translations";
import { ComparisonChart } from "../components/ComparisonChart";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
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

  const exportToPDF = async () => {
    setIsExportingPDF(true);
    try {
      const doc = new jsPDF("p", "mm", "a4");
      
      // Top elegant branding header bar
      doc.setFillColor(17, 21, 28); // Slate dark primary theme color
      doc.rect(0, 0, 210, 45, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("STRATOS EXPENDITURE REPORT", 14, 24);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("Stratos Insight Engine - Internal Ledger Report", 14, 32);
      
      // Generation date
      doc.setFontSize(8);
      doc.setTextColor(200, 205, 215);
      doc.text(`Generated on: ${new Date().toLocaleString(language === "AR" ? "ar-EG" : "en-US")}`, 14, 38);

      // Section label
      doc.setFontSize(13);
      doc.setTextColor(17, 21, 28);
      doc.setFont("helvetica", "bold");
      doc.text("EXECUTIVE SUMMARY", 14, 58);

      // Summary Table
      // @ts-ignore
      autoTable(doc, {
        startY: 64,
        body: [
          ["Report Period", "October 2023", "Total Active Records", bills.length.toString()],
          ["Projected Net Liability", `${projectedTotal.toFixed(2)} EGP`, "Compliance Status", "Verifiable / Complete"],
        ],
        theme: 'striped',
        styles: { fontSize: 9, cellPadding: 4, fontStyle: 'normal' },
        columnStyles: {
          0: { fontStyle: 'bold', fillColor: [240, 242, 245], cellWidth: 45 },
          1: { cellWidth: 50 },
          2: { fontStyle: 'bold', fillColor: [240, 242, 245], cellWidth: 45 },
          3: { cellWidth: 50 }
        }
      });

      // Detailed obligations list section
      const detailedY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(13);
      doc.setTextColor(17, 21, 28);
      doc.setFont("helvetica", "bold");
      doc.text("DETAILED OBLIGATIONS LEDGER", 14, detailedY);

      const tableColumn = ["Provider", "Branch Office", "Service Type", "Settlement Amount", "Currency", "Due Date", "Status"];
      const tableRows = bills.map(bill => [
        bill.provider,
        bill.branchName || "Main Office",
        bill.serviceType,
        bill.amount.toFixed(2),
        bill.currency,
        bill.dueDate,
        bill.status
      ]);

      // @ts-ignore
      autoTable(doc, {
        startY: detailedY + 6,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: { 
          fillColor: [17, 21, 28], 
          textColor: [255, 255, 255], 
          fontStyle: 'bold',
          fontSize: 8.5
        },
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: {
          3: { halign: 'right' }, // Align amount column right
          4: { halign: 'center' },
          5: { halign: 'center' },
          6: { halign: 'center' }
        }
      });

      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 155, 165);
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
    <main className="max-w-4xl mx-auto px-6 pt-12 space-y-12 pb-32">
      <div id="report-print-area" className="space-y-12 pb-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="font-headline text-4xl font-black text-on-surface tracking-tighter uppercase italic">{t.projection_metrics}</h2>
              <div className="flex items-center gap-2">
                <span className="technical-label !text-primary/60 !opacity-100">Analytics Engine v2.0</span>
                <div className="w-1 h-1 rounded-full bg-outline opacity-40"></div>
                <span className="technical-label !text-tertiary">Real-time Feed Active</span>
              </div>
            </div>
            <div className="bg-surface-container-high/40 backdrop-blur-md px-5 py-2.5 rounded-2xl font-mono text-[11px] font-black uppercase tracking-widest border border-white/10 shadow-xl bill-card-shadow text-primary">
              {t.october} 2023
            </div>
          </div>
          <p className="font-sans text-on-surface-variant leading-relaxed max-w-2xl opacity-70">
            {t.projection_desc}
          </p>
        </div>

      {/* Total Summary Card */}
      <div className="card !p-0 border-outline overflow-hidden rounded-[2.5rem] relative bill-card-shadow group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -mr-48 -mt-48 group-hover:bg-primary/20 transition-colors duration-1000"></div>
        <div className="p-10 relative z-10">
          <div className="flex justify-between items-start mb-8">
            <div className="space-y-1">
              <span className="technical-label opacity-40">{t.projected_liability}</span>
              <div className="flex items-baseline gap-4">
                <span className="font-headline text-6xl font-black tracking-tighter text-on-surface leading-tight">
                  {projectedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <span className="font-headline text-2xl font-black text-primary/40 uppercase tracking-widest italic">{t.egp}</span>
              </div>
            </div>
            <div className="w-16 h-16 rounded-3xl bg-surface-container-highest flex items-center justify-center text-primary shadow-inner border border-white/5">
               <Wallet size={32} strokeWidth={2.5} />
            </div>
          </div>
          <div className="pt-8 border-t border-outline/30 flex items-center gap-10">
            <div className="flex items-center gap-3 font-mono text-[11px] bg-tertiary/10 text-tertiary px-5 py-2.5 rounded-2xl border border-tertiary/20 shadow-lg shadow-tertiary/5">
              <div className="relative">
                <TrendingUp size={18} strokeWidth={2.5} />
                <div className="absolute inset-0 bg-tertiary blur-lg animate-pulse" />
              </div>
              <span className="font-black uppercase tracking-widest">+4.2% {t.variance}</span>
            </div>
            <div className="flex flex-col">
              <span className="technical-label opacity-40">System Confidence</span>
              <span className="font-mono text-xs font-black text-on-surface tracking-widest">99.98% ACC</span>
            </div>
          </div>
        </div>
      </div>

      {/* Spending Trends Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-4 mb-2">
           <div className="h-px bg-outline/20 flex-1"></div>
           <h3 className="text-[11px] font-black text-on-surface-variant uppercase tracking-[0.3em] flex items-center gap-3 italic bg-surface px-4 py-1.5 rounded-full border border-outline/30">
              <div className="w-2 h-2 rounded-full bg-tertiary shadow-[0_0_10px_rgba(20,255,20,0.5)] animate-pulse" />
              {t.trend_analysis}
           </h3>
           <div className="h-px bg-outline/20 flex-1"></div>
        </div>
        
        <div className="card p-1 pb-4 bg-surface-container-low/40 rounded-[2rem] bill-card-shadow">
          <ComparisonChart />
        </div>
        
        {/* Trend Summary Chips */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6 border-primary/20 bg-primary/5 rounded-3xl group relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-150 transition-transform duration-700">
                <ArrowUpRight size={100} />
             </div>
             <div className="flex items-center justify-between mb-4 relative z-10">
                <span className="technical-label !text-error/60">{t.highest_surge}</span>
                <div className="p-2 rounded-xl bg-error/10 text-error">
                  <ArrowUpRight strokeWidth={3} size={20} />
                </div>
             </div>
             <p className="font-headline text-xl font-bold text-on-surface relative z-10">{t.fiber_net} <span className="text-error font-black ml-2">+12.4%</span></p>
             <p className="text-[10px] font-mono text-on-surface-variant font-bold uppercase tracking-widest mt-2 opacity-40">EXCEEDS BUDGET QUOTA</p>
          </div>
          <div className="card p-6 border-tertiary/20 bg-tertiary/5 rounded-3xl group relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-150 transition-transform duration-700">
                <ArrowDownRight size={100} />
             </div>
             <div className="flex items-center justify-between mb-4 relative z-10">
                <span className="technical-label !text-tertiary">{t.best_savings}</span>
                <div className="p-2 rounded-xl bg-tertiary/10 text-tertiary">
                  <ArrowDownRight strokeWidth={3} size={20} />
                </div>
             </div>
             <p className="font-headline text-xl font-bold text-on-surface relative z-10">Landline <span className="text-tertiary font-black ml-2">-5.2%</span></p>
             <p className="text-[10px] font-mono text-on-surface-variant font-bold uppercase tracking-widest mt-2 opacity-40">OPTIMIZATION SUCCESS</p>
          </div>
        </div>
      </section>

      {/* Bills List Grid */}
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-4">
           <div className="h-px bg-outline/20 flex-1"></div>
           <h3 className="text-[11px] font-black text-on-surface-variant uppercase tracking-[0.3em] flex items-center gap-3 italic bg-surface px-4 py-1.5 rounded-full border border-outline/30">
              <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)] animate-pulse" />
              {t.categorical_breakdown}
           </h3>
           <div className="h-px bg-outline/20 flex-1"></div>
        </div>
        
        <div className="space-y-4">
          {bills.map((bill) => {
            const Icon = bill.serviceType === "Internet" ? Globe : 
                         bill.serviceType === "Landline" ? Smartphone :
                         bill.serviceType === "Water" ? Droplets : List;
            
            const colorClass = bill.serviceType === "Internet" ? "text-primary" :
                               bill.serviceType === "Landline" ? "text-red-500" :
                               bill.serviceType === "Water" ? "text-cyan-400" : "text-on-surface-variant";

            const bgClass = colorClass.replace("text-", "bg-") + "/10";
            const borderClass = colorClass.replace("text-", "border-") + "/20";

            return (
              <div key={bill.id} className="card flex items-center justify-between group hover:border-primary/50 transition-all cursor-pointer p-6 rounded-3xl bill-card-shadow">
                <div className="flex items-center gap-6">
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border shadow-inner transition-transform group-hover:scale-110", bgClass, colorClass, borderClass)}>
                    <Icon size={24} strokeWidth={2.5} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-headline text-lg font-black text-on-surface tracking-tight group-hover:text-primary transition-colors uppercase italic">{bill.provider}</h4>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="technical-label">{bill.serviceType.toUpperCase()}</span>
                      <div className="w-1 h-1 rounded-full bg-outline/40"></div>
                      <span className="font-mono text-[11px] text-on-surface-variant font-bold uppercase opacity-60">
                        {new Date(bill.dueDate).toLocaleDateString(language === "AR" ? 'ar-EG' : 'en-US', { month: 'short', day: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-end space-y-1.5">
                  <p className="font-headline text-xl font-black text-on-surface leading-none tracking-tighter italic">
                    {bill.amount.toFixed(2)} <span className="text-[10px] font-mono opacity-30 uppercase">{t.egp}</span>
                  </p>
                  <span className={cn("text-[9px] uppercase font-black tracking-widest px-3 py-1 rounded-lg border", bgClass, colorClass, borderClass)}>
                    {t[bill.status.toLowerCase() as keyof typeof t] || bill.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>

      {/* Export Actions */}
      <div className="pt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        <button 
          onClick={exportToPDF}
          disabled={isExportingPDF}
          className="h-16 bg-primary text-on-primary rounded-2xl font-headline font-black flex items-center justify-center gap-4 shadow-2xl shadow-primary/30 hover:brightness-110 active:scale-[0.98] transition-all group border border-white/10 text-sm uppercase italic tracking-[0.1em] disabled:opacity-50"
        >
          {isExportingPDF ? <Loader2 className="animate-spin" size={24} /> : <FileText size={24} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />}
          {t.generate_pdf}
        </button>
        <button 
          onClick={exportToXLSX}
          disabled={isExportingXLSX}
          className="h-16 border-2 border-outline-variant bg-surface-container-low/40 backdrop-blur-md text-on-surface rounded-2xl font-headline font-black flex items-center justify-center gap-4 hover:bg-surface-container hover:border-primary/40 transition-all active:scale-[0.98] group text-sm uppercase italic tracking-[0.1em] disabled:opacity-50"
        >
          {isExportingXLSX ? <Loader2 className="animate-spin" size={24} /> : <Download size={24} strokeWidth={2.5} className="group-hover:translate-y-1 transition-transform" />}
          {t.download_ledger}
        </button>
      </div>

      {/* Success Toast */}
      {showToast.show && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 bg-tertiary text-on-tertiary px-8 py-4 rounded-2xl shadow-2xl border-2 border-white/10 flex items-center gap-4 animate-in zoom-in-95 slide-in-from-bottom-8">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <CheckCircle2 size={20} strokeWidth={3} />
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-[10px] font-black uppercase tracking-[0.2em] opacity-80">System Command</span>
            <span className="font-headline text-xs font-black uppercase italic tracking-wider">{language === "AR" ? "تم بنجاح" : showToast.message}</span>
          </div>
        </div>
      )}

    </main>
  );
};
