import React from "react";
import { Wifi, Phone, Bolt, Droplets, Smartphone, ReceiptText, Globe, Repeat, Trash2 } from "lucide-react";
import { Bill, BillStatus, UtilityType } from "../types";
import { cn } from "../lib/utils";

const UtilityIcon = ({ type, className, size = 24, recurring }: { type: UtilityType; className?: string; size?: number; recurring?: boolean }) => {
  return (
    <div className="relative">
      {recurring && (
        <div className="absolute -top-1.5 -right-1.5 bg-primary p-0.5 rounded-full border border-surface shadow-sm z-10">
          <Repeat size={8} className="text-white" />
        </div>
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
    Paid: "bg-tertiary/10 text-tertiary",
    Unpaid: "bg-error/10 text-error",
    Pending: "bg-primary/10 text-primary",
    Draft: "bg-surface-container-high text-on-surface-variant",
    Overdue: "bg-error text-on-error"
  };

  const getStatusLabel = (s: string) => {
    // @ts-ignore
    return t[s.toLowerCase()] || s;
  };

  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset ring-white/5", styles[status])}>
      {getStatusLabel(status)}
    </span>
  );
};

export const BillCard: React.FC<{ bill: Bill; language: Language; onDelete?: (id: string) => void; onViewDetails?: (bill: Bill) => void }> = ({ bill, language, onDelete, onViewDetails }) => {
  const t = translations[language];
  return (
    <div 
      className="card flex items-center justify-between group hover:border-primary transition-all cursor-pointer relative overflow-hidden"
      onClick={() => onViewDetails?.(bill)}
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
          bill.status === "Unpaid" ? "bg-error/10 text-error" : "bg-primary/10 text-primary"
        )}>
          <UtilityIcon type={bill.serviceType} size={24} recurring={bill.recurring} />
        </div>
        <div>
          <h3 className="font-headline text-base text-on-surface font-semibold group-hover:text-primary transition-colors">
            {bill.provider} {bill.branchName && <span className="text-primary/60 text-xs font-normal mx-1">({bill.branchName})</span>}
          </h3>
          <p className="font-mono text-[11px] text-on-surface-variant uppercase tracking-tight">
            {language === "AR" ? "تاريخ الاستحقاق" : "Due"} {new Date(bill.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="font-headline text-lg text-on-surface font-bold leading-none mb-1">
            {bill.amount.toFixed(2)} <span className="text-[10px] opacity-60">{t.egp}</span>
          </p>
          <StatusBadge status={bill.status} language={language} />
        </div>
        {onDelete && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(bill.id);
            }}
            className="p-2 text-on-surface-variant/40 hover:text-error hover:bg-error/10 rounded-lg transition-all"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

export const BillListItem: React.FC<{ bill: Bill; language: Language; onDelete?: (id: string) => void; onViewDetails?: (bill: Bill) => void }> = ({ bill, language, onDelete, onViewDetails }) => {
  const t = translations[language];
  
  const getServiceLabel = (s: string) => {
    // @ts-ignore
    return t[s.toLowerCase()] || s;
  };

  return (
    <div className="card flex flex-col md:flex-row md:items-center justify-between gap-4 group">
      <div className="flex items-center gap-4 flex-1">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-white/5">
          <UtilityIcon type={bill.serviceType} size={22} recurring={bill.recurring} />
        </div>
        <div>
          <p className="font-headline text-lg text-on-surface font-semibold leading-tight">
            {bill.provider}
            {bill.branchName && bill.status !== "Paid" && (
              <span className={cn(
                "text-primary text-[10px] bg-primary/10 px-2 py-0.5 rounded-md align-middle font-bold uppercase tracking-wider",
                language === "AR" ? "mr-3" : "ml-3"
              )}>
                {bill.branchName}
              </span>
            )}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-[11px] text-on-surface-variant font-medium uppercase tracking-wider">{getServiceLabel(bill.serviceType)}</span>
            <span className="w-1 h-1 rounded-full bg-outline"></span>
            <span className="font-mono text-[11px] text-on-surface-variant">{language === "AR" ? "يستحق في" : "Due"} {new Date(bill.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
            {bill.recurring && bill.frequency && (
              <>
                <span className="w-1 h-1 rounded-full bg-outline"></span>
                <span className="font-mono text-[10px] text-primary font-bold uppercase tracking-widest">{language === "AR" ? "دوري" : bill.frequency}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between md:justify-end gap-4 md:gap-6 border-t border-outline-variant md:border-transparent pt-4 md:pt-0">
        <div className="text-left md:text-right px-2">
          <p className="font-headline text-xl text-on-surface font-bold leading-none mb-1">{bill.amount.toFixed(2)} {t.egp}</p>
          <StatusBadge status={bill.status} language={language} />
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onViewDetails?.(bill)}
            className="p-3 text-on-surface-variant/40 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
            title={t.details}
          >
            <ReceiptText size={20} />
          </button>
          {onDelete && (
            <button 
              onClick={() => onDelete(bill.id)}
              className="p-3 text-on-surface-variant/40 hover:text-error hover:bg-error/10 rounded-xl transition-all"
              title={t.delete}
            >
              <Trash2 size={20} />
            </button>
          )}
          <button className={cn(
            "rounded-lg px-8 py-2.5 font-sans text-sm font-bold transition-all active:scale-95 shadow-sm min-w-[120px]",
            bill.status === "Unpaid" 
              ? "bg-primary text-on-primary hover:brightness-110" 
              : "border border-outline text-on-surface-variant hover:bg-surface-container-high"
          )}>
            {bill.status === "Unpaid" ? t.pay_now : t.manage}
          </button>
        </div>
      </div>
    </div>
  );
};
