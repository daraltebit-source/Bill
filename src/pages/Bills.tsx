import React, { useState, useRef } from "react";
import { Search, FileText, Download, Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import { BillListItem } from "../components/BillCard";
import { BillDetailModal } from "../components/BillDetailModal";
import { DeleteConfirmationModal } from "../components/DeleteConfirmationModal";
import { cn } from "../lib/utils";
import { Bill, UtilityType, BillStatus } from "../types";
import { translations, Language } from "../translations";

export const Bills: React.FC<{ bills: Bill[]; setBills: React.Dispatch<React.SetStateAction<Bill[]>>; language: Language }> = ({ bills, setBills, language }) => {
  const t = translations[language];
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [branchFilter, setBranchFilter] = useState("All");
  const [recurringFilter, setRecurringFilter] = useState("All");
  const [dateRangeType, setDateRangeType] = useState("All");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });
  const [search, setSearch] = useState("");
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [billToDelete, setBillToDelete] = useState<Bill | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ["All", "Paid", "Unpaid", "Pending", "Draft", "Overdue"];
  const serviceFilters = ["All", "Internet", "Landline", "Water", "Mobile"];
  const branchOptions = ["All", ...Array.from(new Set(bills.map(b => b.branchName).filter(Boolean))) as string[]];
  const recurringOptions = ["All", "Recurring", "One-off"];
  const dateRangeOptions = ["All", "30 Days", "90 Days", "This Year", "Custom"];

  const getTranslatedLabel = (key: string) => {
    const translationKey = key.toLowerCase().replace(/ /g, "_").replace(/-/g, "_");
    // @ts-ignore
    return t[translationKey] || key;
  };

  const filteredBills = bills.filter(bill => {
    const matchesSearch = bill.provider.toLowerCase().includes(search.toLowerCase());
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

  return (
    <main className="mt-8 px-4 max-w-2xl mx-auto pb-32">
      {/* Search and Filter Section */}
      <section className="mb-10 flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <div className="relative group flex-1">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-on-surface-variant/40">
              <Search size={20} />
            </div>
            <input 
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#11151C] border border-outline rounded-xl py-4 pl-12 pr-4 font-sans text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-on-surface-variant/30"
              placeholder={t.search_placeholder}
            />
          </div>
          
          <button 
            onClick={handleImportClick}
            className="h-[58px] px-6 bg-primary/10 border border-primary/20 text-primary rounded-xl flex items-center gap-3 hover:bg-primary/20 transition-all active:scale-[0.98] group"
          >
            <Upload size={20} className="group-hover:-translate-y-1 transition-transform" />
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider hidden sm:inline">{t.import}</span>
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".csv" 
            className="hidden" 
          />
        </div>

        {importStatus && (
          <div className={cn(
            "p-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2",
            importStatus.type === 'success' ? "bg-tertiary/10 text-tertiary border border-tertiary/20" : "bg-error/10 text-error border border-error/20"
          )}>
            {importStatus.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span className="text-[12px] font-medium font-mono">{importStatus.message}</span>
            <button 
              onClick={() => setImportStatus(null)}
              className="ml-auto opacity-50 hover:opacity-100 font-mono text-[10px] uppercase font-bold"
            >
              {language === "AR" ? "تجاهل" : "Dismiss"}
            </button>
          </div>
        )}
        
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-50">{t.status}:</span>
            <div className="flex gap-2 overflow-x-auto pb-2 flex-1 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setStatusFilter(cat)}
                  className={cn(
                    "px-4 py-2 rounded-lg font-mono text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border",
                    statusFilter === cat 
                      ? "bg-primary text-on-primary border-primary shadow-lg shadow-primary/20" 
                      : "bg-surface-container-high text-on-surface-variant border-white/5 hover:bg-outline-variant"
                  )}
                >
                  {getTranslatedLabel(cat)}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-50">{t.asset}:</span>
            <div className="flex gap-2 overflow-x-auto pb-2 flex-1 no-scrollbar">
              {serviceFilters.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setTypeFilter(cat)}
                  className={cn(
                    "px-4 py-2 rounded-lg font-mono text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border",
                    typeFilter === cat 
                      ? "bg-primary text-on-primary border-primary shadow-lg shadow-primary/20" 
                      : "bg-surface-container-high text-on-surface-variant border-white/5 hover:bg-outline-variant"
                  )}
                >
                  {getTranslatedLabel(cat)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-50">{t.branch}:</span>
            <div className="flex gap-2 overflow-x-auto pb-2 flex-1 no-scrollbar">
              {branchOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setBranchFilter(opt)}
                  className={cn(
                    "px-4 py-2 rounded-lg font-mono text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border",
                    branchFilter === opt 
                      ? "bg-primary text-on-primary border-primary shadow-lg shadow-primary/20" 
                      : "bg-surface-container-high text-on-surface-variant border-white/5 hover:bg-outline-variant"
                  )}
                >
                  {opt === "All" ? getTranslatedLabel(opt) : opt}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-50">{t.cycle}:</span>
            <div className="flex gap-2 overflow-x-auto pb-2 flex-1 no-scrollbar">
              {recurringOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setRecurringFilter(opt)}
                  className={cn(
                    "px-4 py-2 rounded-lg font-mono text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border",
                    recurringFilter === opt 
                      ? "bg-primary text-on-primary border-primary shadow-lg shadow-primary/20" 
                      : "bg-surface-container-high text-on-surface-variant border-white/5 hover:bg-outline-variant"
                  )}
                >
                  {getTranslatedLabel(opt)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-50">{t.period}:</span>
              <div className="flex gap-2 overflow-x-auto pb-2 flex-1 no-scrollbar">
                {dateRangeOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setDateRangeType(opt)}
                    className={cn(
                      "px-4 py-2 rounded-lg font-mono text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border",
                      dateRangeType === opt 
                        ? "bg-primary text-on-primary border-primary shadow-lg shadow-primary/20" 
                        : "bg-surface-container-high text-on-surface-variant border-white/5 hover:bg-outline-variant"
                    )}
                  >
                    {getTranslatedLabel(opt)}
                  </button>
                ))}
              </div>
            </div>

            {dateRangeType === "Custom" && (
              <div className="flex items-center gap-4 bg-surface-container-low p-4 rounded-xl border border-outline animate-in fade-in slide-in-from-top-2">
                <div className="flex-1 flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-on-surface-variant uppercase opacity-50">{t.from}</span>
                  <input 
                    type="date" 
                    value={customRange.start}
                    onChange={(e) => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
                    className="bg-transparent text-sm font-mono text-primary outline-none"
                  />
                </div>
                <div className="w-px h-8 bg-outline-variant opacity-30" />
                <div className="flex-1 flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-on-surface-variant uppercase opacity-50">{t.to}</span>
                  <input 
                    type="date" 
                    value={customRange.end}
                    onChange={(e) => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
                    className="bg-transparent text-sm font-mono text-primary outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Bill Cards List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-1 mb-2">
           <h2 className="text-[14px] font-bold text-on-surface-variant/60 uppercase tracking-[0.2em]">{t.showing} {filteredBills.length} {t.records}</h2>
        </div>
        {filteredBills.map(bill => (
          <BillListItem key={bill.id} bill={bill} onDelete={handleDeleteBill} onViewDetails={setSelectedBill} language={language} />
        ))}
        {filteredBills.length === 0 && (
          <div className="py-20 text-center card bg-transparent border-dashed">
            <p className="font-mono text-on-surface-variant italic">{t.no_records}</p>
          </div>
        )}
      </div>

      {/* Detail Overlay */}
      <BillDetailModal 
        bill={selectedBill} 
        onClose={() => setSelectedBill(null)} 
        onUpdate={handleUpdateBill}
        language={language}
      />

      {/* Delete Confirmation Overlay */}
      <DeleteConfirmationModal 
        bill={billToDelete}
        onConfirm={confirmDelete}
        onCancel={() => setBillToDelete(null)}
        language={language}
      />

      {/* Export Actions */}
      <div className="mt-12 flex justify-center gap-4">
        <button className="flex items-center gap-3 px-8 py-3.5 border border-outline rounded-xl font-mono text-[11px] font-bold uppercase tracking-widest text-on-surface hover:bg-surface-container-low transition-all">
          <FileText size={18} />
          {t.print_pdf}
        </button>
        <button className="flex items-center gap-3 px-8 py-3.5 border border-outline rounded-xl font-mono text-[11px] font-bold uppercase tracking-widest text-on-surface hover:bg-surface-container-low transition-all">
          <Download size={18} />
          {t.save_csv}
        </button>
      </div>
    </main>
  );
};
