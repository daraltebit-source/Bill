export type BillStatus = "Paid" | "Unpaid" | "Pending" | "Draft" | "Overdue";
export type UtilityType = "Internet" | "Landline" | "Electricity" | "Water" | "Mobile";
export type RecurringFrequency = "Monthly" | "Quarterly" | "Annually";

export interface Bill {
  id: string;
  provider: string;
  serviceType: UtilityType;
  accountNumber?: string;
  amount: number; // This will represent the TOTAL amount (including 14% VAT)
  baseAmount?: number; // The base amount entered by the user
  vatAmount?: number; // The 14% VAT amount
  currency: string;
  dueDate: string;
  status: BillStatus;
  icon?: string;
  recurring?: boolean;
  frequency?: RecurringFrequency;
  branchName?: string;
}

export interface MonthlyExpense {
  month: string;
  amount: number;
}
