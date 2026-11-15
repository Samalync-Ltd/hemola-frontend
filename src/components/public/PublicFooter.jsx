import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../../pages/public/Public.module.css';
import { landing, legalLinks, contactLabels } from '../../content/landing';
import { company } from '../../content/company';

/**
 * Legal links, contact details and copyright. A contact line whose value is
 * empty in content/company.ts is not shown at all.
 */
export const PublicFooter = ({ lang }) => {
    const legalName = company.legalName[lang] || landing.brand[lang];
    const lines = [
        { key: 'registration', label: contactLabels.registration[lang], value: company.commercialRegistrationNumber },
        { key: 'email', label: contactLabels.email[lang], value: company.email, href: company.email && `mailto:${company.email}` },
        { key: 'phone', label: contactLabels.phone[lang], value: company.phone, href: company.phone && `tel:${company.phone.replace(/\s+/g, '')}`, ltr: true },
        { key: 'address', label: contactLabels.address[lang], value: company.address[lang] },
    ].filter((line) => line.value && line.value.trim());

    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.footerGrid}>
                    <div>
                        <h2 className={`${styles.heading} ${styles.footerTitle}`}>{landing.brand[lang]}</h2>
                    </div>
                    <nav aria-label={lang === 'ar' ? 'روابط قانونية' : 'Legal'}>
                        <ul className={styles.footerLinks}>
                            {legalLinks.map((link) => (
                                <li key={link.path}><Link to={link.path}>{link.label[lang]}</Link></li>
                            ))}
                        </ul>
                    </nav>
                    {lines.length > 0 && (
                        <div>
                            <h2 className={`${styles.heading} ${styles.footerTitle}`}>{contactLabels.title[lang]}</h2>
                            <dl className={styles.footerContact} style={{ margin: 0 }}>
                                {lines.map((line) => (
                                    <div key={line.key}>
                                        <dt>{line.label}</dt>
                                        <dd>
                                            {line.href
                                                ? <a href={line.href} dir={line.ltr || line.key === 'email' ? 'ltr' : undefined}>{line.value}</a>
                                                : line.value}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    )}
                </div>
                <p className={styles.copyright}>© {new Date().getFullYear()} {legalName}</p>
            </div>
        </footer>
    );
};
