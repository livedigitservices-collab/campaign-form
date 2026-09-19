import React, { useState } from 'react';
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
  AlertCircle
} from 'lucide-react';
import FormInput from './FormInput';
import SubmitButton from './SubmitButton';

const getInitialFormData = () => ({
  date: new Date().toISOString().split('T')[0],
  createdBy: '',
  customerId: '',
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

  // Validation helper: optional validation (only validate format if value is provided)
  const validateField = (name, value) => {
    let error = '';
    const strVal = (value || '').toString().trim();

    if (!strVal) return ''; // All fields are optional

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
        // Reset form callback
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

            {/* Row 2: Customer ID & Customer Name */}
            <FormInput
              id="customerId"
              name="customerId"
              label="Customer ID"
              placeholder="e.g. CUST-1092"
              value={formData.customerId}
              onChange={handleChange}
              icon={Hash}
              error={touched.customerId ? errors.customerId : ''}
            />

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
