import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

export const TopUpModal = ({ isOpen, onClose, onConfirm, isLoading }) => {
    const [amount, setAmount] = useState('');
    const [status, setStatus] = useState('idle'); // idle, processing, success

    useEffect(() => {
        if (isOpen) {
            setAmount('');
            setStatus('idle');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        const numAmount = Number(amount);
        if (numAmount > 0) {
            setStatus('processing');
            // Simulate payment gateway processing
            await new Promise(r => setTimeout(r, 1500));
            setStatus('success');
            // Show success message briefly before confirming
            await new Promise(r => setTimeout(r, 1000));
            onConfirm(numAmount);
        }
    };

    const modalContent = (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
        }}>
            <div style={{ width: 400, maxWidth: '90%' }}>
                <Card>
                    <h3 style={{ marginBottom: 16 }}>شحن الرصيد</h3>
                    {status === 'success' ? (
                        <div style={{ textAlign: 'center', padding: '24px 0' }}>
                            <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'var(--color-success)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>✓</div>
                            <h4 style={{ margin: 0, color: 'var(--color-success)' }}>تمت عملية الشحن بنجاح</h4>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>المبلغ (ر.س)</label>
                                <Input
                                    type="number"
                                    placeholder="أدخل المبلغ"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    min="1"
                                    required
                                    disabled={status === 'processing' || isLoading}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                                <Button type="submit" disabled={isLoading || status === 'processing' || !amount || Number(amount) <= 0} style={{ flex: 1 }} isLoading={isLoading || status === 'processing'}>
                                    {status === 'processing' ? 'جاري معالجة الدفع...' : 'تأكيد شحن الرصيد'}
                                </Button>
                                <Button type="button" variant="outline" onClick={onClose} disabled={isLoading || status === 'processing'} style={{ flex: 1 }}>
                                    إلغاء
                                </Button>
                            </div>
                        </form>
                    )}
                </Card>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};
