import { Bill } from '../types';
import { translations, Language } from '../translations';

export interface GoogleCalendarMetadata {
  id: string;
  summary: string;
}

/**
 * Searches the user's Google Calendar list for a calendar named "BillMatrix Due Dates"
 */
export async function findBillCalendar(accessToken: string): Promise<GoogleCalendarMetadata | null> {
  const url = 'https://www.googleapis.com/calendar/v3/users/me/calendarList';
  
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    if (!res.ok) {
      throw new Error(`Failed to fetch Calendar list: ${res.statusText}`);
    }
    
    const data = await res.json();
    if (data.items && data.items.length > 0) {
      const found = data.items.find((cal: any) => cal.summary === 'BillMatrix Due Dates');
      if (found) {
        return {
          id: found.id,
          summary: found.summary,
        };
      }
    }
    return null;
  } catch (error) {
    console.error("Error finding BillMatrix calendar:", error);
    throw error;
  }
}

/**
 * Creates a new secondary calendar named "BillMatrix Due Dates"
 */
export async function createBillCalendar(accessToken: string): Promise<GoogleCalendarMetadata> {
  const url = 'https://www.googleapis.com/calendar/v3/calendars';
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: 'BillMatrix Due Dates',
        description: 'Automated calendar tracking upcoming utility bill payment deadlines.',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      }),
    });
    
    if (!res.ok) {
      throw new Error(`Failed to create calendar: ${res.statusText}`);
    }
    
    const calendar = await res.json();
    return {
      id: calendar.id,
      summary: calendar.summary,
    };
  } catch (error) {
    console.error("Error creating Google Calendar:", error);
    throw error;
  }
}

/**
 * Syncs the list of bills to the specified "BillMatrix Due Dates" calendar.
 * To keep it clean, it lists current events, finds matching events or deletes old ones,
 * and adds events for any unpaid/pending bills.
 */
export async function syncBillsToCalendar(
  accessToken: string, 
  calendarId: string, 
  bills: Bill[],
  language: Language
): Promise<{ added: number; updated: number; removed: number }> {
  const t = translations[language];
  
  // 1. Fetch current events on the calendar to prevent double-scheduling and clear paid/deleted bills
  const listUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?maxResults=250`;
  
  let currentEvents: any[] = [];
  try {
    const res = await fetch(listUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (res.ok) {
      const data = await res.json();
      currentEvents = data.items || [];
    }
  } catch (e) {
    console.error("Failed to list calendar events:", e);
  }

  // Helper to identify events created by BillMatrix
  // We can look for the ID inside the description or private/shared extendedProperties,
  // but a simple "Bill ID: <id>" tag in description is robust and clear.
  const getBillIdFromEvent = (event: any): string | null => {
    if (!event.description) return null;
    const match = event.description.match(/Bill ID:\s*([a-zA-Z0-9_\-]+)/);
    return match ? match[1] : null;
  };

  const activeBillsMap = new Map<string, Bill>();
  // We only schedule Unpaid or Pending bills
  const billsToSchedule = bills.filter(b => b.status === 'Unpaid' || b.status === 'Pending');
  billsToSchedule.forEach(b => activeBillsMap.set(b.id, b));

  let added = 0;
  let updated = 0;
  let removed = 0;

  // 2. Remove events for bills that are paid, deleted, or whose status changed to Paid/Draft
  for (const event of currentEvents) {
    const billId = getBillIdFromEvent(event);
    if (billId) {
      const activeBill = activeBillsMap.get(billId);
      if (!activeBill) {
        // Bill no longer exists, or is paid, or is a draft. Remove event.
        const deleteUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${event.id}`;
        await fetch(deleteUrl, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        removed++;
      } else {
        // Event exists for an active unpaid bill. Let's see if date or amount changed.
        const amountMatch = event.description.match(/Amount:\s*([0-9\.]+)/);
        const savedAmount = amountMatch ? parseFloat(amountMatch[1]) : 0;
        const eventDate = event.start?.date || event.start?.dateTime?.split('T')[0];

        if (eventDate !== activeBill.dueDate || savedAmount !== activeBill.amount) {
          // Update event details
          const updateUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${event.id}`;
          const body = buildEventBody(activeBill, language, t);
          await fetch(updateUrl, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
          });
          updated++;
        }
        // Remove from the schedule map as it's already handled
        activeBillsMap.delete(billId);
      }
    }
  }

  // 3. Create events for any remaining active bills
  for (const [_, bill] of activeBillsMap.entries()) {
    const createUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
    const body = buildEventBody(bill, language, t);
    
    const res = await fetch(createUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (res.ok) {
      added++;
    } else {
      console.error(`Failed to create calendar event for bill ${bill.provider}:`, await res.text());
    }
  }

  return { added, updated, removed };
}

/**
 * Generates the event request payload for Google Calendar
 */
function buildEventBody(bill: Bill, language: Language, t: any) {
  const serviceLabel = t[bill.serviceType.toLowerCase()] || bill.serviceType;
  const summary = language === 'AR' 
    ? `دفع فاتورة: ${bill.provider} (${serviceLabel})`
    : `Pay Bill: ${bill.provider} (${serviceLabel})`;
    
  const descLines = [
    language === 'AR' ? `--- تفاصيل فاتورة BillMatrix ---` : `--- BillMatrix Bill Details ---`,
    language === 'AR' ? `المزود: ${bill.provider}` : `Provider: ${bill.provider}`,
    language === 'AR' ? `الخدمة: ${serviceLabel}` : `Service: ${serviceLabel}`,
    language === 'AR' ? `المبلغ المستحق: ${bill.amount.toFixed(2)} جنيه` : `Amount: ${bill.amount.toFixed(2)} EGP`,
  ];

  if (bill.accountNumber) {
    descLines.push(language === 'AR' ? `رقم الحساب: ${bill.accountNumber}` : `Account Number: ${bill.accountNumber}`);
  }
  if (bill.branchName) {
    descLines.push(language === 'AR' ? `الفرع/المكتب: ${bill.branchName}` : `Branch: ${bill.branchName}`);
  }
  if (bill.recurring && bill.frequency) {
    descLines.push(language === 'AR' ? `التكرار: دوري (${bill.frequency})` : `Recurring: Auto (${bill.frequency})`);
  }
  
  descLines.push(`\nBill ID: ${bill.id}`);

  return {
    summary,
    description: descLines.join('\n'),
    start: {
      date: bill.dueDate,
    },
    end: {
      date: bill.dueDate,
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 1440 }, // 1 day before
        { method: 'popup', minutes: 180 },  // 3 hours before
      ],
    },
  };
}
