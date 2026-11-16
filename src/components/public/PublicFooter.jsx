import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, FileText } from 'lucide-react';
import styles from '../../pages/public/Public.module.css';
import { landing, legalLinks, contactLabels, sectionLinks } from '../../content/landing';
import { company } from '../../content/company';
import { isLegalPagePublished } from '../../content/legal';
import { Brand, LanguageSwitch } from './PublicHeader';

/**
 * Logo, section links, legal links, contact details and copyright. A contact
 * line whose value is empty in content/company.ts is not shown at all (and the
 * whole contact column is hidden while all of them are empty).
 */
export const PublicFooter = ({ lang }) => {
    const legalName = company.legalName[lang] || landing.brand[lang];
    const publishedLegalLinks = legalLinks.filter((link) => isLegalPagePublished(link.page));
    const lines = [
        { key: 'registration', icon: FileText, label: contactLabels.registration[lang], value: company.commercialRegistrationNumber, ltr: true },
        { key: 'email', icon: Mail, label: contactLabels.email[lang], value: company.email, href: company.email && `mailto:${company.email}`, ltr: true },
        { key: 'phone', icon: Phone, label: contactLabels.phone[lang], value: company.phone, href: company.phone && `tel:${company.phone.replace(/\s+/g, '')}`, ltr: true },
        { key: 'address', icon: MapPin, label: contactLabels.address[lang], value: company.address[lang] },
    ].filter((line) => line.value && line.value.trim());

    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={`${styles.footerGrid} ${lines.length > 0 ? styles.footerGridWithContact : ''}`}>
                    <div className={styles.footerBrand}>
                        <Brand lang={lang} className={styles.brandOnDark} />
                        <p className={styles.footerTagline}>{landing.hero.subtitle[lang]}</p>
                    </div>

                    <nav aria-labelledby="footer-platform">
                        <h2 id="footer-platform" className={`${styles.heading} ${styles.footerTitle}`}>{landing.footer.platform[lang]}</h2>
                        <ul className={styles.footerLinks}>
                            {sectionLinks.map((link) => (
                                <li key={link.href}><a href={link.href}>{link.label[lang]}</a></li>
                            ))}
                            <li><Link to="/login">{landing.signIn[lang]}</Link></li>
                            <li><Link to="/register">{landing.createAccount[lang]}</Link></li>
                        </ul>
                    </nav>

                    {publishedLegalLinks.length > 0 && (
                        <nav aria-labelledby="footer-legal">
                            <h2 id="footer-legal" className={`${styles.heading} ${styles.footerTitle}`}>{landing.footer.legal[lang]}</h2>
                            <ul className={styles.footerLinks}>
                                {publishedLegalLinks.map((link) => (
                                    <li key={link.path}><Link to={link.path}>{link.label[lang]}</Link></li>
                                ))}
                            </ul>
                        </nav>
                    )}

                    {lines.length > 0 && (
                        <div>
                            <h2 className={`${styles.heading} ${styles.footerTitle}`}>{contactLabels.title[lang]}</h2>
                            <dl className={styles.footerContact}>
                                {lines.map(({ key, icon: Icon, label, value, href, ltr }) => (
                                    <div key={key} className={styles.footerContactLine}>
                                        <Icon size={16} aria-hidden="true" className={styles.footerContactIcon} />
                                        <div>
                                            <dt>{label}</dt>
                                            <dd>
                                                {/* Numbers and emails keep their own order inside an Arabic line. */}
                                                {href
                                                    ? <a href={href} dir={ltr ? 'ltr' : undefined}>{value}</a>
                                                    : <span dir={ltr ? 'ltr' : undefined}>{value}</span>}
                                            </dd>
                                        </div>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    )}
                </div>

                <div className={styles.footerBottom}>
                    <p className={styles.copyright}>© {new Date().getFullYear()} {legalName}</p>
                    <LanguageSwitch lang={lang} tone="dark" />
                </div>
            </div>
        </footer>
    );
};
