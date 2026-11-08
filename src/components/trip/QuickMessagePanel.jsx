import React from 'react';
import { Button } from '../common/Button';
import { UserRole } from '../../constants/enums';

// Closed set, no free text — the backend owns this list and refuses any
// other key, or a key from the other side (INTEGRATION.md §12,
// sendQuickMessage). Use these keys exactly.
const QUICK_MESSAGES = {
    [UserRole.CARRIER]: [
        { key: 'EN_ROUTE_TO_PICKUP', label: 'في الطريق لموقع التحميل' },
        { key: 'ARRIVED_AT_PICKUP', label: 'وصلت لموقع التحميل' },
        { key: 'LOADING_STARTED', label: 'بدأ التحميل' },
        { key: 'LOCATION_UNCLEAR', label: 'الموقع غير واضح' },
        { key: 'RUNNING_LATE', label: 'سأتأخر قليلًا' },
        { key: 'NO_ONE_AT_SITE', label: 'لا يوجد أحد بالموقع' },
        { key: 'ARRIVED_AT_DELIVERY', label: 'وصلت لموقع التسليم' },
    ],
    [UserRole.SHIPPER]: [
        { key: 'GOODS_READY', label: 'البضاعة جاهزة للتحميل' },
        { key: 'SITE_OPEN', label: 'الموقع مفتوح الآن' },
        { key: 'SITE_CONTACT_READY', label: 'المسؤول بالموقع جاهز' },
        { key: 'CALL_SITE_CONTACT', label: 'يرجى الاتصال بالمسؤول بالموقع' },
        { key: 'PLEASE_WAIT', label: 'يرجى الانتظار قليلًا' },
        { key: 'LOCATION_IN_DETAILS', label: 'الموقع موضّح في تفاصيل الشحنة' },
        { key: 'RECEIVED', label: 'تم الاستلام' },
    ],
};

// Messages already stored on older trips keep their old keys — they can no
// longer be sent, but still need their Arabic when shown.
const RETIRED_LABELS = {
    arrivedAtPickup: 'وصلت لموقع التحميل',
    locationUnclear: 'الموقع غير واضح',
    runningLate: 'سأتأخر قليلًا',
    arrivedAtDelivery: 'وصلت لموقع التسليم',
    acknowledged: 'تم الاستلام',
    contactReady: 'المسؤول بالموقع جاهز',
    pleaseWait: 'يرجى الانتظار قليلًا',
    willSendLocation: 'سأرسل الموقع',
};

const LABEL_BY_KEY = {
    ...RETIRED_LABELS,
    ...Object.fromEntries(Object.values(QUICK_MESSAGES).flat().map(opt => [opt.key, opt.label])),
};

/**
 * A trip's shared quick-message timeline, closed-set buttons filtered by
 * role. `currentUserId` decides which bubbles are "mine" via the backend's
 * `senderId` field; `role` is a fallback for messages without one.
 * `newMessageIds` marks messages the user hasn't seen yet.
 */
export const QuickMessagePanel = ({ role, currentUserId, messages = [], onSend, isSending, newMessageIds }) => {
    const options = QUICK_MESSAGES[role] || [];
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
                    {messages.map(m => {
                        const isMe = currentUserId ? m.senderId === currentUserId : m.senderRole === role;
                        const label = m.label || LABEL_BY_KEY[m.messageKey] || m.messageKey;
                        const isNew = !isMe && newMessageIds?.has(m.id);
                        return (
                            <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                                <div style={{
                                    padding: '6px 14px', borderRadius: 12, fontSize: 13,
                                    backgroundColor: isMe ? 'var(--color-primary)' : isNew ? 'rgba(255,122,41,0.1)' : 'var(--color-background)',
                                    color: isMe ? 'white' : 'var(--color-text-primary)',
                                    border: isMe ? 'none' : isNew ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                                    fontWeight: isNew ? 700 : 400,
                                }}>
                                    {label}
                                </div>
                                <span style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>
                                    {isNew && <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>جديدة · </span>}
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
