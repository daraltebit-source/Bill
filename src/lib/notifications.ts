import { Bill } from "../types";

/**
 * Safely requests permission and returns the current status
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    return "denied";
  }
  return await Notification.requestPermission();
}

/**
 * Sends a native system push notification if permission is granted, with a quiet fallback to console
 */
export function sendPushNotification(title: string, body: string) {
  if (!("Notification" in window)) {
    return;
  }

  if (Notification.permission === "granted") {
    try {
      new Notification(title, {
        body,
        icon: "/favicon.ico",
        tag: `billmatrix-${Date.now()}` // Unique tag per trigger
      });
    } catch (err) {
      console.warn("Native Notification constructor blocked (often happens in sandboxed environments). Fallback output:", title, body);
    }
  }
}

/**
 * Detects additions or status updates in the bills array and triggers appropriate notifications
 */
export function notifyOnBillChange(newBills: Bill[], oldBills: Bill[], language: "EN" | "AR") {
  if (oldBills.length === 0) return; // Ignore initial load transition

  const isAr = language === "AR";

  // Check for newly added bills
  if (newBills.length > oldBills.length) {
    const newlyAdded = newBills.find(nb => !oldBills.some(ob => ob.id === nb.id));
    if (newlyAdded) {
      const title = isAr ? "تم تسجيل التزام جديد" : "New Obligation Logged";
      const body = isAr 
        ? `تمت إضافة فاتورة لـ ${newlyAdded.provider} بمبلغ ${newlyAdded.amount.toFixed(2)} ${newlyAdded.currency}`
        : `Added bill for ${newlyAdded.provider} worth ${newlyAdded.amount.toFixed(2)} ${newlyAdded.currency}`;
      sendPushNotification(title, body);
    }
    return;
  }

  // Check for status updates
  for (const newBill of newBills) {
    const oldBill = oldBills.find(ob => ob.id === newBill.id);
    if (oldBill && oldBill.status !== newBill.status) {
      const title = isAr ? "تحديث حالة الفاتورة" : "Bill Status Updated";
      const body = isAr
        ? `تم تحديث فاتورة ${newBill.provider} إلى [${newBill.status}]`
        : `Bill for ${newBill.provider} is now [${newBill.status}]`;
      sendPushNotification(title, body);
      break;
    }
  }
}

/**
 * Scans bills for upcoming or overdue deadlines and triggers alerts.
 * Uses localStorage to ensure each specific deadline is only notified once to prevent spam.
 */
export function checkBillReminders(bills: Bill[], language: "EN" | "AR") {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  const isAr = language === "AR";
  const now = new Date();
  
  // Retrieve list of already notified bill status/keys
  const notifiedKeysJson = localStorage.getItem("billmatrix_notified_alerts");
  const notifiedKeys: string[] = notifiedKeysJson ? JSON.parse(notifiedKeysJson) : [];
  const updatedKeys = [...notifiedKeys];

  let hasNewNotification = false;

  bills.forEach(bill => {
    if (bill.status === "Paid") return;

    const dueDate = new Date(bill.dueDate);
    // Calculate difference in days
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Unique key identifying this bill's alert state (e.g., billId-dueDate-overdue or billId-dueDate-upcoming)
    const overdueKey = `${bill.id}-${bill.dueDate}-overdue`;
    const upcomingKey = `${bill.id}-${bill.dueDate}-upcoming`;

    if (diffDays < 0) {
      // Overdue
      if (!notifiedKeys.includes(overdueKey)) {
        const title = isAr ? "تنبيه: فاتورة متأخرة!" : "Warning: Overdue Bill!";
        const body = isAr
          ? `فاتورة ${bill.provider} بقيمة ${bill.amount.toFixed(2)} ${bill.currency} قد تجاوزت تاريخ الاستحقاق (${bill.dueDate})!`
          : `Bill for ${bill.provider} of ${bill.amount.toFixed(2)} ${bill.currency} is overdue (Due date: ${bill.dueDate})!`;
        
        sendPushNotification(title, body);
        updatedKeys.push(overdueKey);
        hasNewNotification = true;
      }
    } else if (diffDays >= 0 && diffDays <= 3) {
      // Upcoming in next 3 days
      if (!notifiedKeys.includes(upcomingKey)) {
        const title = isAr ? "تنبيه: فاتورة مستحقة قريباً" : "Reminder: Upcoming Bill";
        const body = isAr
          ? `فاتورة ${bill.provider} بقيمة ${bill.amount.toFixed(2)} ${bill.currency} مستحقة خلال ${diffDays} أيام (${bill.dueDate})!`
          : `Bill for ${bill.provider} of ${bill.amount.toFixed(2)} ${bill.currency} is due in ${diffDays} days (${bill.dueDate})!`;
        
        sendPushNotification(title, body);
        updatedKeys.push(upcomingKey);
        hasNewNotification = true;
      }
    }
  });

  if (hasNewNotification) {
    localStorage.setItem("billmatrix_notified_alerts", JSON.stringify(updatedKeys));
  }
}
