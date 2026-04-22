import React from "react";
import { AlertTriangle, X } from "lucide-react";
import { Bill } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { translations, Language } from "../translations";

interface DeleteConfirmationModalProps {
  bill: Bill | null;
  onConfirm: (id: string) => void;
  onCancel: () => void;
  language: Language;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ bill, onConfirm, onCancel, language }) => {
  if (!bill) return null;
  const t = translations[language];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-surface/90 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-surface-container-high border border-outline rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
        >
          <div className="p-8 text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-error/10 flex items-center justify-center text-error mb-4">
              <AlertTriangle size={32} />
            </div>
            
            <div className="space-y-2">
              <h2 className="font-headline text-xl font-bold text-on-surface">{t.confirm_deletion}</h2>
              <p className="text-sm text-on-surface-variant leading-relaxed px-4">
                {language === "AR" 
                  ? <>هل أنت متأكد أنك تريد حذف الالتزام لـ <span className="font-bold text-on-surface">"{bill.provider}"</span>؟ لا يمكن التراجع عن هذا الإجراء.</>
                  : <>Are you sure you want to delete the obligation for <span className="font-bold text-on-surface">"{bill.provider}"</span>? This action cannot be undone.</>
                }
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <button 
                onClick={() => onConfirm(bill.id)}
                className="h-12 bg-error text-on-error rounded-xl font-headline font-bold text-sm shadow-lg shadow-error/20 hover:brightness-110 active:scale-95 transition-all w-full"
              >
                {t.delete_confirm}
              </button>
              <button 
                onClick={onCancel}
                className="h-12 border border-outline text-on-surface rounded-xl font-headline font-bold text-sm hover:bg-surface-container transition-all w-full"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
