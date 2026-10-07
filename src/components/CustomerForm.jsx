import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  User, 
  Hash, 
  Building, 
  Phone, 
  MapPin, 
  Globe, 
  Megaphone, 
  FileText, 
  UserCheck, 
  AlertCircle, 
  RefreshCw,
  Clock,
  MessageSquare
} from 'lucide-react';
import FormInput from './FormInput';
import SubmitButton from './SubmitButton';

// Utility to generate unique Customer ID like ADB0001
const generateNextCustomerId = () => {
  const currentCount = parseInt(localStorage.getItem('customer_id_counter') || '1', 10);
  const formattedNumber = String(currentCount).padStart(4, '0');
  return `ADB${formattedNumber}`;
};

const incrementCustomerIdCounter = () => {
  const currentCount = parseInt(localStorage.getItem('customer_id_counter') || '1', 10);
  localStorage.setItem('customer_id_counter', (currentCount + 1).toString());
};

const getInitialFormData = () => ({
  date: new Date().toISOString().split('T')[0],
  createdBy: '',
  customerId: generateNextCustomerId(),
  customerName: '',
  businessName: '',
  contactNumber: '',
  businessLocation: '',
  hasWebsite: '',
  hasRunAdsBefore: '',
  marketingRequirements: '',
  followUpDate: '',
  remarks: '',
});

export default function CustomerForm({ onSubmit, isSubmitting, isUrlConfigured, onOpenSettings }) {
  const [formData, setFormData] = useState(getInitialFormData);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Ensure customerId is generated on mount if empty
  useEffect(() => {
    if (!formData.customerId) {
      setFormData((prev) => ({ ...prev, customerId: generateNextCustomerId() }));
    }
  }, []);

  const handleRegenerateId = () => {
    incrementCustomerIdCounter();
    const newId = generateNextCustomerId();
    setFormData((prev) => ({ ...prev, customerId: newId }));
  };

  // Validation helper: optional validation
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
        // Increment unique Customer ID counter for next entry
        incrementCustomerIdCounter();
        // Reset form with new Customer ID
        setFormData(getInitialFormData());
        setErrors({});
        setTouched({});
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 overflow-hidden">
      {!isUrlConfigured && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3.5 flex items-center justify-between text-xs text-amber-800">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Google Apps Script Web App URL is not set. Submissions will be disabled.</span>
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

      <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-6 sm:space-y-8">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
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

            <FormInput
              id="createdBy"
              name="createdBy"
              label="Created By"
              placeholder="e.g. John Doe"
              value={formData.createdBy}
              onChange={handleChange}
              icon={User}
              error={touched.createdBy ? errors.createdBy : ''}
            />

            {/* Row 2: Customer ID (Auto-Generated Unique Field) & Customer Name */}
            <div className="flex flex-col space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="customerId" className="text-xs font-semibold text-slate-700 flex items-center">
                  <span>Customer ID</span>
                  <span className="ml-1.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    Unique
                  </span>
                </label>
                <button
                  type="button"
                  onClick={handleRegenerateId}
                  className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                  title="Generate New Unique ID"
                >
                  <RefreshCw className="w-3 h-3 mr-0.5" /> Next Unique ID
                </button>
              </div>
              <FormInput
                id="customerId"
                name="customerId"
                placeholder="e.g. ADB0001"
                value={formData.customerId}
                onChange={handleChange}
                icon={Hash}
                helperText="Guaranteed unique ID automatically assigned (e.g. ADB0001)"
                error={touched.customerId ? errors.customerId : ''}
              />
            </div>

            <FormInput
              id="customerName"
              name="customerName"
              label="Customer Name"
              placeholder="e.g. Rahul Sharma"
              value={formData.customerName}
              onChange={handleChange}
              icon={User}
              error={touched.customerName ? errors.customerName : ''}
            />

            {/* Row 3: Business Name & Contact Number */}
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
              error={touched.contactNumber ? errors.contactNumber : ''}
            />
          </div>
        </section>

        {/* Campaign & Marketing Details Section */}
        <section className="space-y-4">
          <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-100">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Megaphone className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Campaign & Marketing Details
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {/* Row 1: Business Location & Website Dropdown */}
            <FormInput
              id="businessLocation"
              name="businessLocation"
              label="Business Location"
              placeholder="e.g. Hyderabad, Telangana"
              value={formData.businessLocation}
              onChange={handleChange}
              icon={MapPin}
              error={touched.businessLocation ? errors.businessLocation : ''}
            />

            <FormInput
              id="hasWebsite"
              name="hasWebsite"
              label="Do you have a website?"
              type="select"
              value={formData.hasWebsite}
              onChange={handleChange}
              icon={Globe}
              placeholder="-- Select Option --"
              options={[
                { value: 'Yes', label: 'Yes' },
                { value: 'No', label: 'No' },
              ]}
              error={touched.hasWebsite ? errors.hasWebsite : ''}
            />

            {/* Row 2: Digital Marketing Ads Before Dropdown & Marketing Requirements */}
            <FormInput
              id="hasRunAdsBefore"
              name="hasRunAdsBefore"
              label="Have you run digital marketing ads before?"
              type="select"
              value={formData.hasRunAdsBefore}
              onChange={handleChange}
              icon={Megaphone}
              placeholder="-- Select Option --"
              options={[
                { value: 'Yes', label: 'Yes' },
                { value: 'No', label: 'No' },
              ]}
              error={touched.hasRunAdsBefore ? errors.hasRunAdsBefore : ''}
            />

            <FormInput
              id="marketingRequirements"
              name="marketingRequirements"
              label="What are your current marketing requirements?"
              placeholder="e.g. Lead generation, social media ads, brand awareness..."
              value={formData.marketingRequirements}
              onChange={handleChange}
              icon={FileText}
              error={touched.marketingRequirements ? errors.marketingRequirements : ''}
            />

            {/* Row 3: Follow-up Date & Remarks */}
            <FormInput
              id="followUpDate"
              name="followUpDate"
              label="Follow-up Date"
              type="date"
              value={formData.followUpDate}
              onChange={handleChange}
              icon={Clock}
              helperText="Select date for next follow-up"
              error={touched.followUpDate ? errors.followUpDate : ''}
            />

            <FormInput
              id="remarks"
              name="remarks"
              label="Remarks"
              placeholder="e.g. Client requested callback next Monday..."
              value={formData.remarks}
              onChange={handleChange}
              icon={MessageSquare}
              helperText="Additional notes or comments"
              error={touched.remarks ? errors.remarks : ''}
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
