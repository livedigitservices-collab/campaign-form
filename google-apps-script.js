/**
 * Google Apps Script Web App for Campaign Details Form
 * 
 * Setup Instructions:
 * 1. Open Google Sheets (https://sheets.new)
 * 2. Set the header row (Row 1):
 *    A1: Date
 *    B1: Created By
 *    C1: Customer ID
 *    D1: Customer Name
 *    E1: Business Name
 *    F1: Contact Number
 *    G1: Plan Amount Per Day
 *    H1: No. of Days
 *    I1: Total Amount
 *    J1: Ads Locations
 *    K1: Business WhatsApp Number
 * 
 * 3. Open Extensions -> Apps Script
 * 4. Replace code in Code.gs with this snippet and save (Ctrl+S)
 * 5. Click "Deploy" -> "New deployment"
 * 6. Select "Web app" (Click gear icon next to Select type)
 * 7. Description: "Campaign Form Service"
 * 8. Execute as: "Me"
 * 9. Who has access: "Anyone"  <-- CRITICAL for frontend access
 * 10. Click "Deploy", authorize permissions when prompted, and copy the Web App URL!
 */

function doPost(e) {
  try {
    var lock = LockService.getScriptLock();
    lock.tryLock(10000); // Concurrency lock to prevent overlapping write conflicts

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Auto-initialize headers if opening a fresh blank sheet
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Date',
        'Created By',
        'Customer ID',
        'Customer Name',
        'Business Name',
        'Contact Number',
        'Plan Amount Per Day',
        'No. of Days',
        'Total Amount',
        'Ads Locations',
        'Business WhatsApp Number'
      ]);
      sheet.getRange(1, 1, 1, 11).setFontWeight('bold').setBackground('#f1f5f9');
    }

    var data = {};
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        data = e.parameter || {};
      }
    } else if (e.parameter) {
      data = e.parameter;
    }

    var rowData = [
      data.date || new Date().toISOString().split('T')[0],
      data.createdBy || '',
      data.customerId || '',
      data.customerName || '',
      data.businessName || '',
      data.contactNumber || '',
      data.planAmountPerDay ? Number(data.planAmountPerDay) : 0,
      data.numberOfDays ? Number(data.numberOfDays) : 0,
      data.totalAmount ? Number(data.totalAmount) : 0,
      data.adsLocations || '',
      data.businessWhatsAppNumber || ''
    ];

    sheet.appendRow(rowData);

    lock.releaseLock();

    return ContentService
      .createTextOutput(JSON.stringify({ 
        status: 'success',
        result: 'success',
        message: 'Details submitted successfully.' 
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ 
        status: 'error',
        result: 'error',
        message: 'Unable to submit the details: ' + error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Campaign Details Web App Service is Active and Running.'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
