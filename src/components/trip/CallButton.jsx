import React from 'react';
import { Phone } from 'lucide-react';
import { Button } from '../common/Button';

/**
 * A plain, unmasked call to the other party on this trip — a normal `tel:`
 * hand-off to the device/OS dialer, nothing relayed or recorded by the
 * platform. Only ever rendered during the active-trip window (ASSIGNED
 * through DELIVERED, same as `QuickMessagePanel`) — never before assignment
 * or after cancellation, matching the existing contact-visibility rule.
 */
export const CallButton = ({ phoneNumber, label }) => {
    if (!phoneNumber) return null;
    return (
        <a href={`tel:${phoneNumber}`} style={{ textDecoration: 'none', display: 'block' }}>
            <Button variant="outline" style={{ width: '100%' }}>
                <Phone size={16} style={{ marginInlineEnd: 8 }} />
                {label}
            </Button>
        </a>
    );
};
