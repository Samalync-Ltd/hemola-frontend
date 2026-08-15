import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

export const TopUpModal = ({ isOpen, onClose, onConfirm, isLoading }) => {
    const [amount, setAmount] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        const numAmount = Number(amount);
        if (numAmount > 0) {
            onConfirm(numAmount);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{ width: 400, maxWidth: '90%' }}>
                <Card>
                    <h3 style={{ marginBottom: 16 }}>شحن الرصيد</h3>
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
                            />
                        </div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                            <Button type="submit" disabled={isLoading || !amount || Number(amount) <= 0} style={{ flex: 1 }}>
                                {isLoading ? 'جاري الشحن...' : 'تأكيد شحن الرصيد'}
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
};
