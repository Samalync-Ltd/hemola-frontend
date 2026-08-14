import React, { forwardRef } from 'react';
import styles from './Input.module.css';
export const Input = forwardRef(({ label, error, className = '', ...props }, ref) => {
    return (<div className={`${styles.container} ${className}`}>
        {label && <label className={styles.label}>{label}</label>}
        <input ref={ref} className={`${styles.input} ${error ? styles.errorInput : ''}`} {...props}/>
        {error && <span className={styles.errorText}>{error}</span>}
      </div>);
});
Input.displayName = 'Input';
