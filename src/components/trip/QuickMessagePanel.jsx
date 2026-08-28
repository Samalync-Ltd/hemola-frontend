import React from 'react';
import { Button } from '../common/Button';
import { UserRole } from '../../constants/enums';

// Closed set, no free text — mirrors lib/models/trip_message.dart exactly.
const QUICK_MESSAGES = {
    [UserRole.CARRIER]: [
        { key: 'arrivedAtPickup', label: 'وصلت لموقع التحميل' },
        { key: 'locationUnclear', label: 'الموقع غير واضح' },
        { key: 'runningLate', label: 'سأتأخر قليلاً' },
        { key: 'arrivedAtDelivery', label: 'وصلت لموقع التسليم' },
    ],
    [UserRole.SHIPPER]: [
        { key: 'acknowledged', label: 'تم الاستلام' },
        { key: 'willSendLocation', label: 'سأرسل الموقع' },
        { key: 'contactReady', label: 'المسؤول بالموقع جاهز' },
        { key: 'pleaseWait', label: 'يرجى الانتظار قليلاً' },
    ],
};

/** A trip's shared quick-message timeline, closed-set buttons filtered by role. */
export const QuickMessagePanel = ({ role, messages = [], onSend, isSending }) => {
    const options = QUICK_MESSAGES[role] || [];
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
                    {messages.map(m => {
                        const isMe = m.senderRole === role;
                        return (
                            <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                                <div style={{
                                    padding: '6px 14px', borderRadius: 12, fontSize: 13,
                                    backgroundColor: isMe ? 'var(--color-primary)' : 'var(--color-background)',
                                    color: isMe ? 'white' : 'var(--color-text-primary)',
                                    border: isMe ? 'none' : '1px solid var(--color-border)',
                                }}>
                                    {m.label}
                                </div>
                                <span style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>
                                    {new Date(m.timestamp).toLocaleTimeString('ar-SA')}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {options.map(opt => (
                    <Button key={opt.key} size="sm" variant="outline" disabled={isSending} onClick={() => onSend(opt.key, opt.label)}>
                        {opt.label}
                    </Button>
                ))}
            </div>
        </div>
    );
};
