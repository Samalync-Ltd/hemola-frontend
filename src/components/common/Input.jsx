import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import styles from './Input.module.css';

// Arabic-Indic (٠-٩) and Persian (۰-۹) digits → Latin, Arabic decimal mark → '.'.
const toLatinDigits = (value) => value
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0))
    .replace(/\u066B/g, '.');

/** Keeps only what a numeric field may hold: 'integer' digits, 'decimal' one point, 'phone' a leading +. */
const sanitizeNumeric = (raw, mode) => {
    const value = toLatinDigits(raw);
    if (mode === 'phone') return value.replace(/(?!^\+)[^\d]/g, '');
    if (mode === 'decimal') {
        const cleaned = value.replace(/[^\d.]/g, '');
        const dot = cleaned.indexOf('.');
        return dot === -1 ? cleaned : cleaned.slice(0, dot + 1) + cleaned.slice(dot + 1).replace(/\./g, '');
    }
    return value.replace(/\D/g, '');
};

const INPUT_MODE = { integer: 'numeric', decimal: 'decimal', phone: 'tel' };

/**
 * `numeric="integer" | "decimal" | "phone"` turns the field into a text input
 * that refuses letters (type="number" still lets Firefox/Safari type them,
 * and rejects Arabic digits). Not for plate numbers or IBANs, which do
 * contain letters.
 */
export const Input = forwardRef(({ label, error, className = '', type, style, numeric, onChange, ...props }, ref) => {
    // Every password field gets a show/hide toggle; nothing else changes.
    const [isVisible, setIsVisible] = useState(false);
    const isPassword = type === 'password';
    return (<div className={`${styles.container} ${className}`}>
        {label && <label className={styles.label}>{label}</label>}
        <div className={styles.inputWrapper}>
          <input
            ref={ref}
            type={numeric ? (numeric === 'phone' ? 'tel' : 'text') : (isPassword && isVisible ? 'text' : type)}
            inputMode={numeric ? INPUT_MODE[numeric] : props.inputMode}
            onChange={numeric ? (e) => {
                const clean = sanitizeNumeric(e.target.value, numeric);
                if (clean !== e.target.value) e.target.value = clean;
                onChange?.(e);
            } : onChange}
            className={`${styles.input} ${error ? styles.errorInput : ''}`}
            style={isPassword ? { ...style, paddingInlineEnd: 44 } : style}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              className={styles.visibilityToggle}
              onClick={() => setIsVisible(v => !v)}
              aria-label={isVisible ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              aria-pressed={isVisible}
              title={isVisible ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              disabled={props.disabled}
            >
              {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
        {error && <span className={styles.errorText}>{error}</span>}
      </div>);
});
Input.displayName = 'Input';
