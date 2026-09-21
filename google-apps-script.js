/**
 * Google Apps Script Web App for Campaign Details Form
 * 
 * Strict Unique Customer ID Enforcement & Dynamic Data Reader/Writer
 */

function getTargetSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  
  if (sheet && sheet.getLastRow() > 1) {
    return sheet;
  }
  
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getLastRow() > 0) {
      return sheets[i];
    }
  }
  
  return sheet || ss.getSheets()[0];
}

function doPost(e) {
  try {
    var lock = LockService.getScriptLock();
    lock.tryLock(10000); // Concurrency lock to prevent write collisions

    var sheet = getTargetSheet();
    
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
        'Business WhatsApp Number',
        'Client Daily Review',
        'Feedback'
      ]);
      sheet.getRange(1, 1, 1, 13).setFontWeight('bold').setBackground('#f1f5f9');
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

    // Check all existing Customer IDs in column to guarantee 100% uniqueness
    var values = sheet.getDataRange().getValues();
    var colCustomerId = 2; // Default Column C (index 2)
    if (values && values.length > 0) {
      var headers = values[0].map(function(h) { return h ? h.toString().toLowerCase().trim() : ''; });
      for (var c = 0; c < headers.length; c++) {
        if (headers[c].indexOf('id') !== -1 || headers[c].indexOf('customer id') !== -1) {
          colCustomerId = c;
          break;
        }
      }
    }

    var existingIdMap = {};
    var maxIdNum = 0;
    if (values && values.length > 1) {
      for (var r = 1; r < values.length; r++) {
        var cellVal = values[r][colCustomerId] ? values[r][colCustomerId].toString().trim() : '';
        if (cellVal) {
          existingIdMap[cellVal.toLowerCase()] = true;
          var match = cellVal.match(/(\d+)/);
          if (match) {
            var num = parseInt(match[1], 10);
            if (num > maxIdNum) maxIdNum = num;
          }
        }
      }
    }

    var customerId = data.customerId ? data.customerId.toString().trim() : '';
    // If ID is missing OR if ID is a duplicate, generate next strictly unique ID
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
      data.businessWhatsAppNumber || '',
      data.clientDailyReview || '',
      data.feedback || ''
    ];

    sheet.appendRow(rowData);

    lock.releaseLock();

    return ContentService
      .createTextOutput(JSON.stringify({ 
        status: 'success',
        result: 'success',
        customerIdAssigned: customerId,
        message: 'Details submitted successfully with Customer ID: ' + customerId 
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
  try {
    var sheet = getTargetSheet();
    var values = sheet.getDataRange().getValues();

    if (!values || values.length <= 1) {
      return ContentService
        .createTextOutput(JSON.stringify({
          status: 'success',
          sheetName: sheet.getName(),
          createdByList: [],
          records: []
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Detect column indexes dynamically from Header Row (Row 0)
    var headers = values[0].map(function(h) {
      return h ? h.toString().toLowerCase().trim() : '';
    });

    var findColIndex = function(keywords, defaultIdx) {
      for (var i = 0; i < headers.length; i++) {
        for (var k = 0; k < keywords.length; k++) {
          if (headers[i].indexOf(keywords[k]) !== -1) {
            return i;
          }
        }
      }
      return defaultIdx;
    };

    var colDate = findColIndex(['date'], 0);
    var colCreatedBy = findColIndex(['created', 'creator', 'by', 'staff', 'agent', 'user'], 1);
    var colCustomerId = findColIndex(['customer id', 'client id', 'cust id', 'id'], 2);
    var colCustomerName = findColIndex(['customer name', 'client name', 'customer', 'client', 'name'], 3);
    var colBusinessName = findColIndex(['business', 'company'], 4);
    var colContactNumber = findColIndex(['contact', 'phone', 'mobile'], 5);
    var colPlanAmount = findColIndex(['plan', 'rate', 'daily'], 6);
    var colNumDays = findColIndex(['days', 'duration'], 7);
    var colTotalAmount = findColIndex(['total', 'amount'], 8);
    var colAdsLocations = findColIndex(['location', 'ads'], 9);
    var colWhatsApp = findColIndex(['whatsapp'], 10);
    var colReview = findColIndex(['review'], 11);
    var colFeedback = findColIndex(['feedback', 'notes', 'comment'], 12);

    var records = [];
    var createdByMap = {};

    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      
      var hasData = row.some(function(cell) {
        return cell !== '' && cell !== null && cell !== undefined;
      });

      if (!hasData) continue;

      var getCellStr = function(idx) {
        if (idx < 0 || idx >= row.length || row[idx] === null || row[idx] === undefined) return '';
        if (row[idx] instanceof Date) {
          return row[idx].toISOString().split('T')[0];
        }
        return row[idx].toString().trim();
      };

      var createdBy = getCellStr(colCreatedBy);
      var customerName = getCellStr(colCustomerName) || getCellStr(colBusinessName) || ('Client #' + i);
      var customerId = getCellStr(colCustomerId) || ('LD' + ('0000' + i).slice(-4));

      var record = {
        date: getCellStr(colDate) || new Date().toISOString().split('T')[0],
        createdBy: createdBy,
        customerId: customerId,
        customerName: customerName,
        businessName: getCellStr(colBusinessName),
        contactNumber: getCellStr(colContactNumber),
        planAmountPerDay: getCellStr(colPlanAmount),
        numberOfDays: getCellStr(colNumDays),
        totalAmount: getCellStr(colTotalAmount),
        adsLocations: getCellStr(colAdsLocations),
        businessWhatsAppNumber: getCellStr(colWhatsApp),
        clientDailyReview: getCellStr(colReview),
        feedback: getCellStr(colFeedback)
      };

      records.push(record);
      if (createdBy) {
        createdByMap[createdBy] = true;
      }
    }

    var createdByList = Object.keys(createdByMap).sort();

    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        sheetName: sheet.getName(),
        totalRows: records.length,
        createdByList: createdByList,
        records: records
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Error fetching sheet data: ' + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
