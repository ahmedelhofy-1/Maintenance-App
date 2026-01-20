
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
      type: dataType, 
      timestamp: new Date().toISOString(),
      payload: data
    };

    // Google Apps Script Web Apps often require 'no-cors' to avoid preflight (OPTIONS) blocks.
    // We send as a simple POST with text/plain which GAS can read from e.postData.contents.
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: JSON.stringify(payload)
    });

    // In 'no-cors' mode, the response is opaque. We assume success if no error is thrown by fetch.
    return true;
  } catch (error) {
    console.error("Sync Service Error:", error);
    throw error;
  }
};
