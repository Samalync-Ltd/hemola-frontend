import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './Public.module.css';
import { PublicHeader } from '../../components/public/PublicHeader';
import { PublicFooter } from '../../components/public/PublicFooter';
import { landing } from '../../content/landing';
import { usePublicPage } from '../../i18n/language';
import { authService } from '../../services/api';

// Build-time store links (see .env.example).
const APP_STORE_URL = (import.meta.env.VITE_APP_STORE_URL || '').trim();
const PLAY_STORE_URL = (import.meta.env.VITE_PLAY_STORE_URL || '').trim();

/** Text badge: a link when the store URL is set, otherwise disabled with «قريباً». */
const StoreBadge = ({ name, url, lang }) => {
    if (!url) {
        return (
            <span className={`${styles.badge} ${styles.badgeDisabled}`} aria-disabled="true">
                <span className={styles.badgeName}>{name}</span>
                <span className={styles.badgeNote}>{landing.app.comingSoon[lang]}</span>
            </span>
        );
    }
    return (
        <a className={styles.badge} href={url} target="_blank" rel="noopener noreferrer">
            <span className={styles.badgeName}>{name}</span>
        </a>
    );
};

const HowColumn = ({ column, lang }) => (
    <div className={styles.card}>
        <h3 className={`${styles.heading} ${styles.cardTitle}`}>{column.title[lang]}</h3>
        <ol className={styles.steps}>
            {column.steps.map((step) => <li key={step.en}>{step[lang]}</li>)}
        </ol>
    </div>
);

export const Landing = () => {
    const navigate = useNavigate();
    const lang = usePublicPage({ title: landing.hero.title, description: landing.hero.subtitle });

    // Someone who is already signed in belongs on their dashboard, not here.
    useEffect(() => {
        let isCurrent = true;
        authService.getCurrentUser()
            .then((user) => { if (isCurrent && user) navigate('/app', { replace: true }); })
            .catch(() => { /* not signed in: stay on the landing page */ });
        return () => { isCurrent = false; };
    }, [navigate]);

    return (
        <div className={styles.page}>
            <PublicHeader lang={lang} />

            <main>
                <section className={styles.hero}>
                    <div className={styles.container}>
                        <h1 className={`${styles.heading} ${styles.heroTitle}`}>{landing.hero.title[lang]}</h1>
                        <p className={styles.heroSubtitle}>{landing.hero.subtitle[lang]}</p>
                        <div className={styles.heroActions}>
                            <Link to="/login" className={`${styles.btn} ${styles.btnLg} ${styles.btnOutlineLight}`}>{landing.signIn[lang]}</Link>
                            <Link to="/register" className={`${styles.btn} ${styles.btnLg} ${styles.btnAccent}`}>{landing.createAccount[lang]}</Link>
                        </div>
                    </div>
                </section>

                <section className={`${styles.section} ${styles.sectionWhite}`} aria-labelledby="how-title">
                    <div className={styles.container}>
                        <h2 id="how-title" className={`${styles.heading} ${styles.sectionTitle}`}>{landing.how.title[lang]}</h2>
                        <div className={styles.howGrid}>
                            <HowColumn column={landing.how.shippers} lang={lang} />
                            <HowColumn column={landing.how.carriers} lang={lang} />
                        </div>
                    </div>
                </section>

                <section className={styles.section} aria-labelledby="features-title">
                    <div className={styles.container}>
                        <h2 id="features-title" className={`${styles.heading} ${styles.sectionTitle}`}>{landing.features.title[lang]}</h2>
                        <div className={styles.featureGrid}>
                            {landing.features.items.map((item) => (
                                <div key={item.title.en} className={`${styles.card} ${styles.feature}`}>
                                    <h3 className={`${styles.heading} ${styles.featureTitle}`}>{item.title[lang]}</h3>
                                    <p className={styles.featureText}>{item.text[lang]}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className={`${styles.section} ${styles.sectionWhite}`} aria-labelledby="app-title">
                    <div className={styles.container}>
                        <h2 id="app-title" className={`${styles.heading} ${styles.sectionTitle}`}>{landing.app.title[lang]}</h2>
                        <p className={styles.appText}>{landing.app.text[lang]}</p>
                        <div className={styles.badges}>
                            <StoreBadge name="App Store" url={APP_STORE_URL} lang={lang} />
                            <StoreBadge name="Google Play" url={PLAY_STORE_URL} lang={lang} />
                        </div>
                    </div>
                </section>

                <section className={styles.section} aria-labelledby="faq-title">
                    <div className={styles.container}>
                        <h2 id="faq-title" className={`${styles.heading} ${styles.sectionTitle}`}>{landing.faq.title[lang]}</h2>
                        <div className={styles.faq}>
                            {landing.faq.items.map((item) => (
                                <details key={item.q.en} className={styles.faqItem}>
                                    <summary>{item.q[lang]}</summary>
                                    <p className={styles.faqAnswer}>{item.a[lang]}</p>
                                </details>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <PublicFooter lang={lang} />
        </div>
    );
};
