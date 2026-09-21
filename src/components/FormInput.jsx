import React from 'react';

export default function FormInput({
  id,
  name,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  readOnly = false,
  error = '',
  icon: Icon,
  prefix = null,
  min,
  step,
  rows = 3,
  options = null,
  actionButton = null,
  className = '',
  helperText = '',
}) {
  return (
    <div className={`flex flex-col space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-slate-700 flex items-center justify-between">
          <span>
            {label} {required && <span className="text-red-500 font-bold ml-0.5">*</span>}
          </span>
          {readOnly && (
            <span className="text-[10px] font-medium uppercase tracking-wider text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-sm">
              Auto-calculated
            </span>
          )}
        </label>
      )}

      <div className="relative rounded-lg shadow-xs flex items-center">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 z-10">
            <Icon className="w-4 h-4" />
          </div>
        )}

        {prefix && !Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none font-semibold text-slate-500 text-sm z-10">
            {prefix}
          </div>
        )}

        {type === 'textarea' ? (
          <textarea
            id={id}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            readOnly={readOnly}
            rows={rows}
            className={`
              w-full rounded-lg border text-sm transition-all duration-150 py-2.5 px-3
              ${Icon ? 'pl-9' : prefix ? 'pl-8' : 'pl-3'}
              ${actionButton ? 'pr-20' : 'pr-3'}
              ${readOnly 
                ? 'bg-slate-100 text-slate-900 font-semibold border-slate-300 cursor-not-allowed select-none' 
                : 'bg-white text-slate-800 border-slate-300 hover:border-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
              }
              ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-200 bg-red-50/20' : ''}
            `}
          />
        ) : type === 'select' ? (
          <select
            id={id}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            className={`
              w-full rounded-lg border text-sm transition-all duration-150 py-2.5 px-3 appearance-none bg-white
              ${Icon ? 'pl-9' : prefix ? 'pl-8' : 'pl-3'}
              ${actionButton ? 'pr-20' : 'pr-8'}
              ${readOnly 
                ? 'bg-slate-100 text-slate-900 font-semibold border-slate-300 cursor-not-allowed select-none' 
                : 'bg-white text-slate-800 border-slate-300 hover:border-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
              }
              ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-200 bg-red-50/20' : ''}
            `}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {Array.isArray(options) && options.map((opt, idx) => {
              const val = typeof opt === 'object' ? opt.value : opt;
              const lbl = typeof opt === 'object' ? opt.label : opt;
              return (
                <option key={idx} value={val}>
                  {lbl}
                </option>
              );
            })}
          </select>
        ) : (
          <input
            id={id}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            readOnly={readOnly}
            min={min}
            step={step}
            className={`
              w-full rounded-lg border text-sm transition-all duration-150 py-2.5 px-3
              ${Icon ? 'pl-9' : prefix ? 'pl-8' : 'pl-3'}
              ${actionButton ? 'pr-20' : 'pr-3'}
              ${readOnly 
                ? 'bg-slate-100 text-slate-900 font-semibold border-slate-300 cursor-not-allowed select-none' 
                : 'bg-white text-slate-800 border-slate-300 hover:border-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
              }
              ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-200 bg-red-50/20' : ''}
            `}
          />
        )}

        {actionButton && (
          <div className="absolute right-1.5 flex items-center z-10">
            {actionButton}
          </div>
        )}
      </div>

      {helperText && !error && (
        <p className="text-xs text-slate-400">{helperText}</p>
      )}

      {error && (
        <p className="text-xs text-red-500 font-medium flex items-center mt-1">
          <span className="inline-block w-1 h-1 rounded-full bg-red-500 mr-1.5"></span>
          {error}
        </p>
      )}
    </div>
  );
}
