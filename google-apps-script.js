/**
 * Google Apps Script Web App for Campaign Details Form (12 Columns)
 * 
 * Includes Strict Server-Side Customer ID Uniqueness Protection
 */

function formatDateClean(rawDate) {
  if (!rawDate || !rawDate.toString().trim()) return '';
  var str = rawDate.toString().trim();

  var ymdMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymdMatch) {
    var year = ymdMatch[1];
    var month = ('0' + ymdMatch[2]).slice(-2);
    var day = ('0' + ymdMatch[3]).slice(-2);
    return day + '/' + month + '/' + year;
  }

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
        'Business Location',
        'Do you have a website?',
        'Have you run digital marketing ads before?',
        'What are your current marketing requirements?',
        'Follow-up Date',
        'Remarks'
      ]);
      sheet.getRange(1, 1, 1, 12).setFontWeight('bold').setBackground('#f1f5f9');
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
      customerId = 'ADB' + ('0000' + (maxIdNum + 1)).slice(-4);
    }

    var entryDate = data.date || new Date().toISOString().split('T')[0];

    var rowData = [
      formatDateClean(entryDate),
      data.createdBy || '',
      customerId,
      data.customerName || '',
      data.businessName || '',
      data.contactNumber || '',
      data.businessLocation || '',
      data.hasWebsite || '',
      data.hasRunAdsBefore || '',
      data.marketingRequirements || '',
      formatDateClean(data.followUpDate || ''),
      data.remarks || ''
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
        message: 'Unable to submit details: ' + error.toString() 
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
