/**
 * Google Apps Script Web App for Campaign Details Form
 * 
 * Includes Strict Server-Side Customer ID Uniqueness Protection
 */

function doPost(e) {
  try {
    var lock = LockService.getScriptLock();
    lock.tryLock(10000); // Concurrency lock to prevent write collisions

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

    // Read all existing Customer IDs in Column C (index 2) to guarantee 100% uniqueness
    var values = sheet.getDataRange().getValues();
    var existingIdMap = {};
    var maxIdNum = 0;

    if (values && values.length > 1) {
      for (var r = 1; r < values.length; r++) {
        var cellId = values[r][2] ? values[r][2].toString().trim() : '';
        if (cellId) {
          existingIdMap[cellId.toLowerCase()] = true;
          var match = cellId.match(/(\d+)/);
          if (match) {
            var num = parseInt(match[1], 10);
            if (num > maxIdNum) maxIdNum = num;
          }
        }
      }
    }

    var customerId = (data.customerId || '').toString().trim();

    // If ID is missing OR if ID already exists in the sheet, assign next strictly unique ID!
    if (!customerId || existingIdMap[customerId.toLowerCase()]) {
      customerId = 'LD' + ('0000' + (maxIdNum + 1)).slice(-4);
    }

    var rowData = [
      data.date || new Date().toISOString().split('T')[0],
      data.createdBy || '',
      customerId,
      data.customerName || '',
      data.businessName || '',
      data.contactNumber || '',
      data.planAmountPerDay ? Number(data.planAmountPerDay) : '',
      data.numberOfDays ? Number(data.numberOfDays) : '',
      data.totalAmount ? Number(data.totalAmount) : '',
      data.adsLocations || '',
      data.businessWhatsAppNumber || ''
    ];

    sheet.appendRow(rowData);

    lock.releaseLock();

    return ContentService
      .createTextOutput(JSON.stringify({ 
        status: 'success',
        result: 'success',
        customerId: customerId,
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
