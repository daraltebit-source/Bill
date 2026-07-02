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
      className="card flex items-center justify-between group hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden bill-card-shadow"
      onClick={() => onViewDetails?.(bill)}
    >
      <div className="flex items-center gap-4 relative z-10">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:rotate-6",
          bill.status === "Unpaid" ? "bg-error/10 text-error border border-error/20" : "bg-primary/10 text-primary border border-primary/20"
        )}>
          <UtilityIcon type={bill.serviceType} size={22} recurring={bill.recurring} />
        </div>
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
      <div className="flex items-center gap-6 relative z-10">
        <div className="text-end px-2 space-y-1">
          <p className="font-headline text-lg text-on-surface font-black leading-none tracking-tight">
            {bill.amount.toFixed(2)} <span className="text-[10px] font-mono font-bold opacity-40">{t.egp}</span>
          </p>
          <StatusBadge status={bill.status} language={language} />
        </div>
        {onDelete && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(bill.id);
            }}
            className="p-2.5 text-on-surface-variant/30 hover:text-error hover:bg-error/10 rounded-xl transition-all border border-transparent hover:border-error/20"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

export const BillListItem: React.FC<{ bill: Bill; language: Language; onDelete?: (id: string) => void; onViewDetails?: (bill: Bill) => void; onMarkPaid?: (id: string) => void }> = ({ bill, language, onDelete, onViewDetails, onMarkPaid }) => {
  const t = translations[language];
  
  const getServiceLabel = (s: string) => {
    // @ts-ignore
    return t[s.toLowerCase()] || s;
  };

  return (
    <div className="card flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-primary/40 bill-card-shadow">
      <div className="flex items-center gap-5 flex-1">
        <div className="w-14 h-14 rounded-2xl bg-surface-container-highest flex items-center justify-center text-primary border border-white/5 shadow-inner transition-transform group-hover:scale-105 duration-300">
          <UtilityIcon type={bill.serviceType} size={24} recurring={bill.recurring} />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <p className="font-headline text-xl text-on-surface font-bold tracking-tight leading-none">
              {bill.provider}
            </p>
            {bill.branchName && bill.status !== "Paid" && (
              <span className={cn(
                "text-primary text-[9px] bg-primary/10 px-2 py-0.5 rounded-md font-bold uppercase tracking-[0.15em] border border-primary/20",
              )}>
                {bill.branchName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
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
      <div className="flex items-center justify-between md:justify-end gap-6 border-t border-outline/30 md:border-transparent pt-4 md:pt-0">
        <div className="text-start md:text-end px-1 space-y-1.5">
          <p className="font-headline text-2xl text-on-surface font-black leading-none tracking-tighter">
            {bill.amount.toFixed(2)} <span className="text-[11px] font-mono opacity-30 font-bold">{t.egp}</span>
          </p>
          <StatusBadge status={bill.status} language={language} />
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <button 
              onClick={() => onViewDetails?.(bill)}
              className="p-3 text-on-surface-variant/40 hover:text-primary hover:bg-primary/10 rounded-xl transition-all border border-transparent hover:border-primary/20"
              title={t.details}
            >
              <ReceiptText size={20} />
            </button>
            {onDelete && (
              <button 
                onClick={() => onDelete(bill.id)}
                className="p-3 text-on-surface-variant/40 hover:text-error hover:bg-error/10 rounded-xl transition-all border border-transparent hover:border-error/20"
                title={t.delete}
              >
                <Trash2 size={20} />
              </button>
            )}
          </div>
          <button 
            disabled={bill.status === "Paid"}
            onClick={(e) => {
              e.stopPropagation();
              if (onMarkPaid && bill.status !== "Paid") {
                onMarkPaid(bill.id);
              }
            }}
            className={cn(
              "rounded-xl px-8 py-3.5 font-headline text-sm font-bold transition-all active:scale-95 shadow-md min-w-[130px] tracking-tight",
              bill.status === "Paid"
                ? "bg-tertiary/10 text-tertiary border border-tertiary/20 shadow-none cursor-default"
                : "bg-primary text-on-primary hover:brightness-110 shadow-primary/20 cursor-pointer"
            )}
          >
            {bill.status === "Paid" ? t.paid : t.mark_paid}
          </button>
        </div>
      </div>
    </div>
  );
};
