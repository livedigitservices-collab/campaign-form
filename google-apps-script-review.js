/**
 * Google Apps Script Web App for Review & Feedback Sheet (9 Columns)
 * 
 * Headers (A1 to I1):
 * Created Date | Created By | Customer ID | Customer Name | Business Name | 
 * Contact Number | Review Date | Feedback | Client Daily Review
 */

function formatDateClean(rawDate) {
  var now = new Date();
  var defaultDD = ('0' + now.getDate()).slice(-2);
  var defaultMM = ('0' + (now.getMonth() + 1)).slice(-2);
  var defaultYYYY = now.getFullYear();
  var defaultDateStr = defaultDD + '/' + defaultMM + '/' + defaultYYYY;

  if (!rawDate) return defaultDateStr;
  var str = rawDate.toString().trim();
  if (!str) return defaultDateStr;
  
  // If YYYY-MM-DD or YYYY/MM/DD
  var ymdMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymdMatch) {
    var year = ymdMatch[1];
    var month = ('0' + ymdMatch[2]).slice(-2);
    var day = ('0' + ymdMatch[3]).slice(-2);
    return day + '/' + month + '/' + year;
  }

  // If DD/MM/YYYY or D/M/YYYY
  var dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmyMatch) {
    var day2 = ('0' + dmyMatch[1]).slice(-2);
    var month2 = ('0' + dmyMatch[2]).slice(-2);
    var year2 = dmyMatch[3];
    return day2 + '/' + month2 + '/' + year2;
  }

  try {
    var d = new Date(str);
    if (!isNaN(d.getTime())) {
      var yyyy = d.getFullYear();
      var mm = ('0' + (d.getMonth() + 1)).slice(-2);
      var dd = ('0' + d.getDate()).slice(-2);
      return dd + '/' + mm + '/' + yyyy;
    }
  } catch (e) {}

  return str;
}

function fixHeadersIfMissing(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Created Date',
      'Created By',
      'Customer ID',
      'Customer Name',
      'Business Name',
      'Contact Number',
      'Review Date',
      'Feedback',
      'Client Daily Review'
    ]);
    sheet.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#f1f5f9');
    return;
  }

  var lastCol = Math.max(sheet.getLastColumn(), 9);
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var lowerHeaders = headers.map(function(h) { return h ? h.toString().trim().toLowerCase() : ''; });

  var reviewDateIdx = lowerHeaders.indexOf('review date');
  if (reviewDateIdx === -1) {
    var feedbackIdx = lowerHeaders.indexOf('feedback');
    if (feedbackIdx !== -1) {
      sheet.insertColumnBefore(feedbackIdx + 1);
      sheet.getRange(1, feedbackIdx + 1).setValue('Review Date').setFontWeight('bold');
    } else {
      sheet.getRange(1, 7).setValue('Review Date').setFontWeight('bold');
    }
  }

  if (lowerHeaders[0] === 'date') {
    sheet.getRange(1, 1).setValue('Created Date').setFontWeight('bold');
  }

  sheet.getRange(1, 1, 1, 9).setFontWeight('bold');
}

function doPost(e) {
  try {
    var lock = LockService.getScriptLock();
    lock.tryLock(10000);

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    fixHeadersIfMissing(sheet);

    var data = {};
    if (e.postData && e.postData.contents) {
      try { data = JSON.parse(e.postData.contents); } catch (err) { data = e.parameter || {}; }
    } else if (e.parameter) { data = e.parameter; }

    var todayStr = new Date().toISOString().split('T')[0];
    var createdDateFormatted = formatDateClean(data.createdDate || data.date || todayStr);
    var reviewDateFormatted = formatDateClean(data.reviewDate || todayStr);

    var rowData = [
      createdDateFormatted,
      data.createdBy || '',
      data.customerId || '',
      data.customerName || '',
      data.businessName || '',
      data.contactNumber || '',
      reviewDateFormatted,
      data.feedback || '',
      data.clientDailyReview || ''
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
    fixHeadersIfMissing(sheet);

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

    var createdDateIdx = findIdx(['created date', 'creation date', 'date'], 0);
    var createdByIdx = findIdx(['created by', 'logged by', 'staff', 'staff name'], 1);
    var customerIdIdx = findIdx(['customer id', 'client id', 'id'], 2);
    var customerNameIdx = findIdx(['customer name', 'client name', 'name'], 3);
    var businessNameIdx = findIdx(['business name', 'business'], 4);
    var contactNumberIdx = findIdx(['contact number', 'phone number', 'phone', 'contact'], 5);
    var reviewDateIdx = findIdx(['review date', 'daily review date'], 6);
    var feedbackIdx = findIdx(['feedback'], 7);
    var reviewIdx = findIdx(['client daily review', 'daily review', 'review', 'notes'], 8);

    var records = [];
    var createdByMap = {};

    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      if (!row.some(function(c) { return c !== ''; })) continue;

      var getStr = function(idx) { 
        return (idx !== -1 && row[idx] !== undefined && row[idx] !== null) ? row[idx].toString().trim() : ''; 
      };

      var createdBy = getStr(createdByIdx);
      var customerName = getStr(customerNameIdx) || getStr(businessNameIdx) || ('Client #' + i);
      var customerId = getStr(customerIdIdx);
      var businessName = getStr(businessNameIdx);
      var contactNumber = getStr(contactNumberIdx);
      var rawCreatedDate = getStr(createdDateIdx);
      var rawReviewDate = getStr(reviewDateIdx);

      var createdDate = formatDateClean(rawCreatedDate);
      var reviewDate = formatDateClean(rawReviewDate || rawCreatedDate);

      if (createdBy) createdByMap[createdBy] = true;

      records.push({
        createdDate: createdDate,
        date: createdDate,
        createdBy: createdBy,
        customerId: customerId,
        customerName: customerName,
        businessName: businessName,
        contactNumber: contactNumber,
        reviewDate: reviewDate,
        feedback: getStr(feedbackIdx),
        clientDailyReview: getStr(reviewIdx)
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
