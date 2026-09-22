import React, { useState, useEffect } from 'react';
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
  UserCheck
} from 'lucide-react';
import FormInput from './FormInput';
import SubmitButton from './SubmitButton';
import { fetchSheetData } from '../services/googleSheets';

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
  
  // Custom toggles
  const [isCustomCreatedBy, setIsCustomCreatedBy] = useState(false);
  const [isCustomCustomerName, setIsCustomCustomerName] = useState(false);

  // Load client data from connected Sheet(s)
  const loadClientData = async () => {
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

    setIsLoadingClients(true);
    setFetchStatus(null);

    try {
      const mergedRecordsMap = new Map();
      const mergedCreatedBySet = new Set();
      let fetchCount = 0;

      for (const item of urlsToFetch) {
        const res = await fetchSheetData(item.url);
        if (res.success) {
          fetchCount++;
          (res.createdByList || []).forEach((name) => {
            if (name && name.trim()) mergedCreatedBySet.add(name.trim());
          });

          (res.records || []).forEach((rec) => {
            if (rec.createdBy && rec.createdBy.trim()) {
              mergedCreatedBySet.add(rec.createdBy.trim());
            }

            const nameKey = rec.customerName ? rec.customerName.trim().toLowerCase() : '';
            if (nameKey) {
              if (!mergedRecordsMap.has(nameKey)) {
                mergedRecordsMap.set(nameKey, {
                  customerName: rec.customerName.trim(),
                  createdBy: rec.createdBy ? rec.createdBy.trim() : '',
                  customerId: rec.customerId ? rec.customerId.trim() : '',
                  businessName: rec.businessName ? rec.businessName.trim() : '',
                  contactNumber: rec.contactNumber ? rec.contactNumber.trim() : '',
                });
              } else {
                const existing = mergedRecordsMap.get(nameKey);
                if (!existing.createdBy && rec.createdBy) existing.createdBy = rec.createdBy.trim();
                if (!existing.customerId && rec.customerId) existing.customerId = rec.customerId.trim();
                if (!existing.businessName && rec.businessName) existing.businessName = rec.businessName.trim();
                if (!existing.contactNumber && rec.contactNumber) existing.contactNumber = rec.contactNumber.trim();
              }
            }
          });
        }
      }

      const combinedRecords = Array.from(mergedRecordsMap.values());
      const combinedCreatedBy = Array.from(mergedCreatedBySet).sort();

      setCreatedByOptions(combinedCreatedBy);
      setAllRecords(combinedRecords);

      if (combinedRecords.length > 0 || combinedCreatedBy.length > 0) {
        setFetchStatus({
          success: true,
          message: `Loaded ${combinedRecords.length} client(s) & ${combinedCreatedBy.length} staff member(s) from connected Sheet(s).`,
        });
      } else {
        setFetchStatus({
          success: true,
          message: 'Connected to Sheet(s) (0 clients found). You can select "+ Add New Client" below to enter custom client details.',
        });
      }
    } catch (err) {
      setFetchStatus({
        success: false,
        message: 'Network error fetching sheet data.',
      });
    } finally {
      setIsLoadingClients(false);
    }
  };

  useEffect(() => {
    loadClientData();
  }, [webAppUrl, campaignUrl]);

  // Filter clients matching selected Created By
  const filteredClients = formData.createdBy
    ? allRecords.filter(
        (rec) => rec.createdBy && rec.createdBy.trim().toLowerCase() === formData.createdBy.trim().toLowerCase()
      )
    : allRecords;

  // Handle Created By Dropdown change
  const handleCreatedBySelect = (e) => {
    const val = e.target.value;
    if (val === '__NEW__') {
      setIsCustomCreatedBy(true);
      setFormData((prev) => ({ ...prev, createdBy: '', customerName: '' }));
    } else {
      setIsCustomCreatedBy(false);
      setFormData((prev) => ({ ...prev, createdBy: val, customerName: '' }));
    }
  };

  // Handle Customer Name Dropdown change & Auto Populate Client Details
  const handleCustomerNameSelect = (e) => {
    const selectedName = e.target.value;

    if (selectedName === '__NEW__') {
      setIsCustomCustomerName(true);
      setFormData((prev) => ({
        ...prev,
        customerName: '',
        customerId: '',
        businessName: '',
        contactNumber: '',
        clientDailyReview: '',
        feedback: '',
      }));
    } else if (selectedName) {
      setIsCustomCustomerName(false);
      const matched = allRecords.find((rec) => rec.customerName === selectedName);
      if (matched) {
        setFormData((prev) => ({
          ...prev,
          customerName: matched.customerName || '',
          createdBy: matched.createdBy || prev.createdBy,
          customerId: matched.customerId || '',
          businessName: matched.businessName || '',
          contactNumber: matched.contactNumber || '',
          clientDailyReview: '',
          feedback: '',
        }));
      } else {
        setFormData((prev) => ({ ...prev, customerName: selectedName }));
      }
    }
  };

  const validateField = (name, value) => {
    let error = '';
    const strVal = (value || '').toString().trim();

    if (!strVal) return '';

    if (name === 'contactNumber') {
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
    Object.keys(formData).forEach((key) => {
      const err = validateField(key, formData[key]);
      if (err) newErrors[key] = err;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isUrlConfigured) {
      onOpenSettings();
      return;
    }

    if (validateAll()) {
      // Submits payload containing only Review & Feedback structure
      onSubmit({
        date: formData.date,
        createdBy: formData.createdBy,
        customerId: formData.customerId,
        customerName: formData.customerName,
        contactNumber: formData.contactNumber,
        clientDailyReview: formData.clientDailyReview,
        feedback: formData.feedback,
      }, () => {
        setFormData(getInitialFormData());
        setIsCustomCreatedBy(false);
        setIsCustomCustomerName(false);
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
          inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-md transition-all shadow-2xs
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

  // Build options for Created By dropdown
  const createdBySelectOptions = [
    ...(createdByOptions.length > 0
      ? createdByOptions.map((name) => ({ value: name, label: name }))
      : [{ value: '', label: isLoadingClients ? '-- Loading team from Campaign Sheet... --' : '-- No team members found --' }]
    ),
    { value: '__NEW__', label: '+ Enter Custom Created By...' },
  ];

  // Build options for Customer Name dropdown
  let customerNameSelectOptions = [];
  if (allRecords.length === 0) {
    customerNameSelectOptions = [
      { value: '', label: isLoadingClients ? '-- Loading clients... --' : '-- No existing clients found --' }
    ];
  } else if (filteredClients.length > 0) {
    customerNameSelectOptions = filteredClients.map((rec) => ({
      value: rec.customerName,
      label: `${rec.customerName}${rec.businessName ? ` (${rec.businessName})` : ''}${rec.createdBy ? ` - ${rec.createdBy}` : ''}`,
    }));
  } else {
    customerNameSelectOptions = allRecords.map((rec) => ({
      value: rec.customerName,
      label: `${rec.customerName}${rec.businessName ? ` (${rec.businessName})` : ''}`,
    }));
  }
  customerNameSelectOptions.push({ value: '__NEW__', label: '+ Add New Client...' });

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 overflow-hidden">
      {!isUrlConfigured && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3.5 flex items-center justify-between text-xs text-amber-800">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Review & Feedback Google Apps Script Web App URL is not set. Submissions disabled.</span>
          </div>
          <button
            type="button"
            onClick={onOpenSettings}
            className="underline font-semibold hover:text-amber-900 shrink-0 ml-2"
          >
            Configure Review Script URL
          </button>
        </div>
      )}

      {/* Sync Status / Fetch Bar */}
      <div className="bg-slate-100/90 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between text-xs text-slate-700">
        <div className="flex items-center space-x-2 font-medium">
          <Database className="w-4 h-4 text-indigo-600 shrink-0" />
          {isLoadingClients ? (
            <div className="flex items-center space-x-1.5 text-indigo-700">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Fetching clients from Campaign Sheet...</span>
            </div>
          ) : fetchStatus ? (
            <span className={fetchStatus.success ? 'text-slate-800 font-semibold' : 'text-amber-700 font-semibold'}>
              {fetchStatus.message}
            </span>
          ) : (
            <span>Review & Feedback Sheet Ready</span>
          )}
        </div>

        <button
          type="button"
          onClick={loadClientData}
          disabled={isLoadingClients}
          className="flex items-center space-x-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-indigo-300 transition-all shadow-xs active:scale-95"
          title="Reload clients from Campaign Sheet"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingClients ? 'animate-spin' : ''}`} />
          <span>Sync Clients</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
        {/* Client Selection Section */}
        <section className="space-y-4">
          <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-100">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <UserCheck className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Select Client & Staff
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Review Date */}
            <FormInput
              id="date"
              name="date"
              label="Review Date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              icon={Calendar}
              error={touched.date ? errors.date : ''}
            />

            {/* Created By Dropdown */}
            <div className="flex flex-col space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="createdBy" className="text-xs font-semibold text-slate-700">
                  Logged By (Staff Name)
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomCreatedBy(!isCustomCreatedBy)}
                  className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  {isCustomCreatedBy ? '← Select from Dropdown' : '+ Enter Custom'}
                </button>
              </div>

              {!isCustomCreatedBy ? (
                <FormInput
                  id="createdBy"
                  name="createdBy"
                  type="select"
                  value={formData.createdBy}
                  onChange={(e) => {
                    handleCreatedBySelect(e);
                    handleChange(e);
                  }}
                  icon={User}
                  placeholder="-- Select Staff Member --"
                  options={createdBySelectOptions}
                  error={touched.createdBy ? errors.createdBy : ''}
                />
              ) : (
                <FormInput
                  id="createdBy"
                  name="createdBy"
                  placeholder="e.g. John Doe"
                  value={formData.createdBy}
                  onChange={handleChange}
                  icon={User}
                  error={touched.createdBy ? errors.createdBy : ''}
                />
              )}
            </div>

            {/* Customer ID & Customer Name Dropdown */}
            <FormInput
              id="customerId"
              name="customerId"
              label="Customer ID"
              placeholder="e.g. ADB0001"
              value={formData.customerId}
              onChange={handleChange}
              icon={Hash}
              error={touched.customerId ? errors.customerId : ''}
            />

            {/* Customer Name Dropdown */}
            <div className="flex flex-col space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="customerName" className="text-xs font-semibold text-slate-700">
                  Select Customer / Client
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomCustomerName(!isCustomCustomerName)}
                  className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  {isCustomCustomerName ? '← Select from Dropdown' : '+ Enter Custom'}
                </button>
              </div>

              {!isCustomCustomerName ? (
                <FormInput
                  id="customerName"
                  name="customerName"
                  type="select"
                  value={formData.customerName}
                  onChange={(e) => {
                    handleCustomerNameSelect(e);
                    handleChange(e);
                  }}
                  icon={User}
                  placeholder={
                    allRecords.length === 0
                      ? '-- No clients in Campaign Sheet --'
                      : formData.createdBy 
                      ? `-- Select Client for ${formData.createdBy} (${filteredClients.length} found) --` 
                      : `-- Select Client (${allRecords.length} available) --`
                  }
                  options={customerNameSelectOptions}
                  helperText="Selecting a client fills Customer ID & Phone Number below"
                  error={touched.customerName ? errors.customerName : ''}
                />
              ) : (
                <FormInput
                  id="customerName"
                  name="customerName"
                  placeholder="e.g. Rahul Sharma"
                  value={formData.customerName}
                  onChange={handleChange}
                  icon={User}
                  error={touched.customerName ? errors.customerName : ''}
                />
              )}
            </div>

            {/* Business Name & Contact Number (With Call Button) */}
            <FormInput
              id="businessName"
              name="businessName"
              label="Business Name"
              placeholder="e.g. Apex Enterprises"
              value={formData.businessName}
              onChange={handleChange}
              icon={Building}
              error={touched.businessName ? errors.businessName : ''}
            />

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
              Daily Review & Feedback Data (Stored in Review Sheet)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormInput
              id="clientDailyReview"
              name="clientDailyReview"
              label="Client Daily Review"
              type="textarea"
              rows={4}
              placeholder="Enter daily updates, progress, performance metrics discussed with client..."
              value={formData.clientDailyReview}
              onChange={handleChange}
              icon={FileText}
              error={touched.clientDailyReview ? errors.clientDailyReview : ''}
            />

            <FormInput
              id="feedback"
              name="feedback"
              label="Client Feedback"
              type="textarea"
              rows={4}
              placeholder="Enter client feedback, complaints, requests, or next steps..."
              value={formData.feedback}
              onChange={handleChange}
              icon={MessageCircle}
              error={touched.feedback ? errors.feedback : ''}
            />
          </div>
        </section>

        {/* Submit Button Section */}
        <div className="pt-4 border-t border-slate-100">
          <SubmitButton
            isSubmitting={isSubmitting}
            disabled={!isUrlConfigured}
          />
        </div>
      </form>
    </div>
  );
}
