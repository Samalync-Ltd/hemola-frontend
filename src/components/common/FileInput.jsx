import React, { useRef, useState } from 'react';
import { useT } from '../../i18n';
import { FileText, Image as ImageIcon, Upload } from 'lucide-react';
import styles from './FileInput.module.css';

// Mirrors hemooltak-backend/storage.rules isAllowedUpload(): images or PDF,
// under 5 MB. Checked here too so the user hears why straight away instead
// of after a failed upload at the very end of registration.
const ACCEPT = '.jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf';
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const ALLOWED_EXTENSION = /\.(jpe?g|png|pdf)$/i;
const MAX_BYTES = 5 * 1024 * 1024;

const formatSize = (bytes, t) => (bytes < 1024 * 1024
    ? t('files.kb', { value: Math.max(1, Math.round(bytes / 1024)) })
    : t('files.mb', { value: (bytes / (1024 * 1024)).toFixed(1) }));

/**
 * A document picker that shows what was chosen. The browser's own file input
 * forgets its selection whenever it unmounts (e.g. moving between
 * registration steps), so the chosen File lives in the parent's state and is
 * passed back in as `file`; this component only renders it.
 *
 * onChange(name, file) fires only for an accepted file.
 */
export const FileInput = ({ name, label, file, onChange, error, disabled }) => {
    const inputRef = useRef(null);
    const [localError, setLocalError] = useState('');
    const { t } = useT();

    const handleChange = (e) => {
        const picked = e.target.files?.[0];
        e.target.value = ''; // so choosing the same file again still fires
        if (!picked) return;
        const typeOk = ALLOWED_TYPES.includes(picked.type) || (!picked.type && ALLOWED_EXTENSION.test(picked.name));
        if (!typeOk) {
            setLocalError(t('files.badType'));
            return;
        }
        if (picked.size >= MAX_BYTES) {
            setLocalError(t('files.tooLarge'));
            return;
        }
        setLocalError('');
        onChange(name, picked);
    };

    const shownError = localError || error;
    const isPdf = file && (file.type === 'application/pdf' || /\.pdf$/i.test(file.name));
    const Icon = isPdf ? FileText : ImageIcon;

    return (
        <div className={styles.container}>
            {label && <span className={styles.label}>{label}</span>}
            <input
                ref={inputRef}
                type="file"
                name={name}
                accept={ACCEPT}
                onChange={handleChange}
                className={styles.hiddenInput}
                tabIndex={-1}
                aria-hidden="true"
                disabled={disabled}
            />
            {file ? (
                <div className={`${styles.box} ${styles.chosen} ${shownError ? styles.hasError : ''}`}>
                    <Icon size={22} className={styles.fileIcon} aria-hidden="true" />
                    <div className={styles.fileText}>
                        <span className={styles.fileName} dir="ltr" title={file.name}>{file.name}</span>
                        <span className={styles.fileMeta}>{formatSize(file.size, t)}</span>
                    </div>
                    <button type="button" className={styles.changeButton} onClick={() => inputRef.current?.click()} disabled={disabled}>
                        {t('files.change')}
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    className={`${styles.box} ${styles.empty} ${shownError ? styles.hasError : ''}`}
                    onClick={() => inputRef.current?.click()}
                    disabled={disabled}
                >
                    <Upload size={20} aria-hidden="true" />
                    <span className={styles.emptyTitle}>{t('files.choose')}</span>
                    <span className={styles.hint}>{t('files.hint')}</span>
                </button>
            )}
            {shownError && <span className={styles.errorText} role="alert">{shownError}</span>}
        </div>
    );
};
