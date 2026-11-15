import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../../pages/public/Public.module.css';
import { landing } from '../../content/landing';
import { setLanguage } from '../../i18n/language';

/** AR | EN — the choice is remembered (see i18n/language.js). */
export const LanguageSwitch = ({ lang }) => (
    <div className={styles.langSwitch} dir="ltr" role="group" aria-label="Language / اللغة">
        <button type="button" className={styles.langBtn} aria-pressed={lang === 'ar'} onClick={() => setLanguage('ar')} lang="ar">AR</button>
        <button type="button" className={styles.langBtn} aria-pressed={lang === 'en'} onClick={() => setLanguage('en')} lang="en">EN</button>
    </div>
);

/** Top bar: logo, AR | EN, Sign in, Create account. */
export const PublicHeader = ({ lang }) => (
    <header className={styles.topbar}>
        <div className={`${styles.container} ${styles.topbarInner}`}>
            <Link to="/" className={styles.brand} aria-label={landing.brand[lang]}>
                <img src="/logos/1.png" alt="" className={styles.brandLogo} width="36" height="36" />
                <span className={styles.brandName}>{landing.brand[lang]}</span>
            </Link>
            <LanguageSwitch lang={lang} />
            <Link to="/login" className={`${styles.btn} ${styles.btnOutline}`}>{landing.signIn[lang]}</Link>
            <Link to="/register" className={`${styles.btn} ${styles.btnPrimary}`}>{landing.createAccount[lang]}</Link>
        </div>
    </header>
);
