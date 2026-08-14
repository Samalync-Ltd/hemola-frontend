import React, { forwardRef } from 'react';
import styles from './Select.module.css';
export const Select = forwardRef(({ label, error, options, className = '', ...props }, ref) => {
    return (<div className={`${styles.container} ${className}`}>
        {label && <label className={styles.label}>{label}</label>}
        <select ref={ref} className={`${styles.select} ${error ? styles.errorSelect : ''}`} {...props}>
          {options.map((opt) => (<option key={opt.value} value={opt.value}>
              {opt.label}
            </option>))}
        </select>
        {error && <span className={styles.errorText}>{error}</span>}
      </div>);
});
Select.displayName = 'Select';
