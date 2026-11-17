import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useT } from '../../i18n';

/**
 * Why the carrier can't take new work right now (from carrierBlockReason).
 * Rendered identically on the home page and the shipments list so both
 * always tell the carrier the same thing.
 */
export const CarrierBlockNotice = ({ reason }) => {
    const { t } = useT();
    if (!reason) return null;
    return (
        <div role="status" style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '12px 16px', borderRadius: 8,
            backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.4)',
            color: '#B45309', fontSize: 14, fontWeight: 600,
        }}>
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
            <span>{t('shipments.carrier.block.prefix', { reason })}</span>
        </div>
    );
};
