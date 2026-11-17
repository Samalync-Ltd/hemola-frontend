import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { authService } from '../../services/api';
import { toUserMessage } from '../../utils/errors';
import { useT } from '../../i18n';

/** Verifies the current password and sets the new one (Firebase Auth). */
export const ChangePasswordModal = ({ isOpen, onClose }) => {
    const [current, setCurrent] = useState('');
    const [next, setNext] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDone, setIsDone] = useState(false);
    const { t } = useT();

    useEffect(() => {
        if (isOpen) {
            setCurrent(''); setNext(''); setConfirm(''); setError(''); setIsDone(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!current) { setError(t('account.password.currentRequired')); return; }
        if (next.length < 8 || !/[A-Za-z\u0600-\u06FF]/.test(next) || !/\d/.test(next)) {
            setError(t('account.password.rules'));
            return;
        }
        if (next !== confirm) { setError(t('account.password.mismatch')); return; }
        if (next === current) { setError(t('account.password.sameAsCurrent')); return; }

        setIsSubmitting(true);
        try {
            await authService.changePassword(current, next);
            setIsDone(true);
        } catch (err) {
            setError(toUserMessage(err, t('errors.app.passwordChangeFailed')));
        } finally {
            setIsSubmitting(false);
        }
    };

    return createPortal(
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div style={{ width: 400, maxWidth: '90%' }}>
                <Card>
                    <h3 style={{ marginBottom: 16 }}>{t('account.password.title')}</h3>
                    {isDone ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div role="status" style={{ color: 'var(--color-success)' }}>{t('account.password.done')}</div>
                            <Button type="button" onClick={onClose}>{t('trips.cancelModal.ok')}</Button>
                        </div>
                    ) : (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <Input type="password" label={t('account.password.current')} autoComplete="current-password" value={current} onChange={e => setCurrent(e.target.value)} />
                        <Input type="password" label={t('account.password.new')} autoComplete="new-password" value={next} onChange={e => setNext(e.target.value)} />
                        <Input type="password" label={t('account.password.confirm')} autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} />
                        {error && <div style={{ color: 'var(--color-error)', fontSize: 12 }}>{error}</div>}
                        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                            <Button type="submit" style={{ flex: 1 }} isLoading={isSubmitting}>{t('common.save')}</Button>
                            <Button type="button" variant="outline" style={{ flex: 1 }} onClick={onClose} disabled={isSubmitting}>{t('common.cancel')}</Button>
                        </div>
                    </form>
                    )}
                </Card>
            </div>
        </div>,
        document.body
    );
};
