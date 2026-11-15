import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../../pages/public/Public.module.css';
import { landing, sectionLinks } from '../../content/landing';
import { setLanguage } from '../../i18n/language';

/** AR | EN — the choice is remembered (see i18n/language.js). */
export const LanguageSwitch = ({ lang, tone = 'light' }) => (
    <div className={`${styles.langSwitch} ${tone === 'dark' ? styles.langSwitchDark : ''}`} dir="ltr" role="group" aria-label="Language / اللغة">
        <button type="button" className={styles.langBtn} aria-pressed={lang === 'ar'} onClick={() => setLanguage('ar')} lang="ar">AR</button>
        <button type="button" className={styles.langBtn} aria-pressed={lang === 'en'} onClick={() => setLanguage('en')} lang="en">EN</button>
    </div>
);

/** Logo tile + name; the name is hidden on the narrowest phones. */
export const Brand = ({ lang, className = '' }) => (
    <Link to="/" className={`${styles.brand} ${className}`} aria-label={landing.brand[lang]}>
        <img src="/landing/logo-96.png" alt="" className={styles.brandLogo} width="40" height="40" />
        <span className={styles.brandName}>{landing.brand[lang]}</span>
    </Link>
);

/** Top bar: logo, section links (wide screens), AR | EN, Sign in, Create account. */
export const PublicHeader = ({ lang }) => (
    <header className={styles.topbar}>
        <div className={`${styles.container} ${styles.topbarInner}`}>
            <Brand lang={lang} />
            <nav className={styles.topnav} aria-label={lang === 'ar' ? 'أقسام الصفحة' : 'Page sections'}>
                {sectionLinks.filter((link) => link.href !== '/#app').map((link) => (
                    <a key={link.href} href={link.href} className={styles.topnavLink}>{link.label[lang]}</a>
                ))}
            </nav>
            <LanguageSwitch lang={lang} />
            <Link to="/login" className={`${styles.btn} ${styles.btnGhost}`}>{landing.signIn[lang]}</Link>
            <Link to="/register" className={`${styles.btn} ${styles.btnPrimary}`}>{landing.createAccount[lang]}</Link>
        </div>
    </header>
);
