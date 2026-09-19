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
      // Fallback for non-200 responses
      return {
        success: false,
        message: 'Unable to submit the details. Server returned status: ' + response.status,
      };
    }
  } catch (error) {
    console.error('Google Sheets submission error:', error);
    
    // In case Google Apps Script CORS redirect causes a transparent response or network error,
    // test with fallback no-cors request if fetch threw network error
    try {
      await fetch(cleanUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(formData),
        mode: 'no-cors',
      });
      // no-cors fetch completed without throwing, consider it delivered
      return {
        success: true,
        message: 'Details submitted successfully.',
      };
    } catch (fallbackError) {
      console.error('Fallback submission error:', fallbackError);
      throw new Error('Unable to submit the details. Please try again.');
    }
  }
}
