import React from 'react';
import styles from './Card.module.css';
export const Card = ({ children, variant = 'default', shadow = 'none', className = '', ...props }) => {
    const classes = [
        styles.card,
        variant === 'dark' ? styles.dark : '',
        shadow === 'sm' ? styles.shadowSm : '',
        shadow === 'md' ? styles.shadowMd : '',
        className
    ].filter(Boolean).join(' ');
    return (<div className={classes} {...props}>
      {children}
    </div>);
};
