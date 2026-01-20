
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
    // Note: 'no-cors' mode won't allow us to see the response body, but the data will be sent.
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: JSON.stringify(payload)
    });

    return true;
  } catch (error) {
    console.error("Sync Service Error:", error);
    throw error;
  }
};

export const fetchFromGoogleSheets = async (url: string, dataType: string) => {
  if (!url) {
    throw new Error("Google Sheets Web App URL is not configured.");
  }

  // We append the type as a query parameter for doGet
  const fetchUrl = `${url}${url.includes('?') ? '&' : '?'}type=${dataType}`;

  try {
    const response = await fetch(fetchUrl);
    if (!response.ok) throw new Error("Failed to fetch from Google Sheets.");
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Fetch Service Error:", error);
    throw error;
  }
};
