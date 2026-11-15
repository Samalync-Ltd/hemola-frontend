import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Public.module.css';
import { PublicHeader } from '../../components/public/PublicHeader';
import { PublicFooter } from '../../components/public/PublicFooter';
import { legalPages, legalPlaceholder } from '../../content/legal';
import { landing } from '../../content/landing';
import { usePublicPage } from '../../i18n/language';

/**
 * One of the legal pages (/terms, /privacy, /refund). The text comes from
 * content/legal.js; until the client supplies it, only the heading and a
 * "content will be added" note are shown.
 */
export const LegalPage = ({ page }) => {
    const content = legalPages[page];
    const lang = usePublicPage({
        title: { ar: `${content.title.ar} | ${landing.brand.ar}`, en: `${content.title.en} | ${landing.brand.en}` },
    });
    const paragraphs = content.body[lang];

    return (
        <div className={styles.page}>
            <PublicHeader lang={lang} />
            <main className={styles.legalMain}>
                <div className={styles.container}>
                    <Link to="/" className={styles.backLink}>{lang === 'ar' ? '← الصفحة الرئيسية' : '← Home'}</Link>
                    <article className={styles.legalCard}>
                        <h1 className={`${styles.heading} ${styles.legalTitle}`}>{content.title[lang]}</h1>
                        {paragraphs.length > 0 ? (
                            <div className={styles.legalBody}>
                                {paragraphs.map((text, index) => <p key={index}>{text}</p>)}
                            </div>
                        ) : (
                            <p className={styles.placeholder}>{legalPlaceholder[lang]}</p>
                        )}
                    </article>
                </div>
            </main>
            <PublicFooter lang={lang} />
        </div>
    );
};
