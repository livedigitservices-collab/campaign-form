/**
 * Google Apps Script Web App for Review & Feedback Sheet (7 Columns)
 * 
 * Instructions:
 * 1. Create a NEW separate Google Sheet named "Client Review & Feedback Data".
 * 2. Set Row 1 headers (A1 to G1):
 *    Date | Created By | Customer ID | Customer Name | Contact Number | 
 *    Client Daily Review | Feedback
 * 3. Extensions -> Apps Script -> Paste this code -> Deploy as Web App (Access: Anyone).
 */

function doPost(e) {
  try {
    var lock = LockService.getScriptLock();
    lock.tryLock(10000);

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Auto-initialize headers if fresh blank sheet
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Date',
        'Created By',
        'Customer ID',
        'Customer Name',
        'Contact Number',
        'Client Daily Review',
        'Feedback'
      ]);
      sheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#f1f5f9');
    }

    var data = {};
    if (e.postData && e.postData.contents) {
      try { data = JSON.parse(e.postData.contents); } catch (err) { data = e.parameter || {}; }
    } else if (e.parameter) { data = e.parameter; }

    var rowData = [
      data.date || new Date().toISOString().split('T')[0],
      data.createdBy || '',
      data.customerId || '',
      data.customerName || '',
      data.contactNumber || '',
      data.clientDailyReview || '',
      data.feedback || ''
    ];

    sheet.appendRow(rowData);
    lock.releaseLock();

    return ContentService
      .createTextOutput(JSON.stringify({ 
        status: 'success', 
        result: 'success', 
        message: 'Daily Review & Feedback stored successfully.' 
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ 
        status: 'error', 
        result: 'error', 
        message: 'Unable to store daily review: ' + error.toString() 
      }))
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

    var headers = values[0].map(function(h) { return h ? h.toString().trim().toLowerCase() : ''; });

    var findIdx = function(possibleNames, defaultIdx) {
      for (var k = 0; k < possibleNames.length; k++) {
        var idx = headers.indexOf(possibleNames[k]);
        if (idx !== -1) return idx;
      }
      return defaultIdx;
    };

    var dateIdx = findIdx(['date'], 0);
    var createdByIdx = findIdx(['created by', 'logged by', 'staff', 'staff name'], 1);
    var customerIdIdx = findIdx(['customer id', 'client id', 'id'], 2);
    var customerNameIdx = findIdx(['customer name', 'client name', 'name'], 3);
    var contactNumberIdx = findIdx(['contact number', 'phone number', 'phone', 'contact'], 4);
    var reviewIdx = findIdx(['client daily review', 'daily review', 'review'], 5);
    var feedbackIdx = findIdx(['feedback'], 6);
    var businessNameIdx = findIdx(['business name', 'business'], -1);

    var records = [];
    var createdByMap = {};

    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      if (!row.some(function(c) { return c !== ''; })) continue;

      var getStr = function(idx) { 
        return (idx !== -1 && row[idx] !== undefined && row[idx] !== null) ? row[idx].toString().trim() : ''; 
      };

      var createdBy = getStr(createdByIdx);
      var customerName = getStr(customerNameIdx) || ('Client #' + i);
      var customerId = getStr(customerIdIdx);

      if (createdBy) createdByMap[createdBy] = true;

      records.push({
        date: getStr(dateIdx),
        createdBy: createdBy,
        customerId: customerId,
        customerName: customerName,
        businessName: getStr(businessNameIdx),
        contactNumber: getStr(contactNumberIdx),
        clientDailyReview: getStr(reviewIdx),
        feedback: getStr(feedbackIdx)
      });
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      totalRecords: records.length,
      createdByList: Object.keys(createdByMap).sort(),
      records: records
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}
