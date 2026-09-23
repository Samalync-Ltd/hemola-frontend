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

// Flat messageKey -> label lookup — the real backend only stores
// `messageKey` (INTEGRATION.md §12), never a label, so the display text is
// always resolved from this table rather than trusted from stored data.
const LABEL_BY_KEY = Object.fromEntries(
    Object.values(QUICK_MESSAGES).flat().map(opt => [opt.key, opt.label])
);

/**
 * A trip's shared quick-message timeline, closed-set buttons filtered by
 * role. `currentUserId` decides which bubbles are "mine" against the real
 * backend's `senderId` field; `role` is used as a fallback for the mock,
 * which still stamps messages with `senderRole` instead.
 */
export const QuickMessagePanel = ({ role, currentUserId, messages = [], onSend, isSending }) => {
    const options = QUICK_MESSAGES[role] || [];
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
                    {messages.map(m => {
                        const isMe = currentUserId ? m.senderId === currentUserId : m.senderRole === role;
                        const label = m.label || LABEL_BY_KEY[m.messageKey] || m.messageKey;
                        return (
                            <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                                <div style={{
                                    padding: '6px 14px', borderRadius: 12, fontSize: 13,
                                    backgroundColor: isMe ? 'var(--color-primary)' : 'var(--color-background)',
                                    color: isMe ? 'white' : 'var(--color-text-primary)',
                                    border: isMe ? 'none' : '1px solid var(--color-border)',
                                }}>
                                    {label}
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
