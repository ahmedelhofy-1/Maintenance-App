
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

    const response = await fetch(url, {
      method: 'POST',
      mode: 'no-cors', // Standard for Google Apps Script Web Apps to avoid preflight issues
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    // Note: With 'no-cors', we can't read the response body or status, 
    // but the data is successfully transmitted to the script.
    return true;
  } catch (error) {
    console.error("Sync Error:", error);
    throw error;
  }
};

/**
 * Apps Script code template for the user to paste into Google Sheet Script Editor:
 * 
 * function doPost(e) {
 *   var json = JSON.parse(e.postData.contents);
 *   var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(json.type) || 
 *               SpreadsheetApp.getActiveSpreadsheet().insertSheet(json.type);
 *   
 *   var data = json.payload;
 *   if (data.length > 0) {
 *     // Simple append or clear-and-set logic
 *     sheet.clear(); 
 *     var headers = Object.keys(data[0]);
 *     sheet.appendRow(headers);
 *     data.forEach(function(item) {
 *       var row = headers.map(function(h) { return item[h]; });
 *       sheet.appendRow(row);
 *     });
 *   }
 *   
 *   return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
 * }
 */
