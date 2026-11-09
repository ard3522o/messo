import clsx from 'clsx';

export function Field({ label, htmlFor, error, hint, required, children, className }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="label">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      {children}
      {error ? <p className="help">{error}</p> : hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
    </div>
  );
}

export function Input({ label, error, hint, className, id, required, ...props }) {
  const inputId = id || `input-${props.name || Math.random().toString(36).slice(2)}`;
  return (
    <Field label={label} htmlFor={inputId} error={error} hint={hint} required={required} className={className}>
      <input id={inputId} className={clsx('input', error && 'input-error')} {...props} />
    </Field>
  );
}

export function Textarea({ label, error, hint, className, id, required, rows = 4, ...props }) {
  const inputId = id || `textarea-${props.name || Math.random().toString(36).slice(2)}`;
  return (
    <Field label={label} htmlFor={inputId} error={error} hint={hint} required={required} className={className}>
      <textarea id={inputId} rows={rows} className={clsx('input resize-y', error && 'input-error')} {...props} />
    </Field>
  );
}

export function Select({ label, error, hint, className, id, required, options, children, placeholder, ...props }) {
  const inputId = id || `select-${props.name || Math.random().toString(36).slice(2)}`;
  return (
    <Field label={label} htmlFor={inputId} error={error} hint={hint} required={required} className={className}>
      <select id={inputId} className={clsx('input appearance-none bg-white pr-8', error && 'input-error')} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options
          ? options.map((option) => {
              const value = typeof option === 'string' ? option : option.value;
              const optLabel = typeof option === 'string' ? option : option.label;
              return (
                <option key={value} value={value}>
                  {optLabel}
                </option>
              );
            })
          : children}
      </select>
    </Field>
  );
}
