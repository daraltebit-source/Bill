import { Bill, MonthlyExpense } from "./types";

export const mockBills: Bill[] = [
  {
    id: "1",
    provider: "WE Internet",
    serviceType: "Internet",
    accountNumber: "02-33445566",
    amount: 450.00,
    currency: "EGP",
    dueDate: "2023-10-12",
    status: "Unpaid",
    branchName: "Maadi"
  },
  {
    id: "2",
    provider: "Telecom Egypt",
    serviceType: "Landline",
    accountNumber: "02-99887766",
    amount: 85.50,
    currency: "EGP",
    dueDate: "2023-10-15",
    status: "Pending",
    branchName: "Zamalek"
  },
   {
    id: "4",
    provider: "Orange DSL",
    serviceType: "Internet",
    accountNumber: "012-34567890",
    amount: 320.00,
    currency: "EGP",
    dueDate: "2023-10-20",
    status: "Paid"
  }
];

export const monthlyExpenses: MonthlyExpense[] = [
  { month: "May", amount: 3200 },
  { month: "Jun", amount: 4100 },
  { month: "Jul", amount: 2950 },
  { month: "Aug", amount: 5400 },
  { month: "Sep", amount: 3800 },
  { month: "Oct", amount: 4850 },
];
