import React from 'react';
import { Button } from '../common/Button';
import { UserRole } from '../../constants/enums';
import { useT, hasText } from '../../i18n';
import { formatClock } from '../../utils/format';

// Closed set, no free text — the backend owns this list and refuses any
// other key, or a key from the other side (INTEGRATION.md §12,
// sendQuickMessage). Use these keys exactly; the words for each key are in
// src/i18n/strings/trips.js (trips.quick.*).
const QUICK_MESSAGES = {
    [UserRole.CARRIER]: ['EN_ROUTE_TO_PICKUP', 'ARRIVED_AT_PICKUP', 'LOADING_STARTED', 'LOCATION_UNCLEAR', 'RUNNING_LATE', 'NO_ONE_AT_SITE', 'ARRIVED_AT_DELIVERY'],
    [UserRole.SHIPPER]: ['GOODS_READY', 'SITE_OPEN', 'SITE_CONTACT_READY', 'CALL_SITE_CONTACT', 'PLEASE_WAIT', 'LOCATION_IN_DETAILS', 'RECEIVED'],
};

// Messages already stored on older trips keep their old keys (arrivedAtPickup,
// acknowledged, willSendLocation, …) — they can no longer be sent, but are
// in the same table so they still show in words.

/**
 * A trip's shared quick-message timeline, closed-set buttons filtered by
 * role. `currentUserId` decides which bubbles are "mine" via the backend's
 * `senderId` field; `role` is a fallback for messages without one.
 * `newMessageIds` marks messages the user hasn't seen yet.
 */
export const QuickMessagePanel = ({ role, currentUserId, messages = [], onSend, isSending, newMessageIds }) => {
    const { t } = useT();
    const labelFor = (key) => (hasText(`trips.quick.${key}`) ? t(`trips.quick.${key}`) : key);
    const options = (QUICK_MESSAGES[role] || []).map(key => ({ key, label: labelFor(key) }));
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
                    {messages.map(m => {
                        const isMe = currentUserId ? m.senderId === currentUserId : m.senderRole === role;
                        const label = m.messageKey ? labelFor(m.messageKey) : m.label;
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
                                    {isNew && <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>{t('trips.messages.new')} · </span>}
                                    {formatClock(m.timestamp)}
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
