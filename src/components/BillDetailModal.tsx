import React from "react";
import { X, CreditCard, History, Building2, Calendar, FileText, ArrowUpRight } from "lucide-react";
import { Bill } from "../types";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { translations, Language } from "../translations";

interface BillDetailModalProps {
  bill: Bill | null;
  onClose: () => void;
  onUpdate: (updatedBill: Bill) => void;
  language: Language;
}

export const BillDetailModal: React.FC<BillDetailModalProps> = ({ bill, onClose, onUpdate, language }) => {
  const t = translations[language];
  const [isEditingProvider, setIsEditingProvider] = React.useState(false);
  const [editedProvider, setEditedProvider] = React.useState("");

  React.useEffect(() => {
    if (bill) {
      setEditedProvider(bill.provider);
      setIsEditingProvider(false);
    }
  }, [bill]);

  const handleProviderSave = () => {
    if (bill && editedProvider.trim()) {
      onUpdate({ ...bill, provider: editedProvider.trim() });
      setIsEditingProvider(false);
    }
  };

  if (!bill) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface/80 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-surface-container-high border border-outline rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="p-6 border-b border-outline-variant flex items-center justify-between bg-primary/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <CreditCard size={24} />
              </div>
              <div>
                {isEditingProvider ? (
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={editedProvider} 
                      onChange={(e) => setEditedProvider(e.target.value)}
                      onBlur={handleProviderSave}
                      onKeyDown={(e) => e.key === 'Enter' && handleProviderSave()}
                      autoFocus
                      className="bg-surface border border-primary rounded-lg px-2 py-1 font-headline text-lg font-bold text-on-surface outline-none"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group/edit cursor-pointer" onClick={() => setIsEditingProvider(true)}>
                    <h2 className="font-headline text-xl font-bold text-on-surface leading-tight group-hover/edit:text-primary transition-colors">{bill.provider}</h2>
                    <ArrowUpRight size={14} className="opacity-0 group-hover/edit:opacity-100 text-primary transition-all rotate-45" />
                  </div>
                )}
                <p className="text-[10px] font-mono text-on-surface-variant uppercase tracking-widest font-bold">
                  {language === "AR" ? (bill.serviceType === "Internet" ? "سجل إنترنت" : "سجل هاتف أرضي") : `${bill.serviceType} Record`}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-surface-container-highest rounded-full text-on-surface-variant transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto no-scrollbar">
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

            {/* Payment History Mockup */}
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
                      <div className="w-8 h-8 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary group-hover/item:scale-110 transition-transform">
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
          </div>

          {/* Footer Actions */}
          <div className="p-6 bg-surface-container-highest flex gap-3">
            <button className="flex-1 h-12 bg-primary text-on-primary rounded-xl font-headline font-bold text-sm shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all">
              {t.download_statement}
            </button>
            <button 
              onClick={onClose}
              className="flex-1 h-12 border border-outline text-on-surface rounded-xl font-headline font-bold text-sm hover:bg-surface-container transition-all"
            >
              {t.close}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
