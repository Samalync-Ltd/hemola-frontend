import React from 'react';
import styles from './LanguageSwitch.module.css';
import { setLanguage, useLanguage } from '../../i18n/language';

/**
 * AR | EN for the platform (header, sign-in, registration) — the same
 * switch as on the landing page, and the same saved choice.
 */
export const LanguageSwitch = ({ className = '' }) => {
    const lang = useLanguage();
    return (
        <div className={`${styles.switch} ${className}`} dir="ltr" role="group" aria-label="Language / اللغة">
            <button type="button" className={styles.button} aria-pressed={lang === 'ar'} onClick={() => setLanguage('ar')} lang="ar">AR</button>
            <button type="button" className={styles.button} aria-pressed={lang === 'en'} onClick={() => setLanguage('en')} lang="en">EN</button>
        </div>
    );
};
