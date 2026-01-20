/**
 * Service to sync application data with Google Sheets via a Web App URL (Google Apps Script)
 */

export const syncToGoogleSheets = async (url: string, dataType: string, data: any[]) => {
  if (!url) {
    throw new Error("Google Sheets Web App URL is not configured.");
  }

  try {
    const payload = {
      action: 'sync',
      type: dataType, // e.g., 'Inventory', 'Assets', 'AnnualRequests'
      timestamp: new Date().toISOString(),
      payload: data
    };

    await fetch(url, {
      method: 'POST',
      mode: 'no-cors', // Standard for Google Apps Script Web Apps to avoid preflight issues
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    return true;
  } catch (error) {
    console.error("Sync Error:", error);
    throw error;
  }
};