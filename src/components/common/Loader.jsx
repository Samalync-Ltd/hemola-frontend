import React from 'react';
// The shell's texts directly, not the whole dictionary: the loader is part
// of the first download (it is the fallback while any page loads).
import shell from '../../i18n/strings/shell';
import { useLanguage } from '../../i18n/language';
import styles from './Loader.module.css';

/**
 * Loading states, one look across the app:
 *  - variant="screen"  — first load of the app/session: brand mark + progress bar
 *  - variant="page"    — a whole page waiting on its data (default)
 *  - variant="section" — a card or panel inside an already-rendered page
 *  - variant="inline"  — a small spinner beside text, e.g. "locating…"
 * The label describes what is loading; it fades in after a short delay so
 * fast loads never flash a loader at all.
 */
export const Loader = ({ label, variant = 'page' }) => {
    const lang = useLanguage();
    const text = label ?? shell.common.loading[lang];
    if (variant === 'screen') {
        return (
            <div className={`${styles.loader} ${styles.screen}`} role="status" aria-live="polite">
                <div className={styles.brandMark} aria-hidden="true">
                    <img src="/logos/1-transparent.png" alt="" />
                </div>
                <div className={styles.progressTrack} aria-hidden="true"><div className={styles.progressBar} /></div>
                <span className={styles.label}>{text}</span>
            </div>
        );
    }
    return (
        <div className={`${styles.loader} ${styles[variant]}`} role="status" aria-live="polite">
            <span className={styles.spinner} aria-hidden="true" />
            <span className={styles.label}>{text}</span>
        </div>
    );
};

/** Placeholder rows for a table/list while its data loads — keeps the layout steady. */
export const SkeletonRows = ({ rows = 5, columns = 4, label }) => {
    const lang = useLanguage();
    return (
    <div className={styles.skeleton} role="status" aria-live="polite" aria-label={label ?? shell.common.loadingData[lang]}>
        {Array.from({ length: rows }, (_, r) => (
            <div key={r} className={styles.skeletonRow}>
                {Array.from({ length: columns }, (_, c) => (
                    <span key={c} className={styles.skeletonCell} style={{ flex: c === 0 ? 2 : 1 }} />
                ))}
            </div>
        ))}
    </div>
    );
};
