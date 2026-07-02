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
  const [searchTarget, setSearchTarget] = useState<"provider" | "account">("provider");
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

  return (
    <main className="mt-8 px-4 max-w-2xl mx-auto pb-32">
      {/* Header with technical label */}
      <div className="flex flex-col gap-2 blueprint-header -mx-4 px-4 mb-8">
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
      </div>

      {/* Search and Filter Section */}
      <section className="mb-10 flex flex-col gap-6">
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
            
            <button 
              onClick={handleImportClick}
              className="h-[60px] px-6 bg-surface-container-high/60 border border-outline text-on-surface rounded-2xl flex items-center gap-3 hover:bg-primary hover:text-white hover:border-primary transition-all active:scale-[0.98] group shadow-sm"
            >
              <Upload size={20} strokeWidth={2.5} className="group-hover:-translate-y-1 transition-transform" />
              <span className="technical-label !text-current hidden sm:inline">{t.import}</span>
            </button>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept=".csv" 
              className="hidden" 
            />
          </div>
        </div>

        {importStatus && (
          <div className={cn(
            "p-4 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-2 bill-card-shadow",
            importStatus.type === 'success' ? "bg-tertiary/5 text-tertiary border-tertiary/20" : "bg-error/5 text-error border-error/20"
          )}>
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
              importStatus.type === 'success' ? "bg-tertiary/10" : "bg-error/10"
            )}>
              {importStatus.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            </div>
            <span className="text-[13px] font-bold font-mono tracking-tight uppercase leading-none">{importStatus.message}</span>
            <button 
              onClick={() => setImportStatus(null)}
              className="ml-auto p-2 opacity-50 hover:opacity-100 transition-opacity"
            >
              <FileText size={14} className="rotate-45" />
            </button>
          </div>
        )}
        
        <div className="flex flex-col gap-6 bg-surface-container-low/20 p-6 rounded-3xl border border-outline/50 bill-card-shadow">
          <div className="space-y-3">
            <span className="technical-label px-1">{t.status}</span>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setStatusFilter(cat)}
                  className={cn(
                    "px-5 py-2.5 rounded-xl font-mono text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border",
                    statusFilter === cat 
                      ? "bg-primary text-on-primary border-primary shadow-lg shadow-primary/20" 
                      : "bg-surface-container-high text-on-surface-variant border-outline-variant hover:border-primary/50"
                  )}
                >
                  {getTranslatedLabel(cat)}
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <span className="technical-label px-1">{t.asset}</span>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {serviceFilters.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setTypeFilter(cat)}
                    className={cn(
                      "px-5 py-2.5 rounded-xl font-mono text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border",
                      typeFilter === cat 
                        ? "bg-primary text-on-primary border-primary shadow-lg shadow-primary/20" 
                        : "bg-surface-container-high text-on-surface-variant border-outline-variant hover:border-primary/50"
                    )}
                  >
                    {getTranslatedLabel(cat)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <span className="technical-label px-1">{t.branch}</span>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {branchOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setBranchFilter(opt)}
                    className={cn(
                      "px-5 py-2.5 rounded-xl font-mono text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border",
                      branchFilter === opt 
                        ? "bg-primary text-on-primary border-primary shadow-lg shadow-primary/20" 
                        : "bg-surface-container-high text-on-surface-variant border-outline-variant hover:border-primary/50"
                    )}
                  >
                    {opt === "All" ? getTranslatedLabel(opt) : opt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div className="space-y-3">
              <span className="technical-label px-1">{t.period}</span>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {dateRangeOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setDateRangeType(opt)}
                    className={cn(
                      "px-5 py-2.5 rounded-xl font-mono text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border",
                      dateRangeType === opt 
                        ? "bg-primary text-on-primary border-primary shadow-lg shadow-primary/20" 
                        : "bg-surface-container-high text-on-surface-variant border-outline-variant hover:border-primary/50"
                    )}
                  >
                    {getTranslatedLabel(opt)}
                  </button>
                ))}
              </div>
            </div>

            {dateRangeType === "Custom" && (
              <div className="flex items-center gap-4 bg-surface-container-highest/20 p-3 rounded-2xl border border-outline/50 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex-1 flex flex-col gap-0.5 px-2">
                  <span className="text-[8px] font-bold text-on-surface-variant uppercase tracking-wider opacity-60">{t.from}</span>
                  <input 
                    type="date" 
                    value={customRange.start}
                    onChange={(e) => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
                    className="bg-transparent text-[11px] font-mono text-on-surface outline-none cursor-pointer"
                  />
                </div>
                <div className="w-px h-6 bg-outline-variant opacity-30" />
                <div className="flex-1 flex flex-col gap-0.5 px-2">
                  <span className="text-[8px] font-bold text-on-surface-variant uppercase tracking-wider opacity-60">{t.to}</span>
                  <input 
                    type="date" 
                    value={customRange.end}
                    onChange={(e) => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
                    className="bg-transparent text-[11px] font-mono text-on-surface outline-none cursor-pointer"
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
            <BillListItem key={bill.id} bill={bill} onDelete={handleDeleteBill} onViewDetails={setSelectedBill} language={language} />
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

      {/* Export Actions - Technical Style */}
      <div className="mt-16 pt-8 border-t border-outline/30 flex flex-col sm:flex-row justify-center gap-6">
        <button className="group flex items-center gap-4 px-10 py-4.5 border border-outline rounded-2xl font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-on-surface hover:bg-primary hover:text-on-primary hover:border-primary transition-all duration-300 active:scale-95 bill-card-shadow">
          <FileText size={18} className="group-hover:scale-110 transition-transform" />
          {t.print_pdf}
        </button>
        <button className="group flex items-center gap-4 px-10 py-4.5 border border-outline rounded-2xl font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-on-surface hover:bg-tertiary hover:text-on-tertiary hover:border-tertiary transition-all duration-300 active:scale-95 bill-card-shadow">
          <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />
          {t.save_csv}
        </button>
      </div>
    </main>
  );
};
