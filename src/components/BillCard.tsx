import React from "react";
import { motion } from "motion/react";
import { Wifi, Phone, Bolt, Droplets, Smartphone, ReceiptText, Globe, Repeat, Trash2, Pencil } from "lucide-react";
import { Bill, BillStatus, UtilityType } from "../types";
import { cn } from "../lib/utils";

// Smooth spring physics optimized for high refresh rates (120 FPS)
const springConfig = { type: "spring", stiffness: 400, damping: 25 };

const UtilityIcon = ({ type, className, size = 24, recurring }: { type: UtilityType; className?: string; size?: number; recurring?: boolean }) => {
  return (
    <div className="relative">
      {recurring && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={springConfig}
          className="absolute -top-1.5 -right-1.5 bg-primary p-0.5 rounded-full border border-surface shadow-sm z-10"
        >
          <Repeat size={8} className="text-white" />
        </motion.div>
      )}
      {(() => {
        switch (type) {
          case "Internet": return <Wifi className={className} size={size} />;
          case "Landline": return <Phone className={className} size={size} />;
          case "Water": return <Droplets className={className} size={size} />;
          case "Mobile": return <Smartphone className={className} size={size} />;
          default: return <ReceiptText className={className} size={size} />;
        }
      })()}
    </div>
  );
};

import { translations, Language } from "../translations";

const StatusBadge = ({ status, language }: { status: BillStatus; language: Language }) => {
  const t = translations[language];
  const styles = {
    Paid: "bg-tertiary/10 text-tertiary border border-tertiary/20",
    Unpaid: "bg-error/10 text-error border border-error/20",
    Pending: "bg-primary/10 text-primary border border-primary/20",
    Draft: "bg-surface-container-high text-on-surface-variant border border-outline/50",
    Overdue: "bg-error text-on-error border border-error-variant"
  };

  const getStatusLabel = (s: string) => {
    // @ts-ignore
    return t[s.toLowerCase()] || s;
  };

  return (
    <motion.span 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={springConfig}
      className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset ring-white/5", styles[status])}
    >
      {getStatusLabel(status)}
    </motion.span>
  );
};

export const BillCard: React.FC<{ bill: Bill; language: Language; onDelete?: (id: string) => void; onViewDetails?: (bill: Bill) => void; onEdit?: (bill: Bill) => void }> = ({ bill, language, onDelete, onViewDetails, onEdit }) => {
  const t = translations[language];
  return (
    <motion.div 
      layoutId={`bill-card-container-${bill.id}`}
      whileHover={{ scale: 1.02, y: -4, borderColor: "rgba(var(--color-primary), 0.4)" }}
      whileTap={{ scale: 0.98 }}
      transition={springConfig}
      className="card flex items-center justify-between group hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden bill-card-shadow transform-gpu will-change-transform"
      onClick={() => onViewDetails?.(bill)}
    >
      <div className="flex items-center gap-4 relative z-10">
        <motion.div 
          whileHover={{ rotate: 12, scale: 1.1 }}
          transition={springConfig}
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
            bill.status === "Unpaid" ? "bg-error/10 text-error border border-error/20" : "bg-primary/10 text-primary border border-primary/20"
          )}
        >
          <UtilityIcon type={bill.serviceType} size={22} recurring={bill.recurring} />
        </motion.div>
        <div className="space-y-0.5">
          <h3 className="font-headline text-base text-on-surface font-bold tracking-tight group-hover:text-primary transition-colors">
            {bill.provider}
          </h3>
          <div className="flex items-center gap-2">
            <span className="technical-label !text-[9px]">{language === "AR" ? "الاستحقاق" : "DUE"}</span>
            <span className="font-mono text-[11px] text-on-surface-variant font-bold">
              {new Date(bill.dueDate).toLocaleDateString(language === "AR" ? 'ar-EG' : 'en-GB', { day: '2-digit', month: 'short' })}
            </span>
            {bill.branchName && (
              <>
                <span className="w-1 h-1 rounded-full bg-outline opacity-50" />
                <span className="text-primary/60 text-[10px] font-bold uppercase tracking-widest">{bill.branchName}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 relative z-10">
        <div className="text-end px-2 space-y-1">
          <p className="font-headline text-lg text-on-surface font-black leading-none tracking-tight">
            {bill.amount.toFixed(2)} <span className="text-[10px] font-mono font-bold opacity-40">{t.egp}</span>
          </p>
          <StatusBadge status={bill.status} language={language} />
        </div>
        <div className="flex items-center gap-1">
          {onEdit && (
            <motion.button 
              whileHover={{ scale: 1.1, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
              transition={springConfig}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(bill);
              }}
              className="p-2.5 text-on-surface-variant/30 hover:text-primary hover:bg-primary/10 rounded-xl transition-all border border-transparent hover:border-primary/20 cursor-pointer transform-gpu will-change-transform"
              title={language === "AR" ? "تعديل" : "Edit"}
            >
              <Pencil size={18} />
            </motion.button>
          )}
          {onDelete && (
            <motion.button 
              whileHover={{ scale: 1.1, rotate: -15 }}
              whileTap={{ scale: 0.9 }}
              transition={springConfig}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(bill.id);
              }}
              className="p-2.5 text-on-surface-variant/30 hover:text-error hover:bg-error/10 rounded-xl transition-all border border-transparent hover:border-error/20 cursor-pointer transform-gpu will-change-transform"
              title={language === "AR" ? "حذف" : "Delete"}
            >
              <Trash2 size={18} />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const BillListItem: React.FC<{ bill: Bill; language: Language; onDelete?: (id: string) => void; onViewDetails?: (bill: Bill) => void; onEdit?: (bill: Bill) => void; onMarkPaid?: (id: string) => void }> = ({ bill, language, onDelete, onViewDetails, onEdit, onMarkPaid }) => {
  const t = translations[language];
  
  const getServiceLabel = (s: string) => {
    // @ts-ignore
    return t[s.toLowerCase()] || s;
  };

  return (
    <motion.div 
      layoutId={`bill-list-item-${bill.id}`}
      whileHover={{ y: -4, borderColor: "rgba(var(--color-primary), 0.3)" }}
      transition={springConfig}
      className="card flex flex-col lg:flex-row lg:items-center justify-between gap-5 group hover:border-primary/40 bill-card-shadow p-5 sm:p-6 rounded-[2rem] bg-surface-container-low/40 border border-outline/50 transform-gpu will-change-transform"
    >
      {/* Top area / Core information and cost summary */}
      <div className="flex flex-row items-start justify-between gap-4 flex-1">
        {/* Left container: Icon + metadata */}
        <div className="flex items-start sm:items-center gap-4 flex-1">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: -5 }}
            transition={springConfig}
            className="w-14 h-14 rounded-2xl bg-surface-container-highest flex items-center justify-center text-primary border border-white/5 shadow-inner shrink-0 transform-gpu"
          >
            <UtilityIcon type={bill.serviceType} size={24} recurring={bill.recurring} />
          </motion.div>
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-headline text-lg sm:text-xl text-on-surface font-bold tracking-tight leading-none truncate">
                {bill.provider}
              </p>
              {bill.branchName && bill.status !== "Paid" && (
                <motion.span 
                  whileHover={{ scale: 1.05 }}
                  className="text-primary text-[9px] bg-primary/10 px-2 py-0.5 rounded-md font-bold uppercase tracking-[0.15em] border border-primary/20 shrink-0"
                >
                  {bill.branchName}
                </motion.span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="technical-label">{getServiceLabel(bill.serviceType)}</span>
              {bill.accountNumber && (
                <>
                  <div className="w-1 h-1 rounded-full bg-outline/40"></div>
                  <span className="technical-label !text-on-surface-variant/70 font-mono tracking-tighter italic">{bill.accountNumber}</span>
                </>
              )}
              <div className="w-1 h-1 rounded-full bg-outline/40"></div>
              <div className="flex items-center gap-1.5">
                <span className="technical-label !text-on-surface-variant/40">{language === "AR" ? "يستحق" : "DUE"}</span>
                <span className="font-mono text-[11px] text-on-surface-variant font-bold">{new Date(bill.dueDate).toLocaleDateString(language === "AR" ? 'ar-EG' : 'en-GB', { day: '2-digit', month: 'short' })}</span>
              </div>
              {bill.recurring && bill.frequency && (
                <>
                  <div className="w-1 h-1 rounded-full bg-outline/40"></div>
                  <div className="flex items-center gap-1.5">
                    <span className="technical-label !text-primary/40 font-black">AUTO</span>
                    <span className="font-mono text-[11px] text-primary font-black uppercase tracking-widest leading-none">{language === "AR" ? "دوري" : bill.frequency}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right container: Financial values and status badge */}
        <div className="text-right shrink-0 space-y-1.5 pl-2">
          <p className="font-headline text-xl sm:text-2xl text-on-surface font-black leading-none tracking-tighter">
            {bill.amount.toFixed(2)} <span className="text-[11px] font-mono opacity-30 font-bold">{t.egp}</span>
          </p>
          <div className="flex justify-end">
            <StatusBadge status={bill.status} language={language} />
          </div>
        </div>
      </div>

      {/* Bottom area / Partition divider and call-to-actions */}
      <div className="flex flex-row items-center justify-between lg:justify-end gap-4 pt-4 border-t border-outline/20 lg:border-t-0 lg:pt-0 lg:pl-4">
        {/* Elegant vertical divider separator for large layout screens */}
        <div className="hidden lg:block w-px h-8 bg-outline/20 mr-2" />

        <div className="flex items-center justify-between lg:justify-end gap-4 w-full lg:w-auto">
          {/* Action icon buttons cluster */}
          <div className="flex items-center gap-1 shrink-0">
            {onEdit && (
              <motion.button 
                whileHover={{ scale: 1.1, rotate: 15 }}
                whileTap={{ scale: 0.9 }}
                transition={springConfig}
                onClick={() => onEdit(bill)}
                className="p-2.5 text-on-surface-variant/40 hover:text-primary hover:bg-primary/10 rounded-xl transition-all border border-transparent hover:border-primary/20 cursor-pointer"
                title={language === "AR" ? "تعديل" : "Edit"}
              >
                <Pencil size={18} />
              </motion.button>
            )}
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={springConfig}
              onClick={() => onViewDetails?.(bill)}
              className="p-2.5 text-on-surface-variant/40 hover:text-primary hover:bg-primary/10 rounded-xl transition-all border border-transparent hover:border-primary/20 cursor-pointer"
              title={t.details}
            >
              <ReceiptText size={18} />
            </motion.button>
            {onDelete && (
              <motion.button 
                whileHover={{ scale: 1.1, rotate: -15 }}
                whileTap={{ scale: 0.9 }}
                transition={springConfig}
                onClick={() => onDelete(bill.id)}
                className="p-2.5 text-on-surface-variant/40 hover:text-error hover:bg-error/10 rounded-xl transition-all border border-transparent hover:border-error/20 cursor-pointer"
                title={t.delete}
              >
                <Trash2 size={18} />
              </motion.button>
            )}
          </div>

          {/* Symmetrical, beautiful and secure Mark Paid button */}
          <motion.button 
            whileHover={bill.status !== "Paid" ? { scale: 1.05 } : {}}
            whileTap={bill.status !== "Paid" ? { scale: 0.95 } : {}}
            transition={springConfig}
            disabled={bill.status === "Paid"}
            onClick={(e) => {
              e.stopPropagation();
              if (onMarkPaid && bill.status !== "Paid") {
                onMarkPaid(bill.id);
              }
            }}
            className={cn(
              "rounded-xl px-5 py-3 font-headline text-xs font-extrabold tracking-wider uppercase transition-all shadow-md text-center shrink-0 w-36 transform-gpu",
              bill.status === "Paid"
                ? "bg-tertiary/10 text-tertiary border border-tertiary/20 shadow-none cursor-default"
                : "bg-primary text-on-primary hover:brightness-110 shadow-primary/20 cursor-pointer"
            )}
          >
            {bill.status === "Paid" ? t.paid : t.mark_paid}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
