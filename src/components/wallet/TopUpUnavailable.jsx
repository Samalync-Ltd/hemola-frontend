import React from 'react';
import { Info } from 'lucide-react';

/**
 * Wallet top-up is switched off on the backend (TOPUP_DISABLED) until online
 * payment is connected, so the top-up button is hidden and this is shown in
 * its place. `tone="dark"` on the navy wallet card.
 */
export const TOPUP_UNAVAILABLE_TEXT = 'شحن المحفظة غير متاح حالياً، وسيتوفر قريباً بعد تفعيل الدفع الإلكتروني';

export const TopUpUnavailable = ({ tone = 'light', style }) => (
    <div role="note" style={{
        display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, lineHeight: 1.6,
        padding: '10px 12px', borderRadius: 8,
        color: tone === 'dark' ? 'rgba(255,255,255,0.85)' : 'var(--color-text-muted)',
        backgroundColor: tone === 'dark' ? 'rgba(255,255,255,0.08)' : 'var(--color-background)',
        ...style,
    }}>
        <Info size={16} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
        <span>{TOPUP_UNAVAILABLE_TEXT}</span>
    </div>
);
