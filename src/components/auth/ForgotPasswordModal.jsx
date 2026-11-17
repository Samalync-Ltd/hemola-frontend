import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { authService } from '../../services/api';
import { toUserMessage } from '../../utils/errors';
import { useT, } from '../../i18n';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Sends Firebase's built-in password-reset email. The reset itself happens
 * on Firebase's own page from the link in that email. The success message is
 * the same whether or not the address has an account.
 */
export const ForgotPasswordModal = ({ isOpen, onClose, initialEmail = '' }) => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const { t, lang } = useT();

    useEffect(() => {
        if (isOpen) {
            setEmail(initialEmail.includes('@') ? initialEmail.trim() : '');
            setError('');
            setIsSent(false);
        }
    }, [isOpen, initialEmail]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!EMAIL_PATTERN.test(email.trim())) {
            setError(t('auth.forgot.enterEmail'));
            return;
        }
        setIsSending(true);
        try {
            await authService.sendPasswordReset(email);
            setIsSent(true);
        } catch (err) {
            setError(toUserMessage(err, t('auth.forgot.failed')));
        } finally {
            setIsSending(false);
        }
    };

    return createPortal(
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div style={{ width: 420, maxWidth: '90%' }}>
                <Card>
                    <h3 style={{ marginBottom: 8 }}>{t('auth.forgot.title')}</h3>
                    {isSent ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <p role="status" style={{ margin: 0, color: 'var(--color-success)' }}>
                                {t('auth.forgot.sentBefore')}<strong dir="ltr">{email.trim()}</strong>{t('auth.forgot.sentAfter')}
                            </p>
                            <Button type="button" onClick={onClose}>{t('auth.backToSignIn')}</Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <p className="text-helper" style={{ margin: 0 }}>
                                {t('auth.forgot.intro')}
                            </p>
                            <Input type="email" label={t('auth.email')} autoComplete="email" dir="ltr" style={{ textAlign: lang === 'ar' ? 'right' : 'left' }} value={email} onChange={e => setEmail(e.target.value)} />
                            {error && <div role="alert" style={{ color: 'var(--color-error)', fontSize: 13 }}>{error}</div>}
                            <div style={{ display: 'flex', gap: 12 }}>
                                <Button type="submit" style={{ flex: 1 }} isLoading={isSending}>{t('auth.forgot.send')}</Button>
                                <Button type="button" variant="outline" style={{ flex: 1 }} onClick={onClose} disabled={isSending}>{t('common.cancel')}</Button>
                            </div>
                        </form>
                    )}
                </Card>
            </div>
        </div>,
        document.body
    );
};
