import React from 'react';
import styles from './PriceBlock.module.css';
import { formatPrice } from '../../utils/format';
export const PriceBlock = ({ amount, label, size = 'md' }) => {
    return (<div className={`${styles.container} ${size === 'lg' ? styles.lg : ''}`}>
      {label && <span className={styles.label}>{label}</span>}
      <span className={styles.price}>{formatPrice(amount)}</span>
    </div>);
};
