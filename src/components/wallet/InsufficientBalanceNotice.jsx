import React from 'react';
import { Wallet } from 'lucide-react';
import { TopUpUnavailable } from './TopUpUnavailable';
import { formatAmount } from '../../utils/format';
import { useT } from '../../i18n';

/**
 * "Your available balance (X) is below the offer (Y)". Top-up is switched off
 * (TOPUP_DISABLED) until online payment exists, so instead of a top-up
 * button it says so. The parent re-checks against the live balance, so the
 * notice disappears by itself once balance is added.
 *
 * `warning` softens the tone where nothing is blocked (posting a shipment).
 */
export const InsufficientBalanceNotice = ({ available, required, label, warning = false, children }) => {
    const { t } = useT();
    const color = warning ? '#B45309' : 'var(--color-error)';
    return (
        <div role={warning ? 'status' : 'alert'} style={{
            padding: '12px 16px', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 10,
            backgroundColor: warning ? 'rgba(245,158,11,0.08)' : 'rgba(229,62,62,0.08)',
            border: `1px solid ${warning ? 'rgba(245,158,11,0.4)' : 'rgba(229,62,62,0.35)'}`,
        }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', color, fontWeight: 600, fontSize: 14 }}>
                <Wallet size={18} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
                <span>{t('wallet.insufficient', { available: formatAmount(available), label: label ?? t('wallet.offerValue'), required: formatAmount(required) })}{children}</span>
            </div>
            <TopUpUnavailable />
        </div>
    );
};
