import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

export const WithdrawModal = ({ isOpen, onClose, onConfirm, isLoading, currentBalance }) => {
    const [amount, setAmount] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setAmount('');
            setError(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        setError(null);
        
        const numAmount = Number(amount);
        
        if (!amount || isNaN(numAmount) || numAmount <= 0) {
            setError('يرجى إدخال مبلغ صحيح أكبر من صفر');
            return;
        }

        if (numAmount > currentBalance) {
            setError('الرصيد غير كافٍ لإتمام عملية السحب');
            return;
        }

        onConfirm(numAmount);
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
                    <h3 style={{ marginBottom: 16 }}>سحب الرصيد</h3>
                    
                    <div style={{ marginBottom: 16, padding: '12px', backgroundColor: 'var(--color-surface)', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ color: 'var(--color-text-muted)' }}>الرصيد المتاح:</span>
                            <span style={{ fontWeight: 'bold' }} dir="ltr">{currentBalance} ر.س</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>المبلغ المراد سحبه (ر.س)</label>
                            <Input
                                type="number"
                                placeholder="أدخل المبلغ"
                                value={amount}
                                onChange={e => {
                                    setAmount(e.target.value);
                                    if (error) setError(null);
                                }}
                                min="1"
                                max={currentBalance}
                                required
                            />
                            {error && <div style={{ color: 'var(--color-error)', fontSize: 12, marginTop: 4 }}>{error}</div>}
                        </div>
                        
                        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '0' }}>
                            هذه عملية تجريبية في نسخة المعاينة ولا يتم تحويل أموال حقيقية.
                        </p>

                        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                            <Button type="submit" disabled={isLoading} style={{ flex: 1 }} isLoading={isLoading}>
                                تأكيد سحب الرصيد
                            </Button>
                            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} style={{ flex: 1 }}>
                                إلغاء
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};
