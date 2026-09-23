import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, 
  User, 
  Hash, 
  Building, 
  Phone, 
  PhoneCall, 
  FileText, 
  MessageCircle, 
  AlertCircle, 
  RefreshCw, 
  Loader2, 
  Database,
  UserCheck,
  CheckCircle,
  Clock
} from 'lucide-react';
import FormInput from './FormInput';
import SubmitButton from './SubmitButton';
import { fetchSheetData } from '../services/googleSheets';

// Helper to normalize date strings to YYYY-MM-DD
const normalizeDateStr = (rawDate) => {
  if (!rawDate) return '';
  const str = rawDate.toString().trim();
  if (!str) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.substring(0, 10);
  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  } catch (e) {}
  return str;
};

// Flexible property extraction helper with smart offset correction
const extractRecordFields = (rec) => {
  if (!rec || typeof rec !== 'object') return {};

  const getProp = (...keys) => {
    for (const k of keys) {
      if (rec[k] !== undefined && rec[k] !== null && rec[k].toString().trim() !== '') {
        return rec[k].toString().trim();
      }
    }
    return '';
  };

  let customerName = getProp('customerName', 'Customer Name', 'customer_name', 'name', 'clientName', 'Client Name');
  let customerId = getProp('customerId', 'Customer ID', 'customer_id', 'id');
  let createdBy = getProp('createdBy', 'Created By', 'created_by', 'loggedBy', 'Logged By', 'staffName', 'staff');
  let businessName = getProp('businessName', 'Business Name', 'business_name', 'business');
  let contactNumber = getProp('contactNumber', 'Contact Number', 'contact_number', 'phone', 'mobile');
  let clientDailyReview = getProp('clientDailyReview', 'Client Daily Review', 'client_daily_review', 'review', 'notes');
  let feedback = getProp('feedback', 'Feedback');
  let date = getProp('date', 'Date');

  const isPhonePattern = (str) => /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,14}$/.test((str || '').toString().trim());
  const hasLetters = (str) => /[a-zA-Z]/.test((str || '').toString().trim());

  // SMART CORRECTION LOGIC:
  // If contactNumber contains letters (e.g. "Flowtech solutions"), it is actually a Business Name!
  if (hasLetters(contactNumber)) {
    const textVal = contactNumber;
    const phoneVal = isPhonePattern(businessName) ? businessName : '';
    businessName = textVal;
    contactNumber = phoneVal;
  } else if (isPhonePattern(businessName) && !contactNumber) {
    contactNumber = businessName;
    businessName = '';
  }

  // Fallback: If contactNumber is still empty, search all properties in rec for a valid phone number
  if (!contactNumber) {
    for (const k of Object.keys(rec)) {
      const val = (rec[k] || '').toString().trim();
      if (isPhonePattern(val) && val !== customerId) {
        contactNumber = val;
        break;
      }
    }
  }

  return {
    customerName,
    customerId,
    createdBy,
    businessName,
    contactNumber,
    clientDailyReview,
    feedback,
    date
  };
};

const getInitialFormData = () => ({
  date: new Date().toISOString().split('T')[0],
  createdBy: '',
  customerId: '',
  customerName: '',
  businessName: '',
  contactNumber: '',
  clientDailyReview: '',
  feedback: '',
});

export default function DailyReviewForm({ onSubmit, isSubmitting, isUrlConfigured, onOpenSettings, webAppUrl, campaignUrl }) {
  const [formData, setFormData] = useState(getInitialFormData);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Client Data state (fetched from connected Google Sheets)
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [createdByOptions, setCreatedByOptions] = useState([]);
  const [allRecords, setAllRecords] = useState([]);
  const [fetchStatus, setFetchStatus] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Set of completed review keys formatted as `${nameOrIdKey}_${YYYY-MM-DD}`
  const [completedReviewKeys, setCompletedReviewKeys] = useState(new Set());
  const [sessionCompletedKeys, setSessionCompletedKeys] = useState(new Set());

  // Load client data from connected Sheet(s)
  const loadClientData = async (silent = false) => {
    const urlsToFetch = [];
    if (webAppUrl && webAppUrl.trim()) {
      urlsToFetch.push({ name: 'Review Sheet', url: webAppUrl.trim() });
    }
    if (campaignUrl && campaignUrl.trim() && campaignUrl.trim() !== webAppUrl?.trim()) {
      urlsToFetch.push({ name: 'Campaign Sheet', url: campaignUrl.trim() });
    }

    if (urlsToFetch.length === 0) {
      setFetchStatus({
        success: false,
        message: 'No Google Sheet URL configured. Please configure Web App URL in settings.',
      });
      return;
    }

    if (!silent) setIsLoadingClients(true);

    try {
      const mergedRecordsMap = new Map();
      const mergedCreatedBySet = new Set();
      const existingCompletedSet = new Set();

      for (const item of urlsToFetch) {
        const res = await fetchSheetData(item.url);
        if (res.success) {
          (res.createdByList || []).forEach((name) => {
            if (name && name.trim()) mergedCreatedBySet.add(name.trim());
          });

          (res.records || []).forEach((rawRec, idx) => {
            const rec = extractRecordFields(rawRec);

            if (rec.createdBy) {
              mergedCreatedBySet.add(rec.createdBy);
            }

            const nameKey = rec.customerName ? rec.customerName.toLowerCase() : '';
            const idKey = rec.customerId ? rec.customerId.toLowerCase() : '';
            const phoneKey = rec.contactNumber ? rec.contactNumber.replace(/[^0-9]/g, '') : '';
            const recordKey = nameKey || idKey || (phoneKey ? `phone_${phoneKey}` : `rec_${idx}`);

            if (recordKey && (rec.customerName || rec.customerId || rec.contactNumber || rec.createdBy)) {
              if (!mergedRecordsMap.has(recordKey)) {
                mergedRecordsMap.set(recordKey, {
                  customerName: rec.customerName || rec.customerId || (`Client #${idx + 1}`),
                  createdBy: rec.createdBy,
                  customerId: rec.customerId,
                  businessName: rec.businessName,
                  contactNumber: rec.contactNumber,
                });
              } else {
                const existing = mergedRecordsMap.get(recordKey);
                if (!existing.createdBy && rec.createdBy) existing.createdBy = rec.createdBy;
                if (!existing.customerId && rec.customerId) existing.customerId = rec.customerId;
                if (!existing.businessName && rec.businessName) existing.businessName = rec.businessName;
                if (!existing.contactNumber && rec.contactNumber) existing.contactNumber = rec.contactNumber;

                // Fix if existing entry had swapped text/phone
                if (existing.contactNumber && /[a-zA-Z]/.test(existing.contactNumber)) {
                  if (!existing.businessName) existing.businessName = existing.contactNumber;
                  existing.contactNumber = rec.contactNumber || '';
                }
              }
            }

            // Extract completed reviews for specific dates from Review Sheet
            if (item.name === 'Review Sheet' && (rec.clientDailyReview || rec.feedback)) {
              const normDate = normalizeDateStr(rec.date);
              if (normDate) {
                if (nameKey) existingCompletedSet.add(`${nameKey}_${normDate}`);
                if (idKey) existingCompletedSet.add(`${idKey}_${normDate}`);
              }
            }
          });
        }
      }

      const combinedRecords = Array.from(mergedRecordsMap.values());
      const combinedCreatedBy = Array.from(mergedCreatedBySet).sort();

      setCreatedByOptions(combinedCreatedBy);
      setAllRecords(combinedRecords);
      setCompletedReviewKeys(existingCompletedSet);

      const now = new Date();
      setLastSyncTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

      setFetchStatus({
        success: true,
        message: `Loaded ${combinedRecords.length} client(s) & ${combinedCreatedBy.length} staff member(s).`,
      });
    } catch (err) {
      setFetchStatus({
        success: false,
        message: 'Network error fetching sheet data.',
      });
    } finally {
      if (!silent) setIsLoadingClients(false);
    }
  };

  // Auto load data on mount and background poll every 30 seconds
  useEffect(() => {
    loadClientData();
    const interval = setInterval(() => {
      loadClientData(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [webAppUrl, campaignUrl]);

  // Re-evaluate client status when review date changes
  const selectedNormDate = normalizeDateStr(formData.date);

  const isClientReviewCompleted = (clientRec) => {
    if (!selectedNormDate) return false;
    const nameKey = clientRec.customerName ? clientRec.customerName.trim().toLowerCase() : '';
    const idKey = clientRec.customerId ? clientRec.customerId.trim().toLowerCase() : '';

    const nameDateKey = `${nameKey}_${selectedNormDate}`;
    const idDateKey = `${idKey}_${selectedNormDate}`;

    return (
      (nameKey && completedReviewKeys.has(nameDateKey)) ||
      (idKey && completedReviewKeys.has(idDateKey)) ||
      (nameKey && sessionCompletedKeys.has(nameDateKey)) ||
      (idKey && sessionCompletedKeys.has(idDateKey))
    );
  };

  // Categorize clients by selected staff member
  const selectedStaffLower = (formData.createdBy || '').trim().toLowerCase();
  
  const directStaffClients = selectedStaffLower
    ? allRecords.filter((rec) => rec.createdBy && rec.createdBy.trim().toLowerCase() === selectedStaffLower)
    : allRecords;

  const otherStaffClients = selectedStaffLower
    ? allRecords.filter((rec) => !rec.createdBy || rec.createdBy.trim().toLowerCase() !== selectedStaffLower)
    : [];

  // Counts for staff progress for the selected review date
  const completedCountForStaff = directStaffClients.filter(isClientReviewCompleted).length;
  const totalStaffClients = directStaffClients.length;

  // Handle Created By (Staff Name) Select
  const handleCreatedBySelect = (e) => {
    const val = e.target.value;
    setFormData((prev) => ({
      ...prev,
      createdBy: val,
      customerName: '',
      customerId: '',
      businessName: '',
      contactNumber: '',
      clientDailyReview: '',
      feedback: '',
    }));
  };

  // Handle Customer Select & Auto Populate Details
  const handleCustomerNameSelect = (e) => {
    const selectedName = e.target.value;

    if (selectedName) {
      const matched = allRecords.find((rec) => rec.customerName === selectedName);
      if (matched) {
        setFormData((prev) => ({
          ...prev,
          customerName: matched.customerName || '',
          createdBy: prev.createdBy || matched.createdBy || '',
          customerId: matched.customerId || '',
          businessName: matched.businessName || '',
          contactNumber: matched.contactNumber || '',
          clientDailyReview: '',
          feedback: '',
        }));
      } else {
        setFormData((prev) => ({ ...prev, customerName: selectedName }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        customerName: '',
        customerId: '',
        businessName: '',
        contactNumber: '',
        clientDailyReview: '',
        feedback: '',
      }));
    }
  };

  const validateField = (name, value) => {
    let error = '';
    const strVal = (value || '').toString().trim();

    if (name === 'createdBy' && !strVal) {
      error = 'Please select a staff member';
    } else if (name === 'customerName' && !strVal) {
      error = 'Please select a client';
    } else if (name === 'feedback' && !strVal) {
      error = 'Please select client feedback status';
    } else if (name === 'clientDailyReview' && !strVal) {
      error = 'Please enter daily review notes';
    } else if (name === 'contactNumber' && strVal) {
      if (!/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,14}$/.test(strVal)) {
        error = 'Enter a valid phone number';
      }
    }

    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setTouched((prev) => ({ ...prev, [name]: true }));

    const fieldError = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: fieldError }));
  };

  const validateAll = () => {
    const newErrors = {};

    if (!formData.createdBy) {
      newErrors.createdBy = 'Please select a staff member';
    }
    if (!formData.customerName) {
      newErrors.customerName = 'Please select a client';
    }
    if (!formData.feedback) {
      newErrors.feedback = 'Please select client feedback status';
    }
    if (!formData.clientDailyReview || !formData.clientDailyReview.trim()) {
      newErrors.clientDailyReview = 'Please enter daily review notes';
    }

    Object.keys(formData).forEach((key) => {
      const err = validateField(key, formData[key]);
      if (err) newErrors[key] = err;
    });

    setErrors(newErrors);
    setTouched({
      date: true,
      createdBy: true,
      customerId: true,
      customerName: true,
      businessName: true,
      contactNumber: true,
      clientDailyReview: true,
      feedback: true,
    });

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isUrlConfigured) {
      onOpenSettings();
      return;
    }

    if (validateAll()) {
      const submittedClientName = formData.customerName;
      const submittedClientId = formData.customerId;
      const currentCreatedBy = formData.createdBy;
      const currentDate = formData.date;
      const normCurrentDate = normalizeDateStr(currentDate);

      onSubmit({
        date: currentDate,
        createdBy: currentCreatedBy,
        customerId: submittedClientId,
        customerName: submittedClientName,
        businessName: formData.businessName,
        contactNumber: formData.contactNumber,
        feedback: formData.feedback,
        clientDailyReview: formData.clientDailyReview,
      }, () => {
        // Record completed review key for current date
        if (normCurrentDate) {
          if (submittedClientName) {
            const nameKey = `${submittedClientName.trim().toLowerCase()}_${normCurrentDate}`;
            setSessionCompletedKeys((prev) => new Set([...prev, nameKey]));
          }
          if (submittedClientId) {
            const idKey = `${submittedClientId.trim().toLowerCase()}_${normCurrentDate}`;
            setSessionCompletedKeys((prev) => new Set([...prev, idKey]));
          }
        }

        // Clear client fields, keeping selected Staff Member & Date for next client review
        setFormData((prev) => ({
          ...prev,
          date: currentDate,
          createdBy: currentCreatedBy,
          customerId: '',
          customerName: '',
          businessName: '',
          contactNumber: '',
          clientDailyReview: '',
          feedback: '',
        }));
        setErrors({});
        setTouched({});
      });
    }
  };

  // Render Call Button for phone inputs
  const renderCallButton = (phoneNumber) => {
    const cleanNumber = (phoneNumber || '').toString().replace(/[^0-9+]/g, '');
    const hasNumber = cleanNumber.length >= 5;

    return (
      <a
        href={hasNumber ? `tel:${cleanNumber}` : '#'}
        onClick={(e) => {
          if (!hasNumber) {
            e.preventDefault();
            alert('Please enter a valid phone number first.');
          }
        }}
        className={`
          inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-md transition-all shadow-2xs shrink-0
          ${hasNumber 
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-95' 
            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }
        `}
        title={hasNumber ? `Call ${cleanNumber}` : 'Enter phone number to call'}
      >
        <PhoneCall className="w-3 h-3 mr-1" />
        Call
      </a>
    );
  };

  // Options for Created By (Staff Name) Dropdown
  const createdBySelectOptions = createdByOptions.length > 0
    ? createdByOptions.map((name) => ({ value: name, label: name }))
    : [{ value: '', label: isLoadingClients ? '-- Loading staff members... --' : '-- No staff members found --' }];

  // Options for Customer Name Dropdown
  let customerNameSelectOptions = [];

  if (allRecords.length === 0) {
    customerNameSelectOptions = [
      { value: '', label: isLoadingClients ? '-- Loading clients... --' : '-- No clients found in Google Sheet --', disabled: true }
    ];
  } else if (!formData.createdBy) {
    // No staff member selected yet: list all clients with staff attribution
    customerNameSelectOptions = allRecords.map((rec) => {
      const isCompleted = isClientReviewCompleted(rec);
      return {
        value: rec.customerName,
        label: isCompleted
          ? `[DONE TODAY] ${rec.customerName}${rec.businessName ? ` (${rec.businessName})` : ''}${rec.createdBy ? ` - Staff: ${rec.createdBy}` : ''}`
          : `${rec.customerName}${rec.businessName ? ` (${rec.businessName})` : ''}${rec.createdBy ? ` - Staff: ${rec.createdBy}` : ''}`,
        disabled: isCompleted,
      };
    });
  } else {
    // Staff member selected: list direct staff clients first
    const directOptions = directStaffClients.map((rec) => {
      const isCompleted = isClientReviewCompleted(rec);
      return {
        value: rec.customerName,
        label: isCompleted
          ? `[DONE TODAY] ${rec.customerName}${rec.businessName ? ` (${rec.businessName})` : ''} - Review Taken`
          : `${rec.customerName}${rec.businessName ? ` (${rec.businessName})` : ''}`,
        disabled: isCompleted,
      };
    });

    const otherOptions = otherStaffClients.map((rec) => {
      const isCompleted = isClientReviewCompleted(rec);
      return {
        value: rec.customerName,
        label: isCompleted
          ? `[DONE TODAY] ${rec.customerName}${rec.businessName ? ` (${rec.businessName})` : ''}${rec.createdBy ? ` (${rec.createdBy})` : ''}`
          : `${rec.customerName}${rec.businessName ? ` (${rec.businessName})` : ''}${rec.createdBy ? ` (Staff: ${rec.createdBy})` : ''}`,
        disabled: isCompleted,
      };
    });

    if (directOptions.length > 0) {
      customerNameSelectOptions = [
        ...directOptions,
        ...(otherOptions.length > 0
          ? [
              { value: '', label: '── All Other Clients ──', disabled: true },
              ...otherOptions
            ]
          : []
        )
      ];
    } else {
      // If no direct clients explicitly assigned to staff, show all available clients
      customerNameSelectOptions = otherOptions;
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 overflow-hidden">
      {!isUrlConfigured && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between text-xs text-amber-800 gap-2">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Review & Feedback Google Apps Script Web App URL is not set. Submissions disabled.</span>
          </div>
          <button
            type="button"
            onClick={onOpenSettings}
            className="underline font-semibold hover:text-amber-900 shrink-0"
          >
            Configure Review Script URL
          </button>
        </div>
      )}

      {/* Sync Status / Fetch Bar */}
      <div className="bg-slate-100/90 border-b border-slate-200 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between text-xs text-slate-700 gap-2">
        <div className="flex items-center space-x-2 font-medium overflow-hidden">
          <Database className="w-4 h-4 text-indigo-600 shrink-0" />
          {isLoadingClients ? (
            <div className="flex items-center space-x-1.5 text-indigo-700 truncate">
              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              <span className="truncate">Syncing clients from Google Sheet...</span>
            </div>
          ) : fetchStatus ? (
            <div className="flex items-center space-x-2 truncate">
              <span className={`truncate ${fetchStatus.success ? 'text-slate-800 font-semibold' : 'text-amber-700 font-semibold'}`}>
                {fetchStatus.message}
              </span>
              {lastSyncTime && (
                <span className="text-[10px] text-slate-400 font-normal hidden xs:inline">
                  (Synced {lastSyncTime})
                </span>
              )}
            </div>
          ) : (
            <span>Review & Feedback Sheet Ready</span>
          )}
        </div>

        <button
          type="button"
          onClick={() => loadClientData(false)}
          disabled={isLoadingClients}
          className="flex items-center space-x-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-indigo-300 transition-all shadow-xs active:scale-95 shrink-0 ml-auto sm:ml-0"
          title="Reload clients from Google Sheet"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingClients ? 'animate-spin' : ''}`} />
          <span>Sync Clients</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-6 sm:space-y-8">
        {/* Client Selection Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-2">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                <UserCheck className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Select Staff & Client
              </h2>
            </div>

            {formData.createdBy && totalStaffClients > 0 && (
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                <CheckCircle className="w-3.5 h-3.5 text-indigo-600" />
                <span>
                  {completedCountForStaff} of {totalStaffClients} Reviews Done Today
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {/* Review Date */}
            <FormInput
              id="date"
              name="date"
              label="Review Date"
              type="date"
              required={true}
              value={formData.date}
              onChange={handleChange}
              icon={Calendar}
              error={touched.date ? errors.date : ''}
            />

            {/* Created By Dropdown (Staff Member) */}
            <FormInput
              id="createdBy"
              name="createdBy"
              label="Logged By (Staff Name)"
              type="select"
              required={true}
              value={formData.createdBy}
              onChange={(e) => {
                handleCreatedBySelect(e);
                handleChange(e);
              }}
              icon={User}
              placeholder="-- Select Staff Member --"
              options={createdBySelectOptions}
              helperText="Select staff member to view their assigned clients"
              error={touched.createdBy ? errors.createdBy : ''}
            />

            {/* Customer ID */}
            <FormInput
              id="customerId"
              name="customerId"
              label="Customer ID"
              placeholder="e.g. ADB0001"
              value={formData.customerId}
              onChange={handleChange}
              icon={Hash}
              readOnly={true}
              helperText="Auto-filled when client is selected"
              error={touched.customerId ? errors.customerId : ''}
            />

            {/* Customer Name Dropdown (Filtered for Staff) */}
            <FormInput
              id="customerName"
              name="customerName"
              label="Select Customer / Client"
              type="select"
              required={true}
              value={formData.customerName}
              onChange={(e) => {
                handleCustomerNameSelect(e);
                handleChange(e);
              }}
              icon={User}
              placeholder={
                allRecords.length === 0
                  ? '-- No clients found in Google Sheet --'
                  : formData.createdBy 
                  ? `-- Select Client for ${formData.createdBy} (${directStaffClients.length - completedCountForStaff} pending today) --` 
                  : `-- Select Client (${allRecords.length} available) --`
              }
              options={customerNameSelectOptions}
              helperText={
                formData.createdBy
                  ? `Showing clients assigned to ${formData.createdBy}`
                  : 'Select staff member above to filter clients'
              }
              error={touched.customerName ? errors.customerName : ''}
            />

            {/* Business Name */}
            <FormInput
              id="businessName"
              name="businessName"
              label="Business Name"
              placeholder="e.g. Apex Enterprises"
              value={formData.businessName}
              onChange={handleChange}
              icon={Building}
              readOnly={true}
              error={touched.businessName ? errors.businessName : ''}
            />

            {/* Contact Number (With Direct Call Button) */}
            <FormInput
              id="contactNumber"
              name="contactNumber"
              label="Contact Number"
              type="tel"
              placeholder="e.g. 9876543210"
              value={formData.contactNumber}
              onChange={handleChange}
              icon={Phone}
              actionButton={renderCallButton(formData.contactNumber)}
              error={touched.contactNumber ? errors.contactNumber : ''}
            />
          </div>
        </section>

        {/* Client Daily Review & Feedback Section */}
        <section className="space-y-4">
          <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-100">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <FileText className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Daily Review & Feedback Details
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {/* Client Feedback Status Dropdown */}
            <FormInput
              id="feedback"
              name="feedback"
              label="Client Feedback Status"
              type="select"
              required={true}
              value={formData.feedback}
              onChange={handleChange}
              icon={MessageCircle}
              placeholder="-- Select Client Feedback --"
              options={[
                { value: 'Positive Review', label: 'Positive Review' },
                { value: 'Negative Review', label: 'Negative Review' },
                { value: 'Not Contacted', label: 'Not Contacted' },
              ]}
              helperText="Choose feedback status for the selected client"
              error={touched.feedback ? errors.feedback : ''}
            />

            {/* Client Daily Review Notes */}
            <FormInput
              id="clientDailyReview"
              name="clientDailyReview"
              label="Client Daily Review Notes"
              type="textarea"
              required={true}
              rows={4}
              placeholder="Enter daily updates, progress, performance metrics discussed with client..."
              value={formData.clientDailyReview}
              onChange={handleChange}
              icon={FileText}
              error={touched.clientDailyReview ? errors.clientDailyReview : ''}
            />
          </div>
        </section>

        {/* Submit Button Section */}
        <div className="pt-4 border-t border-slate-100">
          <SubmitButton
            isSubmitting={isSubmitting}
            disabled={!isUrlConfigured || !formData.createdBy || !formData.customerName || !formData.feedback || !formData.clientDailyReview?.trim()}
          />
        </div>
      </form>
    </div>
  );
}
