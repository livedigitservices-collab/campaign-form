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
  RefreshCw
} from 'lucide-react';
import FormInput from './FormInput';
import SubmitButton from './SubmitButton';

// Utility to generate unique Customer ID like LD0001
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
  planAmountPerDay: '',
  numberOfDays: '',
  totalAmount: '',
  adsLocations: '',
  businessWhatsAppNumber: '',
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
    const newId = generateNextCustomerId();
    setFormData((prev) => ({ ...prev, customerId: newId }));
  };

  // Validation helper: optional validation
  const validateField = (name, value) => {
    let error = '';
    const strVal = (value || '').toString().trim();

    if (!strVal) return '';

    switch (name) {
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
        // Increment the unique Customer ID counter for the next entry
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

            {/* Row 2: Customer ID (Auto Generated Unique ID) & Customer Name */}
            <div className="flex flex-col space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="customerId" className="text-xs font-semibold text-slate-700">
                  Customer ID
                </label>
                <button
                  type="button"
                  onClick={handleRegenerateId}
                  className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                  title="Generate ID"
                >
                  <RefreshCw className="w-3 h-3 mr-0.5" /> Auto-Generated
                </button>
              </div>
              <FormInput
                id="customerId"
                name="customerId"
                label=""
                placeholder="e.g. LD0001"
                value={formData.customerId}
                onChange={handleChange}
                icon={Hash}
                helperText="Unique ID automatically assigned (e.g. LD0001)"
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

            {/* Row 3: Business WhatsApp Number */}
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
                error={touched.businessWhatsAppNumber ? errors.businessWhatsAppNumber : ''}
              />
            </div>
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
