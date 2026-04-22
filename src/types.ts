export type BillStatus = "Paid" | "Unpaid" | "Pending" | "Draft" | "Overdue";
export type UtilityType = "Internet" | "Landline" | "Electricity" | "Water" | "Mobile";
export type RecurringFrequency = "Monthly" | "Quarterly" | "Annually";

export interface Bill {
  id: string;
  provider: string;
  serviceType: UtilityType;
  accountNumber?: string;
  amount: number;
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
