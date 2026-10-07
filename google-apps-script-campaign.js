/**
 * Google Apps Script Web App for Campaign Form Sheet (12 Columns)
 * 
 * Instructions:
 * 1. Open your Campaign Google Sheet.
 * 2. Set Row 1 headers (A1 to L1):
 *    Date | Created By | Customer ID | Customer Name | Business Name | 
 *    Contact Number | Business Location | Do you have a website? | 
 *    Have you run digital marketing ads before? | What are your current marketing requirements? |
 *    Follow-up Date | Remarks
 * 3. Extensions -> Apps Script -> Paste this code -> Deploy as Web App (Access: Anyone).
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

    var headers = values[0].map(function(h) { return h ? h.toString().trim().toLowerCase() : ''; });

    var findIdx = function(possibleNames, defaultIdx) {
      for (var k = 0; k < possibleNames.length; k++) {
        var idx = headers.indexOf(possibleNames[k]);
        if (idx !== -1) return idx;
      }
      return defaultIdx;
    };

    var dateIdx = findIdx(['date', 'created date'], 0);
    var createdByIdx = findIdx(['created by', 'logged by', 'staff', 'staff name'], 1);
    var customerIdIdx = findIdx(['customer id', 'client id', 'id'], 2);
    var customerNameIdx = findIdx(['customer name', 'client name', 'name'], 3);
    var businessNameIdx = findIdx(['business name', 'business'], 4);
    var contactNumberIdx = findIdx(['contact number', 'phone number', 'phone', 'contact'], 5);
    var businessLocationIdx = findIdx(['business location', 'location', 'city'], 6);
    var hasWebsiteIdx = findIdx(['do you have a website?', 'website', 'has website'], 7);
    var hasRunAdsBeforeIdx = findIdx(['have you run digital marketing ads before?', 'ads before', 'run ads'], 8);
    var marketingRequirementsIdx = findIdx(['what are your current marketing requirements?', 'marketing requirements', 'requirements'], 9);
    var followUpDateIdx = findIdx(['follow-up date', 'followup date', 'follow up date'], 10);
    var remarksIdx = findIdx(['remarks', 'notes', 'comments'], 11);

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

      if (createdBy) createdByMap[createdBy] = true;

      records.push({
        date: formatDateClean(getStr(dateIdx)),
        createdBy: createdBy,
        customerId: getStr(customerIdIdx) || ('ADB' + ('0000' + i).slice(-4)),
        customerName: customerName,
        businessName: getStr(businessNameIdx),
        contactNumber: getStr(contactNumberIdx),
        businessLocation: getStr(businessLocationIdx),
        hasWebsite: getStr(hasWebsiteIdx),
        hasRunAdsBefore: getStr(hasRunAdsBeforeIdx),
        marketingRequirements: getStr(marketingRequirementsIdx),
        followUpDate: formatDateClean(getStr(followUpDateIdx)),
        remarks: getStr(remarksIdx)
      });
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
