import React from 'react';
import styles from './Button.module.css';
export const Button = ({ children, variant = 'primary', size = 'md', isLoading, className = '', disabled, ...props }) => {
    const classes = [
        styles.button,
        styles[variant],
        styles[size],
        className
    ].filter(Boolean).join(' ');
    return (<button className={classes} disabled={disabled || isLoading} {...props}>
      {isLoading ? <span className={styles.spinner}/> : null}
      {children}
    </button>);
};
