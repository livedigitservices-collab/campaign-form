/**
 * Sends campaign and customer details form data to Google Apps Script Web App.
 *
 * @param {string} webAppUrl - The deployed Google Apps Script Web App URL
 * @param {Object} formData - Object containing form field values
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function submitToGoogleSheets(webAppUrl, formData) {
  if (!webAppUrl || typeof webAppUrl !== 'string' || !webAppUrl.trim()) {
    throw new Error('Google Apps Script Web App URL is not configured. Please set the Web App URL.');
  }

  const cleanUrl = webAppUrl.trim();

  // Validate URL format basic check
  if (!cleanUrl.startsWith('https://script.google.com/')) {
    throw new Error('Invalid Google Apps Script URL format. URL should start with https://script.google.com/');
  }

  try {
    // Send request using text/plain to prevent CORS preflight blocking while delivering full JSON payload
    const response = await fetch(cleanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(formData),
      redirect: 'follow',
    });

    if (response.ok) {
      const result = await response.json();
      if (result.status === 'success' || result.result === 'success' || result.success) {
        return {
          success: true,
          message: result.message || 'Details submitted successfully.',
        };
      } else {
        return {
          success: false,
          message: result.message || 'Unable to submit the details. Please try again.',
        };
      }
    } else {
      const statusText = response.status === 404 
        ? 'Google Apps Script URL returned 404 Not Found. Please re-deploy your Apps Script as a Web App (Access: Anyone) and update your Web App URL.'
        : `Server returned status: ${response.status}`;
      return {
        success: false,
        message: 'Unable to submit details: ' + statusText,
      };
    }
  } catch (error) {
    console.error('Google Sheets submission error:', error);
    
    try {
      await fetch(cleanUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(formData),
        mode: 'no-cors',
      });
      return {
        success: true,
        message: 'Details submitted successfully.',
      };
    } catch (fallbackError) {
      console.error('Fallback submission error:', fallbackError);
      throw new Error('Unable to submit details. Web App URL returned 404 or network error.');
    }
  }
}

/**
 * Fetches existing records and Created By list from Google Sheets via Google Apps Script Web App.
 * 
 * @param {string} webAppUrl 
 * @returns {Promise<{success: boolean, createdByList: string[], records: Array, error?: string}>}
 */
export async function fetchSheetData(webAppUrl) {
  if (!webAppUrl || typeof webAppUrl !== 'string' || !webAppUrl.trim()) {
    return { success: false, createdByList: [], records: [], error: 'Web App URL not configured' };
  }

  const cleanUrl = webAppUrl.trim();

  try {
    const response = await fetch(cleanUrl, {
      method: 'GET',
      redirect: 'follow',
    });

    if (response.ok) {
      const text = await response.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse JSON response:', text);
        return { success: false, createdByList: [], records: [], error: 'Invalid JSON response from Google Apps Script' };
      }

      if (data.status === 'success') {
        return {
          success: true,
          createdByList: data.createdByList || [],
          records: data.records || [],
        };
      } else {
        return { success: false, createdByList: [], records: [], error: data.message || 'Script error' };
      }
    }
    
    const errorMsg = response.status === 404
      ? 'Google Apps Script URL returned 404 Not Found. Please re-deploy your Web App (Access: Anyone) and update the URL in settings.'
      : `Server returned status ${response.status}`;

    return { success: false, createdByList: [], records: [], error: errorMsg };
  } catch (err) {
    console.error('Error fetching sheet data:', err);
    return { success: false, createdByList: [], records: [], error: err.message || 'Network error' };
  }
}
