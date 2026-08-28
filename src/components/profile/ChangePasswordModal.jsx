import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { authService } from '../../services/api';

/** Mock-only — there's no backend to actually update, but it validates and reports like a real flow would. */
export const ChangePasswordModal = ({ isOpen, onClose }) => {
    const [current, setCurrent] = useState('');
    const [next, setNext] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setCurrent(''); setNext(''); setConfirm(''); setError('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!current) { setError('كلمة المرور الحالية مطلوبة'); return; }
        if (next.length < 8 || !/[A-Za-z؀-ۿ]/.test(next) || !/\d/.test(next)) {
            setError('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل وتحتوي على حرف ورقم');
            return;
        }
        if (next !== confirm) { setError('كلمتا المرور غير متطابقتين'); return; }

        setIsSubmitting(true);
        try {
            await authService.changePassword();
            onClose();
            alert('تم تغيير كلمة المرور بنجاح');
        } finally {
            setIsSubmitting(false);
        }
    };

    return createPortal(
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div style={{ width: 400, maxWidth: '90%' }}>
                <Card>
                    <h3 style={{ marginBottom: 16 }}>تغيير كلمة المرور</h3>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <Input type="password" label="كلمة المرور الحالية" value={current} onChange={e => setCurrent(e.target.value)} />
                        <Input type="password" label="كلمة المرور الجديدة" value={next} onChange={e => setNext(e.target.value)} />
                        <Input type="password" label="تأكيد كلمة المرور الجديدة" value={confirm} onChange={e => setConfirm(e.target.value)} />
                        {error && <div style={{ color: 'var(--color-error)', fontSize: 12 }}>{error}</div>}
                        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                            <Button type="submit" style={{ flex: 1 }} isLoading={isSubmitting}>حفظ</Button>
                            <Button type="button" variant="outline" style={{ flex: 1 }} onClick={onClose} disabled={isSubmitting}>إلغاء</Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>,
        document.body
    );
};
