import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import styles from './Input.module.css';
export const Input = forwardRef(({ label, error, className = '', type, style, ...props }, ref) => {
    // Every password field gets a show/hide toggle; nothing else changes.
    const [isVisible, setIsVisible] = useState(false);
    const isPassword = type === 'password';
    return (<div className={`${styles.container} ${className}`}>
        {label && <label className={styles.label}>{label}</label>}
        <div className={styles.inputWrapper}>
          <input
            ref={ref}
            type={isPassword && isVisible ? 'text' : type}
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
