import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, ArrowRight, Camera, ChevronDown, FileCheck2, HandCoins, MapPinned,
    Package, PackagePlus, PackageSearch, ShieldCheck, Star, Truck, Wallet,
} from 'lucide-react';
import styles from './Public.module.css';
import { PublicHeader } from '../../components/public/PublicHeader';
import { PublicFooter } from '../../components/public/PublicFooter';
import { Bidi } from '../../components/public/Bidi';
import { AppleLogo, GooglePlayLogo, RouteLine, TrackingArt } from '../../components/public/Art';
import { landing } from '../../content/landing';
import { usePublicPage } from '../../i18n/language';

// Build-time store links (see .env.example).
const APP_STORE_URL = (import.meta.env.VITE_APP_STORE_URL || '').trim();
const PLAY_STORE_URL = (import.meta.env.VITE_PLAY_STORE_URL || '').trim();

// One icon per item, in the same order as the texts in content/landing.js.
const SHIPPER_STEP_ICONS = [PackagePlus, HandCoins, MapPinned];
const CARRIER_STEP_ICONS = [FileCheck2, PackageSearch, Wallet];
const FEATURE_ICONS = [MapPinned, Wallet, ShieldCheck, Camera, Star];
const [liveTracking, platformWallet, verifiedAccounts] = landing.features.items;

/** Store button: a link when the store URL is set, otherwise disabled with «قريباً». */
const StoreBadge = ({ name, url, lang, logo: Logo }) => {
    const inner = (
        <>
            <Logo className={styles.storeLogo} />
            <span className={styles.storeText}>
                {!url && <span className={styles.storeNote}>{landing.app.comingSoon[lang]}</span>}
                <span className={styles.storeName} dir="ltr">{name}</span>
            </span>
        </>
    );
    if (!url) {
        return <span className={`${styles.store} ${styles.storeDisabled}`} aria-disabled="true">{inner}</span>;
    }
    return <a className={styles.store} href={url} target="_blank" rel="noopener noreferrer">{inner}</a>;
};

const SectionHead = ({ id, title, align = 'center' }) => (
    <div className={`${styles.sectionHead} ${align === 'start' ? styles.sectionHeadStart : ''}`}>
        <h2 id={id} className={`${styles.heading} ${styles.sectionTitle}`}>{title}</h2>
    </div>
);

const HowColumn = ({ column, icon: Icon, stepIcons, tone, lang }) => (
    <div className={`${styles.howCard} ${tone === 'dark' ? styles.howCardDark : ''} ${styles.reveal}`}>
        <div className={styles.howHead}>
            <span className={styles.howIcon}><Icon size={26} strokeWidth={1.8} aria-hidden="true" /></span>
            <h3 className={`${styles.heading} ${styles.howTitle}`}>{column.title[lang]}</h3>
        </div>
        <ol className={styles.steps}>
            {column.steps.map((step, index) => {
                const StepIcon = stepIcons[index];
                return (
                    <li key={step.en} className={styles.step}>
                        <span className={styles.stepIcon}>
                            <StepIcon size={22} strokeWidth={1.9} aria-hidden="true" />
                            <span className={styles.stepNum} aria-hidden="true">{index + 1}</span>
                        </span>
                        <span className={styles.stepText}>{step[lang]}</span>
                    </li>
                );
            })}
        </ol>
    </div>
);

/** Laptop + phone frames around real screenshots of the platform. */
const Devices = ({ lang }) => (
    <div className={styles.devices}>
        <div className={styles.laptop}>
            <div className={styles.laptopScreen}>
                <img src="/landing/shipments-list.webp" width="1440" height="900" alt={landing.screens.shipments[lang]} fetchPriority="high" decoding="async" />
            </div>
            <div className={styles.laptopBase} aria-hidden="true" />
        </div>
        <div className={styles.phone}>
            <div className={styles.phoneScreen}>
                <img src="/landing/trip-map.webp" width="720" height="1520" alt={landing.screens.tripMap[lang]} decoding="async" />
            </div>
        </div>
        <div className={`${styles.chip} ${styles.chipLive}`} aria-hidden="true">
            <span className={styles.liveDot} />
            {liveTracking.title[lang]}
        </div>
        <div className={`${styles.chip} ${styles.chipVerified}`} aria-hidden="true">
            <ShieldCheck size={16} strokeWidth={2.2} className={styles.chipIcon} />
            {verifiedAccounts.title[lang]}
        </div>
    </div>
);

export const Landing = () => {
    const navigate = useNavigate();
    const lang = usePublicPage({ title: landing.hero.title, description: landing.hero.subtitle });
    const Forward = lang === 'ar' ? ArrowLeft : ArrowRight;

    // Someone who is already signed in belongs on their dashboard, not here.
    // Firebase is loaded only now, after the page has rendered, so it never
    // delays the first paint for visitors.
    // Opened on a section on purpose (the account page's «الأسئلة الشائعة»
    // link goes to /#faq) — stay, even when signed in.
    useEffect(() => {
        if (window.location.hash) return undefined;
        let isCurrent = true;
        import('../../services/api')
            .then(({ authService }) => authService.getCurrentUser())
            .then((user) => { if (isCurrent && user) navigate('/app', { replace: true }); })
            .catch(() => { /* not signed in: stay on the landing page */ });
        return () => { isCurrent = false; };
    }, [navigate]);

    // Coming from another page's "/#faq" link: jump to that section.
    useEffect(() => {
        const id = window.location.hash.slice(1);
        if (id) document.getElementById(id)?.scrollIntoView();
    }, []);

    const [brandPart, ...titleRest] = landing.hero.title[lang].split(':');

    return (
        <div className={styles.page}>
            <PublicHeader lang={lang} />

            <main>
                {/* ---------- Hero ---------- */}
                <section className={styles.hero}>
                    <div className={styles.heroDecor} aria-hidden="true">
                        <RouteLine className={styles.heroRoute} />
                    </div>
                    <div className={`${styles.container} ${styles.heroGrid}`}>
                        <div className={styles.heroCopy}>
                            <h1 className={`${styles.heading} ${styles.heroTitle}`}>
                                <span className={styles.heroBrand}>{brandPart}:</span>{' '}
                                <span className={styles.heroTitleRest}>{titleRest.join(':').trim()}</span>
                            </h1>
                            <p className={styles.heroSubtitle}>{landing.hero.subtitle[lang]}</p>
                            <div className={styles.heroActions}>
                                <Link to="/register" className={`${styles.btn} ${styles.btnLg} ${styles.btnAccent}`}>
                                    {landing.createAccount[lang]}
                                    <Forward size={18} strokeWidth={2.4} aria-hidden="true" className={styles.btnArrow} />
                                </Link>
                                <Link to="/login" className={`${styles.btn} ${styles.btnLg} ${styles.btnOutlineLight}`}>{landing.signIn[lang]}</Link>
                            </div>
                            <ul className={styles.heroPoints}>
                                {[[MapPinned, liveTracking], [ShieldCheck, verifiedAccounts], [Wallet, platformWallet]].map(([Icon, item]) => (
                                    <li key={item.title.en}>
                                        <Icon size={18} strokeWidth={2} aria-hidden="true" />
                                        {item.title[lang]}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <Devices lang={lang} />
                    </div>
                </section>

                {/* ---------- How it works ---------- */}
                <section id="how" className={`${styles.section} ${styles.sectionHow}`} aria-labelledby="how-title">
                    <div className={styles.container}>
                        <SectionHead id="how-title" title={landing.how.title[lang]} />
                        <div className={styles.howGrid}>
                            <HowColumn column={landing.how.shippers} icon={Package} stepIcons={SHIPPER_STEP_ICONS} lang={lang} />
                            <HowColumn column={landing.how.carriers} icon={Truck} stepIcons={CARRIER_STEP_ICONS} tone="dark" lang={lang} />
                        </div>
                    </div>
                </section>

                {/* ---------- Why Hemooltak: 1 large + 4 small = a balanced bento ---------- */}
                <section id="features" className={`${styles.section} ${styles.sectionFeatures}`} aria-labelledby="features-title">
                    <div className={styles.container}>
                        <SectionHead id="features-title" title={landing.features.title[lang]} />
                        <div className={styles.featureGrid}>
                            {landing.features.items.map((item, index) => {
                                const Icon = FEATURE_ICONS[index];
                                const isLead = index === 0;
                                return (
                                    <article key={item.title.en} className={`${styles.feature} ${isLead ? styles.featureLead : ''} ${styles.reveal}`}>
                                        <span className={styles.featureIcon}><Icon size={24} strokeWidth={1.9} aria-hidden="true" /></span>
                                        <div className={styles.featureBody}>
                                            <h3 className={`${styles.heading} ${styles.featureTitle}`}>{item.title[lang]}</h3>
                                            <p className={styles.featureText}>{item.text[lang]}</p>
                                        </div>
                                        {isLead && <TrackingArt className={styles.featureArt} />}
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* ---------- Get the app ---------- */}
                <section id="app" className={`${styles.section} ${styles.sectionApp}`} aria-labelledby="app-title">
                    <div className={`${styles.container} ${styles.appGrid}`}>
                        <div className={styles.reveal}>
                            <SectionHead id="app-title" title={landing.app.title[lang]} align="start" />
                            <p className={styles.appText}><Bidi text={landing.app.text[lang]} lang={lang} /></p>
                            <div className={styles.stores}>
                                <StoreBadge name="App Store" url={APP_STORE_URL} lang={lang} logo={AppleLogo} />
                                <StoreBadge name="Google Play" url={PLAY_STORE_URL} lang={lang} logo={GooglePlayLogo} />
                            </div>
                        </div>
                        <div className={styles.appArt} aria-hidden="true">
                            <span className={styles.appRing} />
                            <span className={`${styles.appRing} ${styles.appRingOuter}`} />
                            <div className={styles.appPhone}>
                                <img src="/landing/logo-96.png" alt="" width="64" height="64" loading="lazy" decoding="async" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ---------- FAQ ---------- */}
                <section id="faq" className={`${styles.section} ${styles.sectionFaq}`} aria-labelledby="faq-title">
                    <div className={`${styles.container} ${styles.faqWrap}`}>
                        <SectionHead id="faq-title" title={landing.faq.title[lang]} />
                        <div className={styles.faq}>
                            {landing.faq.items.map((item) => (
                                <details key={item.q.en} className={styles.faqItem}>
                                    <summary>
                                        <span>{item.q[lang]}</span>
                                        <span className={styles.faqChevron}><ChevronDown size={18} strokeWidth={2.4} aria-hidden="true" /></span>
                                    </summary>
                                    <p className={styles.faqAnswer}><Bidi text={item.a[lang]} lang={lang} /></p>
                                </details>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ---------- Call to action ---------- */}
                <section className={styles.ctaSection} aria-labelledby="cta-title">
                    <div className={styles.container}>
                        <div className={`${styles.ctaPanel} ${styles.reveal}`}>
                            <div className={styles.ctaDecor} aria-hidden="true">
                                <RouteLine className={styles.ctaRoute} />
                            </div>
                            <h2 id="cta-title" className={`${styles.heading} ${styles.ctaTitle}`}>{landing.cta.title[lang]}</h2>
                            <div className={styles.ctaActions}>
                                <Link to="/register" className={`${styles.btn} ${styles.btnLg} ${styles.btnAccent}`}>
                                    {landing.createAccount[lang]}
                                    <Forward size={18} strokeWidth={2.4} aria-hidden="true" className={styles.btnArrow} />
                                </Link>
                                <Link to="/login" className={`${styles.btn} ${styles.btnLg} ${styles.btnOutlineLight}`}>{landing.signIn[lang]}</Link>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <PublicFooter lang={lang} />
        </div>
    );
};
