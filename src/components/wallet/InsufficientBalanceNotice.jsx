import React, { useState } from 'react';
import { Wallet } from 'lucide-react';
import { Button } from '../common/Button';
import { TopUpModal } from './TopUpModal';
import { walletService } from '../../services/api';
import { formatAmount } from '../../utils/format';

/**
 * "Your available balance (X) is below the offer (Y)" plus a top-up button
 * that opens the wallet top-up right here. The parent re-checks against the
 * live balance, so the notice disappears by itself once the top-up lands.
 *
 * `warning` softens the tone where nothing is blocked (posting a shipment).
 */
export const InsufficientBalanceNotice = ({ available, required, label = 'قيمة العرض', warning = false, children }) => {
    const [isTopUpOpen, setIsTopUpOpen] = useState(false);
    const color = warning ? '#B45309' : 'var(--color-error)';
    return (
        <div role={warning ? 'status' : 'alert'} style={{
            padding: '12px 16px', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 10,
            backgroundColor: warning ? 'rgba(245,158,11,0.08)' : 'rgba(229,62,62,0.08)',
            border: `1px solid ${warning ? 'rgba(245,158,11,0.4)' : 'rgba(229,62,62,0.35)'}`,
        }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', color, fontWeight: 600, fontSize: 14 }}>
                <Wallet size={18} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
                <span>رصيدك المتاح ({formatAmount(available)} ر.س) أقل من {label} ({formatAmount(required)} ر.س){children}</span>
            </div>
            <Button size="sm" variant={warning ? 'outline' : 'primary'} onClick={() => setIsTopUpOpen(true)} style={{ alignSelf: 'flex-start' }}>
                شحن الرصيد
            </Button>
            <TopUpModal
                isOpen={isTopUpOpen}
                onClose={() => setIsTopUpOpen(false)}
                onConfirm={(amount) => walletService.topUp(amount)}
            />
        </div>
    );
};
