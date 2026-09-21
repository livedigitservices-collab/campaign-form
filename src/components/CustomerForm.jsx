import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  User, 
  Hash, 
  Building, 
  Phone, 
  IndianRupee, 
  Clock, 
  Calculator, 
  MapPin, 
  MessageSquare,
  UserCheck,
  Megaphone,
  AlertCircle,
  RefreshCw,
  PhoneCall,
  FileText,
  MessageCircle,
  Loader2,
  CheckCircle2,
  Database,
  ShieldAlert
} from 'lucide-react';
import FormInput from './FormInput';
import SubmitButton from './SubmitButton';
import { fetchSheetData } from '../services/googleSheets';

// Utility to calculate highest existing Customer ID number from Sheet and local storage
const getNextUniqueCustomerId = (records = [], prefix = 'ADB') => {
  let maxIdNum = 0;
  
  // Scan all existing records in Google Sheets
  records.forEach((rec) => {
    if (rec.customerId) {
      const match = rec.customerId.toString().match(/(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxIdNum) {
          maxIdNum = num;
        }
      }
    }
  });

  // Compare with local counter
  const localCount = parseInt(localStorage.getItem('customer_id_counter') || '1', 10);
  const nextNum = Math.max(maxIdNum + 1, localCount);

  // Format as LD0001, LD0002, etc.
  const formattedNumber = String(nextNum).padStart(4, '0');
  return `${prefix}${formattedNumber}`;
};

const incrementCustomerIdCounter = (records = []) => {
  let maxIdNum = 0;
  records.forEach((rec) => {
    if (rec.customerId) {
      const match = rec.customerId.toString().match(/(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxIdNum) maxIdNum = num;
      }
    }
  });
  const localCount = parseInt(localStorage.getItem('customer_id_counter') || '1', 10);
  const newCount = Math.max(maxIdNum + 1, localCount + 1);
  localStorage.setItem('customer_id_counter', newCount.toString());
};

const getInitialFormData = (records = []) => ({
  date: new Date().toISOString().split('T')[0],
  createdBy: '',
  customerId: getNextUniqueCustomerId(records),
  customerName: '',
  businessName: '',
  contactNumber: '',
  planAmountPerDay: '',
  numberOfDays: '',
  totalAmount: '',
  adsLocations: '',
  businessWhatsAppNumber: '',
  clientDailyReview: '',
  feedback: '',
});

export default function CustomerForm({ onSubmit, isSubmitting, isUrlConfigured, onOpenSettings, webAppUrl }) {
  const [formData, setFormData] = useState(() => getInitialFormData([]));
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Sheet Data state
  const [isLoadingSheetData, setIsLoadingSheetData] = useState(false);
  const [createdByOptions, setCreatedByOptions] = useState([]);
  const [allRecords, setAllRecords] = useState([]);
  const [fetchStatus, setFetchStatus] = useState(null);
  
  // Mode toggles
  const [isCustomCreatedBy, setIsCustomCreatedBy] = useState(false);
  const [isCustomCustomerName, setIsCustomCustomerName] = useState(false);

  // Load sheet data
  const loadSheetData = async () => {
    if (!webAppUrl || !webAppUrl.trim()) return;
    setIsLoadingSheetData(true);
    setFetchStatus(null);

    try {
      const res = await fetchSheetData(webAppUrl);
      if (res.success) {
        const recs = res.records || [];
        setCreatedByOptions(res.createdByList || []);
        setAllRecords(recs);

        // Update initial Customer ID to be higher than max in Sheet if Customer ID hasn't been modified yet
        const nextId = getNextUniqueCustomerId(recs);
        setFormData((prev) => ({
          ...prev,
          customerId: prev.customerId ? prev.customerId : nextId,
        }));
        
        if (recs.length > 0) {
          setFetchStatus({
            success: true,
            message: `Connected to Sheet! Loaded ${recs.length} records. Next unique ID: ${nextId}`,
          });
        } else {
          setFetchStatus({
            success: true,
            message: 'Connected to Google Sheet',
          });
        }
      } else {
        setFetchStatus({
          success: false,
          message: res.error || 'Could not fetch data. Please check Web App deployment.',
        });
      }
    } catch (err) {
      setFetchStatus({
        success: false,
        message: 'Network error connecting to Google Sheet.',
      });
    } finally {
      setIsLoadingSheetData(false);
    }
  };

  useEffect(() => {
    loadSheetData();
  }, [webAppUrl]);

  // Handle manual regenerate unique ID
  const handleRegenerateId = () => {
    const newId = getNextUniqueCustomerId(allRecords);
    setFormData((prev) => ({ ...prev, customerId: newId }));
  };

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

  // Handle Customer Name Dropdown change & Auto Populate
  const handleCustomerNameSelect = (e) => {
    const selectedName = e.target.value;

    if (selectedName === '__NEW__') {
      setIsCustomCustomerName(true);
      setFormData((prev) => ({
        ...prev,
        customerName: '',
        customerId: getNextUniqueCustomerId(allRecords),
        businessName: '',
        contactNumber: '',
        planAmountPerDay: '',
        numberOfDays: '',
        totalAmount: '',
        adsLocations: '',
        businessWhatsAppNumber: '',
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
          customerId: matched.customerId || prev.customerId,
          businessName: matched.businessName || '',
          contactNumber: matched.contactNumber || '',
          planAmountPerDay: matched.planAmountPerDay || '',
          numberOfDays: matched.numberOfDays || '',
          totalAmount: matched.totalAmount || '',
          adsLocations: matched.adsLocations || '',
          businessWhatsAppNumber: matched.businessWhatsAppNumber || '',
          clientDailyReview: matched.clientDailyReview || '',
          feedback: matched.feedback || '',
        }));
      } else {
        setFormData((prev) => ({ ...prev, customerName: selectedName }));
      }
    }
  };

  // Validate fields including unique Customer ID check
  const validateField = (name, value) => {
    let error = '';
    const strVal = (value || '').toString().trim();

    if (!strVal) return '';

    switch (name) {
      case 'customerId':
        // Check if customer ID is already used by a DIFFERENT customer in Google Sheets
        if (strVal) {
          const duplicate = allRecords.find(
            (rec) => 
              rec.customerId && 
              rec.customerId.trim().toLowerCase() === strVal.toLowerCase() &&
              rec.customerName !== formData.customerName // Allow if editing same customer
          );
          if (duplicate) {
            error = `Customer ID "${strVal}" is already used by ${duplicate.customerName}. IDs must be unique.`;
          }
        }
        break;
      case 'contactNumber':
      case 'businessWhatsAppNumber':
        if (!/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,14}$/.test(strVal)) {
          error = 'Enter a valid phone number';
        }
        break;
      case 'planAmountPerDay':
      case 'numberOfDays':
      case 'totalAmount':
        if (isNaN(Number(strVal)) || Number(strVal) < 0) {
          error = 'Must be a valid non-negative number';
        }
        break;
      default:
        break;
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
      if (err) {
        newErrors[key] = err;
      }
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
      onSubmit(formData, () => {
        incrementCustomerIdCounter(allRecords);
        setFormData(getInitialFormData(allRecords));
        setIsCustomCreatedBy(false);
        setIsCustomCustomerName(false);
        setErrors({});
        setTouched({});
        // Re-fetch sheet data
        loadSheetData();
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

  // Build options list for Created By dropdown
  const createdBySelectOptions = [
    ...(createdByOptions.length > 0
      ? createdByOptions.map((name) => ({ value: name, label: name }))
      : [{ value: '', label: isLoadingSheetData ? '-- Loading from Sheet... --' : '-- No team members in Sheet yet --' }]
    ),
    { value: '__NEW__', label: '+ Enter Custom Created By...' },
  ];

  // Build options list for Customer Name dropdown
  let customerNameSelectOptions = [];
  if (allRecords.length === 0) {
    customerNameSelectOptions = [
      { value: '', label: isLoadingSheetData ? '-- Loading clients from Sheet... --' : '-- No existing clients in Sheet --' }
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
            <span>Google Apps Script Web App URL is not set. Submissions and data fetch will be disabled.</span>
          </div>
          <button
            type="button"
            onClick={onOpenSettings}
            className="underline font-semibold hover:text-amber-900 shrink-0 ml-2"
          >
            Configure Now
          </button>
        </div>
      )}

      {/* Sync Status / Fetch Bar */}
      {isUrlConfigured && (
        <div className="bg-slate-100/90 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between text-xs text-slate-700">
          <div className="flex items-center space-x-2 font-medium">
            <Database className="w-4 h-4 text-indigo-600 shrink-0" />
            {isLoadingSheetData ? (
              <div className="flex items-center space-x-1.5 text-indigo-700">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Checking unique Customer IDs & fetching sheet records...</span>
              </div>
            ) : fetchStatus ? (
              <span className={fetchStatus.success ? 'text-slate-800 font-semibold' : 'text-amber-700 font-semibold'}>
                {fetchStatus.message}
              </span>
            ) : (
              <span>Google Sheet Sync Active</span>
            )}
          </div>

          <button
            type="button"
            onClick={loadSheetData}
            disabled={isLoadingSheetData}
            className="flex items-center space-x-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-indigo-300 transition-all shadow-xs active:scale-95"
            title="Reload data from Google Sheet"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSheetData ? 'animate-spin' : ''}`} />
            <span>Sync Sheet</span>
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
        {/* Customer Details Section */}
        <section className="space-y-4">
          <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-100">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <UserCheck className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Customer Details
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Row 1: Date & Created By */}
            <FormInput
              id="date"
              name="date"
              label="Date"
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
                  Created By
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
                  placeholder="-- Select Person from Sheet --"
                  options={createdBySelectOptions}
                  helperText={
                    createdByOptions.length > 0 
                      ? `${createdByOptions.length} team members found in Sheet` 
                      : 'Select person to filter clients'
                  }
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

            {/* Row 2: Customer ID (UNIQUE UNCOMPROMISED AUTO-GENERATED FIELD) & Customer Name */}
            <div className="flex flex-col space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="customerId" className="text-xs font-semibold text-slate-700 flex items-center">
                  <span>Customer ID</span>
                </label>
                <button
                  type="button"
                  onClick={handleRegenerateId}
                  className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                  title="Generate Next Unique ID"
                >
                  <RefreshCw className="w-3 h-3 mr-0.5" /> Next Unique ID
                </button>
              </div>
              <FormInput
                id="customerId"
                name="customerId"
                placeholder="e.g. LD0001"
                value={formData.customerId}
                onChange={handleChange}
                icon={Hash}
                helperText="Strictly unique ID (auto-increments higher than all existing Sheet IDs)"
                error={touched.customerId ? errors.customerId : ''}
              />
            </div>

            {/* Customer Name Dropdown */}
            <div className="flex flex-col space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="customerName" className="text-xs font-semibold text-slate-700">
                  Customer Name
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
                      ? '-- No clients in Sheet yet --'
                      : formData.createdBy 
                      ? `-- Select Client for ${formData.createdBy} (${filteredClients.length} found) --` 
                      : `-- Select Client (${allRecords.length} found in Sheet) --`
                  }
                  options={customerNameSelectOptions}
                  helperText={
                    allRecords.length > 0 
                      ? 'Selecting a client auto-populates all form details' 
                      : 'Submit a entry to add clients to dropdown'
                  }
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

            {/* Row 3: Business Name & Contact Number (with Call Button) */}
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

        {/* Campaign Details Section */}
        <section className="space-y-4">
          <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-100">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Megaphone className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Campaign Details
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Row 1: Plan Amount Per Day & Number of Days */}
            <FormInput
              id="planAmountPerDay"
              name="planAmountPerDay"
              label="Plan Amount Per Day"
              type="number"
              min="0"
              step="any"
              placeholder="e.g. 500"
              value={formData.planAmountPerDay}
              onChange={handleChange}
              icon={IndianRupee}
              error={touched.planAmountPerDay ? errors.planAmountPerDay : ''}
            />

            <FormInput
              id="numberOfDays"
              name="numberOfDays"
              label="Number of Days"
              type="number"
              min="0"
              step="1"
              placeholder="e.g. 10"
              value={formData.numberOfDays}
              onChange={handleChange}
              icon={Clock}
              error={touched.numberOfDays ? errors.numberOfDays : ''}
            />

            {/* Row 2: Total Amount & Ads Locations */}
            <FormInput
              id="totalAmount"
              name="totalAmount"
              label="Total Amount"
              type="number"
              min="0"
              step="any"
              placeholder="e.g. 5000"
              value={formData.totalAmount}
              onChange={handleChange}
              icon={Calculator}
              error={touched.totalAmount ? errors.totalAmount : ''}
            />

            <FormInput
              id="adsLocations"
              name="adsLocations"
              label="Ads Locations"
              placeholder="e.g. Mumbai, Delhi NCR, Bangalore"
              value={formData.adsLocations}
              onChange={handleChange}
              icon={MapPin}
              error={touched.adsLocations ? errors.adsLocations : ''}
            />

            {/* Row 3: Business WhatsApp Number (with Call Button) */}
            <div className="md:col-span-2">
              <FormInput
                id="businessWhatsAppNumber"
                name="businessWhatsAppNumber"
                label="Business WhatsApp Number"
                type="tel"
                placeholder="e.g. 9876543210"
                value={formData.businessWhatsAppNumber}
                onChange={handleChange}
                icon={MessageSquare}
                actionButton={renderCallButton(formData.businessWhatsAppNumber)}
                error={touched.businessWhatsAppNumber ? errors.businessWhatsAppNumber : ''}
              />
            </div>
          </div>
        </section>

        {/* Client Review & Feedback Section */}
        <section className="space-y-4">
          <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-100">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <FileText className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Review & Feedback
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormInput
              id="clientDailyReview"
              name="clientDailyReview"
              label="Client Daily Review"
              type="textarea"
              rows={3}
              placeholder="Enter daily updates, progress, or campaign performance review..."
              value={formData.clientDailyReview}
              onChange={handleChange}
              icon={FileText}
              error={touched.clientDailyReview ? errors.clientDailyReview : ''}
            />

            <FormInput
              id="feedback"
              name="feedback"
              label="Feedback"
              type="textarea"
              rows={3}
              placeholder="Enter client feedback, complaints, or suggestions..."
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
            disabled={!isUrlConfigured || Boolean(errors.customerId)}
          />
        </div>
      </form>
    </div>
  );
}
