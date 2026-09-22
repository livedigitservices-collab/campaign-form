/**
 * Google Apps Script Web App for Campaign Form Sheet (11 Columns)
 * 
 * Instructions:
 * 1. Open your Campaign Google Sheet.
 * 2. Set Row 1 headers (A1 to K1):
 *    Date | Created By | Customer ID | Customer Name | Business Name | 
 *    Contact Number | Plan Amount Per Day | No. of Days | Total Amount | 
 *    Ads Locations | Business WhatsApp Number
 * 3. Extensions -> Apps Script -> Paste this code -> Deploy as Web App (Access: Anyone).
 */

function doPost(e) {
  try {
    var lock = LockService.getScriptLock();
    lock.tryLock(10000);

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
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
      try { data = JSON.parse(e.postData.contents); } catch (err) { data = e.parameter || {}; }
    } else if (e.parameter) { data = e.parameter; }

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
      .createTextOutput(JSON.stringify({ status: 'success', result: 'success', customerId: customerId, message: 'Campaign submitted successfully.' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var values = sheet.getDataRange().getValues();

    if (!values || values.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', createdByList: [], records: [] })).setMimeType(ContentService.MimeType.JSON);
    }

    var records = [];
    var createdByMap = {};

    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      if (!row.some(function(c) { return c !== ''; })) continue;

      var getStr = function(idx) { return (row[idx] !== undefined && row[idx] !== null) ? row[idx].toString().trim() : ''; };
      var createdBy = getStr(1);
      var customerName = getStr(3) || getStr(4) || ('Client #' + i);

      records.push({
        date: getStr(0) || new Date().toISOString().split('T')[0],
        createdBy: createdBy,
        customerId: getStr(2) || ('LD' + ('0000' + i).slice(-4)),
        customerName: customerName,
        businessName: getStr(4),
        contactNumber: getStr(5),
        planAmountPerDay: getStr(6),
        numberOfDays: getStr(7),
        totalAmount: getStr(8),
        adsLocations: getStr(9),
        businessWhatsAppNumber: getStr(10)
      });

      if (createdBy) createdByMap[createdBy] = true;
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      createdByList: Object.keys(createdByMap).sort(),
      records: records
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}
