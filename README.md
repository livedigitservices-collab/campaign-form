# Customer & Campaign Details Form Application

A simple, clean, modern, and responsive single-page React frontend application built with **Vite**, **React (JSX)**, **Tailwind CSS**, and **Lucide React**. 

Submissions are sent directly from the React application to a **Google Apps Script Web App**, which appends each entry as a new row in an integrated **Google Sheet** without needing a separate Node.js backend.

---

## 🚀 Features

- 🎨 **Clean Modern UI**: Centered responsive card layout with white background, subtle shadows, rounded corners, clean typography, and intuitive icons.
- 📱 **Fully Responsive Layout**: 2-column grid layout on desktop and single-column on mobile.
- ⚡ **Real-time Auto Calculation**:
  $$\text{Total Amount} = \text{Plan Amount Per Day} \times \text{Number of Days}$$
  - The *Total Amount* field is strictly read-only and formats automatically as currency.
- ✅ **Frontend Validation**:
  - Highlights required fields with clear error indicators.
  - Validates contact and WhatsApp phone numbers.
  - Enforces positive numbers for daily plan amount and days.
  - Native HTML5 date picker for date selection.
  - Disables submit button during submission to prevent duplicate clicks.
- 🛡️ **Zero Sensitive Credentials in Frontend**: No API keys or service account credentials inside client code. Only uses the Google Apps Script Web App URL.
- 🔔 **Submission Feedback**: Shows loading state during submission, success toast on completion with form reset, and clear error alerts if the request fails.

---

## 📁 Project Structure

```text
campaign-form-app/
├── src/
│   ├── components/
│   │   ├── Header.jsx          # Header with logo, title, and connection status
│   │   ├── FormInput.jsx       # Reusable input with validation, icons & read-only support
│   │   ├── CustomerForm.jsx    # Organized Customer & Campaign sections with auto-calc
│   │   ├── SubmitButton.jsx    # Button with loading spinner and disabled state
│   │   ├── ToastNotification.jsx # Success and error toast alerts
│   │   └── UrlConfigModal.jsx  # In-app settings modal for Web App URL configuration
│   ├── pages/
│   │   └── Home.jsx            # Main page layout
│   ├── services/
│   │   └── googleSheets.js     # API service submitting data to Google Apps Script
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css               # Tailwind CSS imports & global styles
├── google-apps-script.js       # Complete ready-to-use Google Apps Script code
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## 🛠️ Step-by-Step Google Sheets & Apps Script Setup

### 1. Create the Google Sheet
1. Open [Google Sheets](https://sheets.new) in your browser.
2. Name your spreadsheet (e.g., `Customer Campaign Data`).
3. Set the column headers in **Row 1** (A1 to K1):
   - **A1**: `Date`
   - **B1**: `Created By`
   - **C1**: `Customer ID`
   - **D1**: `Customer Name`
   - **E1**: `Business Name`
   - **F1**: `Contact Number`
   - **G1**: `Plan Amount Per Day`
   - **H1**: `No. of Days`
   - **I1**: `Total Amount`
   - **J1**: `Ads Locations`
   - **K1**: `Business WhatsApp Number`

### 2. Create the Google Apps Script
1. In your Google Sheet, click **Extensions** → **Apps Script**.
2. Rename the project to `Campaign Form Web App`.
3. Clear out any default code in `Code.gs`.

### 3. Add the Apps Script Code
Copy and paste the code from `google-apps-script.js` into `Code.gs`:

```javascript
function doPost(e) {
  try {
    var lock = LockService.getScriptLock();
    lock.tryLock(10000); // Wait up to 10s for lock to prevent write collisions

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Auto-initialize header row if starting on a blank sheet
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
```
Press `Ctrl + S` to save.

### 4. Deploying as a Web App
1. Click the top-right **Deploy** button → select **New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Configure the settings:
   - **Description**: `Campaign Details Form API`
   - **Execute as**: **Me** (*your Google account*)
   - **Who has access**: **Anyone** *(Critical so the React app can submit without authentication prompts)*
4. Click **Deploy**.
5. Click **Authorize access** and choose your Google account.
6. If shown an "Unverified App" warning screen, click **Advanced** → **Go to Campaign Form Web App (unsafe)** → **Allow**.
7. Copy the generated **Web App URL** (looks like `https://script.google.com/macros/s/AKfycb.../exec`).

---

## ⚙️ Connecting Web App URL to React Frontend

You can configure the Web App URL in two ways:

### Option A: Environment Variable (Recommended for Production)
Create a `.env` file in the root directory:
```env
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycb.../exec
```

### Option B: In-App Settings Modal (Great for Quick Testing)
1. Open the React app in your browser.
2. Click the **"Script URL Needed"** or **"Connected"** button in the header.
3. Paste your Web App URL into the input modal and click **Save Web App URL**.
4. The URL is saved to `localStorage` for instant testing.

---

## 💻 Local Development & Testing

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start Vite dev server**:
   ```bash
   npm run dev
   ```

3. Open your browser at `http://localhost:5173`.

4. **Test Form Functionality**:
   - Enter `Plan Amount Per Day = 500` and `Number of Days = 10`.
   - Verify that **Total Amount** automatically displays `₹5,000`.
   - Fill out all required fields and click **[ Submit Details ]**.
   - Watch for the success notification: `Details submitted successfully.`
   - Check your Google Sheet to see the new row appended instantly!

---

## 🌐 Production Build & Deployment

To build static assets for production:

```bash
npm run build
```

The output will be in the `dist/` directory.

### Deploying to Vercel / Netlify / Cloudflare Pages / GitHub Pages
- **Vercel**: Run `npx vercel` or link your GitHub repository. Add `VITE_APPS_SCRIPT_URL` to Environment Variables in Vercel settings.
- **Netlify**: Drag and drop the `dist/` folder or link Git repo. Add build command `npm run build` and publish directory `dist`. Add `VITE_APPS_SCRIPT_URL` to environment variables.
- **Static Hosting**: Any standard web server (Nginx, Apache, S3, Firebase Hosting) can host the `dist/` folder.
