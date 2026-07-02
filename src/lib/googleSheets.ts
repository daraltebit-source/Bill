import { Bill, UtilityType, BillStatus, RecurringFrequency } from '../types';

export interface GoogleSheetMetadata {
  id: string;
  name: string;
}

/**
 * Searches the user's Google Drive for a spreadsheet named "BillMatrix Ledger"
 */
export async function findLedgerSpreadsheet(accessToken: string): Promise<GoogleSheetMetadata | null> {
  const query = encodeURIComponent("name = 'BillMatrix Ledger' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`;
  
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    if (!res.ok) {
      throw new Error(`Failed to search Google Drive: ${res.statusText}`);
    }
    
    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return {
        id: data.files[0].id,
        name: data.files[0].name,
      };
    }
    return null;
  } catch (error) {
    console.error("Error finding ledger spreadsheet:", error);
    throw error;
  }
}

/**
 * Creates a new spreadsheet named "BillMatrix Ledger" with proper headers
 */
export async function createLedgerSpreadsheet(accessToken: string): Promise<GoogleSheetMetadata> {
  const url = 'https://sheets.googleapis.com/v4/spreadsheets';
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: 'BillMatrix Ledger',
        },
        sheets: [
          {
            properties: {
              title: 'Bills',
            },
          },
        ],
      }),
    });
    
    if (!res.ok) {
      throw new Error(`Failed to create spreadsheet: ${res.statusText}`);
    }
    
    const spreadsheet = await res.json();
    const spreadsheetId = spreadsheet.spreadsheetId;
    
    // Write headers
    await writeHeaders(accessToken, spreadsheetId);
    
    return {
      id: spreadsheetId,
      name: 'BillMatrix Ledger',
    };
  } catch (error) {
    console.error("Error creating ledger spreadsheet:", error);
    throw error;
  }
}

/**
 * Writes columns headers to the spreadsheet
 */
async function writeHeaders(accessToken: string, spreadsheetId: string): Promise<void> {
  const range = 'Bills!A1';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW`;
  
  const headers = [
    [
      'ID',
      'Provider',
      'Service Type',
      'Amount',
      'Due Date',
      'Status',
      'Account Number',
      'Branch Name',
      'Recurring',
      'Frequency'
    ]
  ];
  
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range,
      majorDimension: 'ROWS',
      values: headers,
    }),
  });
  
  if (!res.ok) {
    throw new Error(`Failed to write sheet headers: ${res.statusText}`);
  }
}

/**
 * Reads all bill rows from the spreadsheet and parses them into Bill objects
 */
export async function importBillsFromSheet(accessToken: string, spreadsheetId: string): Promise<Bill[]> {
  const range = 'Bills!A2:J1000'; // Skip header row
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;
  
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    if (!res.ok) {
      throw new Error(`Failed to fetch spreadsheet values: ${res.statusText}`);
    }
    
    const data = await res.json();
    if (!data.values || data.values.length === 0) {
      return [];
    }
    
    const importedBills: Bill[] = data.values.map((row: any[]): Bill => {
      return {
        id: row[0] || Math.random().toString(36).substr(2, 9),
        provider: row[1] || 'Unknown',
        serviceType: (row[2] || 'Internet') as UtilityType,
        amount: parseFloat(row[3]) || 0,
        currency: 'EGP',
        dueDate: row[4] || new Date().toISOString().split('T')[0],
        status: (row[5] || 'Unpaid') as BillStatus,
        accountNumber: row[6] || undefined,
        branchName: row[7] || undefined,
        recurring: row[8] === 'TRUE' || row[8] === true,
        frequency: (row[9] || undefined) as RecurringFrequency | undefined,
      };
    });
    
    return importedBills;
  } catch (error) {
    console.error("Error importing bills from Google Sheet:", error);
    throw error;
  }
}

/**
 * Overwrites the spreadsheet with the current list of bills
 */
export async function exportBillsToSheet(accessToken: string, spreadsheetId: string, bills: Bill[]): Promise<void> {
  // We first clear any old data below the headers to prevent stale values
  await clearSheetValues(accessToken, spreadsheetId);
  
  const range = 'Bills!A2';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW`;
  
  const rows = bills.map(bill => [
    bill.id,
    bill.provider,
    bill.serviceType,
    bill.amount.toString(),
    bill.dueDate,
    bill.status,
    bill.accountNumber || '',
    bill.branchName || '',
    bill.recurring ? 'TRUE' : 'FALSE',
    bill.frequency || '',
  ]);
  
  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range,
        majorDimension: 'ROWS',
        values: rows,
      }),
    });
    
    if (!res.ok) {
      throw new Error(`Failed to export bills to Google Sheet: ${res.statusText}`);
    }
  } catch (error) {
    console.error("Error exporting bills to Google Sheet:", error);
    throw error;
  }
}

/**
 * Clears old data from range Bills!A2:J1000 to prepare for export
 */
async function clearSheetValues(accessToken: string, spreadsheetId: string): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Bills!A2:J1000:clear`;
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    if (!res.ok) {
      console.warn(`Failed to clear sheets prior to writing: ${res.statusText}`);
    }
  } catch (error) {
    console.error("Error clearing sheet prior to writing:", error);
  }
}
