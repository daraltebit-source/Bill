import React, { useState } from "react";
import { ArrowLeft, Phone, Globe, CalendarDays, Info, Save, Smartphone, AlertCircle, CheckCircle2, Repeat } from "lucide-react";
import { cn } from "../lib/utils";
import { Bill, UtilityType, BillStatus } from "../types";
import { translations, Language } from "../translations";

export const AddLine: React.FC<{ language: Language; onBack: () => void; onAdd: (bill: Bill) => void }> = ({ language, onBack, onAdd }) => {
  const t = translations[language];
  const [serviceType, setServiceType] = useState<"Landline" | "Internet">("Landline");
  const [isRecurring, setIsRecurring] = useState(false);
  const [branchName, setBranchName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const cost = formData.get("cost") as string;
    const branch = formData.get("branchName") as string;
    
    setBranchName(branch);
    
    const newErrors: Record<string, string> = {};
    if (!cost || parseFloat(cost) <= 0) {
      newErrors.cost = language === "AR" ? "يرجى تحديد حد الإنفاق الشهري أكبر من 0" : "Please specify a monthly expenditure limit greater than 0";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      onAdd({
        id: `bill-${Date.now()}`,
        provider: formData.get("provider") as string === "we" ? "Telecom Egypt (WE)" : 
                 formData.get("provider") as string === "orange" ? "Orange DSL" :
                 formData.get("provider") as string === "vodafone" ? "Vodafone Giga" : "Etisalat Connect",
        serviceType: serviceType,
        amount: parseFloat(cost),
        currency: (formData.get("currency") as string).toUpperCase(),
        dueDate: `2023-11-${formData.get("renewal")}`,
        status: "Unpaid",
        branchName: branch || undefined,
        recurring: isRecurring,
        frequency: isRecurring ? (formData.get("frequency") as string) : undefined
      });
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1500);
  };

  if (isSuccess) {
    return (
      <main className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-2xl font-bold text-on-surface mb-3">{t.sync_authorized}</h2>
        <p className="text-on-surface-variant mb-10">
          {language === "AR" 
            ? `تم تسجيل التزامك الجديد لـ ${t[serviceType.toLowerCase() as keyof typeof t] || serviceType} ${branchName ? `لفرع ${branchName}` : ""} في السجل${isRecurring ? ` بجدول دوري` : ""}.`
            : `Your new ${serviceType} obligation ${branchName ? `for ${branchName}` : ""} has been recorded in the ledger${isRecurring ? ` on a recurring schedule` : ""}.`
          }
        </p>
        <button 
          onClick={onBack}
          className="w-full bg-surface-container-high text-on-surface py-4 rounded-xl font-bold border border-outline hover:bg-outline-variant transition-all"
        >
          {t.return_dashboard}
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto px-4 py-12 pb-32">
      {/* Breadcrumb */}
      <button 
        onClick={onBack}
        className={cn("flex items-center gap-2 mb-10 text-on-surface-variant hover:text-primary transition-colors group", language === "AR" && "flex-row-reverse")}
      >
        <ArrowLeft size={18} className={cn("transition-transform", language === "AR" ? "rotate-180 group-hover:translate-x-1" : "group-hover:-translate-x-1")} />
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] font-bold">{t.return_dashboard}</span>
      </button>

      <div className={cn("mb-12", language === "AR" && "text-right")}>
        <h2 className="font-headline text-[32px] font-bold text-on-surface leading-tight mb-2">{t.new_obligation}</h2>
        <p className="text-on-surface-variant text-[15px] leading-relaxed opacity-80">{t.new_obligation_desc}</p>
      </div>

      <form className="space-y-8" onSubmit={handleSubmit}>
        {/* Service Type Selection */}
        <div className="space-y-3">
          <label className={cn("block font-mono text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em]", language === "AR" && "text-right")}>{t.select_asset}</label>
          <div className="grid grid-cols-2 gap-4">
            <button 
              type="button"
              onClick={() => setServiceType("Landline")}
              className={cn(
                "flex flex-col items-center justify-center p-6 rounded-2xl border transition-all",
                serviceType === "Landline" 
                  ? "border-primary bg-primary/10 text-primary shadow-lg shadow-primary/10" 
                  : "border-outline-variant bg-[#11151C] hover:border-primary/50 text-on-surface-variant"
              )}
            >
              <Phone className="mb-3" size={28} />
              <span className="font-mono text-[12px] font-bold uppercase tracking-widest">{t.landline}</span>
            </button>
            <button 
              type="button"
              onClick={() => setServiceType("Internet")}
              className={cn(
                "flex flex-col items-center justify-center p-6 rounded-2xl border transition-all",
                serviceType === "Internet" 
                  ? "border-primary bg-primary/10 text-primary shadow-lg shadow-primary/10" 
                  : "border-outline-variant bg-[#11151C] hover:border-primary/50 text-on-surface-variant"
              )}
            >
              <Globe className="mb-3" size={28} />
              <span className="font-mono text-[12px] font-bold uppercase tracking-widest">{language === "AR" ? "إنترنت فايبر" : "Fiber Net"}</span>
            </button>
          </div>
        </div>

        {/* Form Grid */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className={cn("block font-mono text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em]", language === "AR" && "text-right")} htmlFor="provider">{t.select_provider}</label>
            <div className="relative">
              <select 
                className="block w-full px-4 py-4 bg-[#11151C] border border-outline rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-on-surface appearance-none transition-all cursor-pointer font-medium"
                id="provider" 
                name="provider"
              >
                <option value="we">Telecom Egypt (WE)</option>
                <option value="orange">Orange DSL</option>
                <option value="vodafone">Vodafone Giga</option>
                <option value="etisalat">Etisalat Connect</option>
              </select>
              <div className={cn("absolute inset-y-0 flex items-center pointer-events-none text-on-surface-variant/40", language === "AR" ? "left-4" : "right-4")}>
                 <ArrowLeft className="-rotate-90" size={14} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className={cn("block font-mono text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em]", language === "AR" && "text-right")} htmlFor="branchName">{t.branch_name}</label>
            <div className="relative">
              <input 
                className={cn("block w-full px-4 py-4 bg-[#11151C] border border-outline rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-on-surface transition-all placeholder:text-on-surface-variant/30 font-medium", language === "AR" && "text-right")}
                id="branchName" 
                name="branchName" 
                placeholder={language === "AR" ? "مثال: فرع هليوبوليس" : "e.g. Heliopolis Branch"} 
                type="text" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className={cn("block font-mono text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em]", language === "AR" && "text-right")} htmlFor="renewal">{t.billing_day}</label>
              <div className="relative">
                <select 
                  className="block w-full px-4 py-4 bg-[#11151C] border border-outline rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-on-surface appearance-none transition-all cursor-pointer font-medium"
                  id="renewal" 
                  name="renewal"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                    const suffix = day === 1 || day === 21 || day === 31 ? 'st' : 
                                  day === 2 || day === 22 ? 'nd' :
                                  day === 3 || day === 23 ? 'rd' : 'th';
                    return <option key={day} value={day}>{day}{language === "AR" ? "" : suffix}</option>
                  })}
                </select>
                <div className={cn("absolute inset-y-0 flex items-center pointer-events-none text-on-surface-variant/40", language === "AR" ? "left-4" : "right-4")}>
                  <CalendarDays size={18} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className={cn("block font-mono text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em]", language === "AR" && "text-right")} htmlFor="cost">{t.monthly_limit}</label>
              <div className={cn("flex gap-2", language === "AR" && "flex-row-reverse")}>
                <div className="relative w-24 shrink-0">
                  <select 
                    className="block w-full pl-3 pr-8 py-4 bg-[#11151C] border border-outline rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-on-surface appearance-none transition-all cursor-pointer font-bold text-[10px] uppercase"
                    id="currency" 
                    name="currency"
                    defaultValue="egp"
                  >
                    <option value="egp">{t.egp}</option>
                    <option value="usd">USD</option>
                  </select>
                  <div className={cn("absolute inset-y-0 flex items-center pointer-events-none text-on-surface-variant/40", language === "AR" ? "left-2" : "right-2")}>
                     <ArrowLeft className="-rotate-90" size={12} />
                  </div>
                </div>
                <div className="relative flex-1">
                  <input 
                    className={cn(
                      "block w-full px-4 py-4 bg-[#11151C] border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-on-surface text-right font-bold transition-all",
                      errors.cost ? "border-error/50 ring-1 ring-error/20" : "border-outline"
                    )}
                    id="cost" 
                    name="cost" 
                    placeholder="0.00" 
                    type="number" 
                    onChange={() => errors.cost && setErrors(prev => ({ ...prev, cost: "" }))}
                  />
                </div>
              </div>
              {errors.cost && (
                <p className={cn("text-[11px] text-error flex items-center gap-1 mt-1 font-medium italic", language === "AR" ? "flex-row-reverse" : "justify-end")}>
                  <AlertCircle size={10} /> {errors.cost}
                </p>
              )}
            </div>
          </div>

          {/* Recurring Option */}
          <div className="space-y-4 pt-2">
            <button 
              type="button"
              onClick={() => setIsRecurring(!isRecurring)}
              className={cn(
                "w-full flex items-center justify-between p-5 rounded-xl border transition-all truncate",
                isRecurring 
                  ? "border-primary bg-primary/5 text-primary" 
                  : "border-outline bg-[#11151C] text-on-surface-variant hover:border-outline-variant",
                language === "AR" && "flex-row-reverse"
              )}
            >
              <div className={cn("flex items-center gap-4", language === "AR" && "flex-row-reverse")}>
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center transition-colors shadow-sm",
                  isRecurring ? "bg-primary/20" : "bg-surface-container-high"
                )}>
                  <Repeat size={18} />
                </div>
                <div className={cn(language === "AR" ? "text-right" : "text-left")}>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-widest leading-none mb-1">{t.recurring_obligation}</p>
                  <p className="text-[12px] opacity-70">{t.recurring_desc}</p>
                </div>
              </div>
              <div className={cn(
                "w-12 h-6 rounded-full relative transition-colors shrink-0",
                isRecurring ? "bg-primary" : "bg-surface-container-high"
              )}>
                <div className={cn(
                  "absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm",
                  isRecurring ? "left-7" : "left-1"
                )} />
              </div>
            </button>

            {isRecurring && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className={cn("block font-mono text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-2", language === "AR" && "text-right")} htmlFor="frequency">{t.interval_frequency}</label>
                <div className="relative">
                  <select 
                    className="block w-full px-4 py-4 bg-[#11151C] border border-outline rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-on-surface appearance-none transition-all cursor-pointer font-medium"
                    id="frequency" 
                    name="frequency"
                    defaultValue="Monthly"
                  >
                    <option value="Monthly">{language === "AR" ? "دورة شهرية" : "Monthly Cycle"}</option>
                    <option value="Quarterly">{language === "AR" ? "ربع سنوي (90 يوم)" : "Quarterly (90 Days)"}</option>
                    <option value="Annually">{language === "AR" ? "تجديد سنوي" : "Annual Renewal"}</option>
                  </select>
                  <div className={cn("absolute inset-y-0 flex items-center pointer-events-none text-on-surface-variant/40", language === "AR" ? "left-4" : "right-4")}>
                     <ArrowLeft className="-rotate-90" size={14} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className={cn("card bg-primary/5 border-primary/20 p-5 flex items-start gap-4", language === "AR" && "flex-row-reverse")}>
          <Info className="text-primary mt-0.5 shrink-0" size={20} />
          <p className={cn("text-[13px] leading-relaxed text-on-surface-variant", language === "AR" && "text-right")}>
            <strong>Stratos Insight:</strong> {language === "AR" ? `لقد أنفقت 12% أكثر على خدمات الـ ${t[serviceType.toLowerCase() as keyof typeof t] || serviceType} هذا العام مقارنة بالمتوسط التاريخي.` : `You've spent 12% more on ${serviceType} services this year compared to the historical average.`}
          </p>
        </div>

        {/* Save Button */}
        <button 
          className={cn(
            "w-full py-5 px-6 rounded-xl font-headline text-lg font-bold shadow-xl transition-all flex items-center justify-center gap-3 group border border-white/10",
            isSubmitting ? "bg-primary/50 cursor-wait" : "bg-primary text-on-primary hover:brightness-110 active:scale-[0.98] shadow-primary/20"
          )}
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Save size={20} className="group-hover:scale-110 transition-transform" />
              {t.authorize_obligation}
            </>
          )}
        </button>
      </form>
    </main>
  );
};
