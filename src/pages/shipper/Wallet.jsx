import React, { useEffect, useState } from 'react';
import { Card } from '../../components/common/Card';
import { walletService } from '../../services/api';
import { PriceBlock } from '../../components/common/PriceBlock';
import { DataTable } from '../../components/common/DataTable';
import { TopUpUnavailable } from '../../components/wallet/TopUpUnavailable';
import { TransactionType } from '../../constants/enums';
import { Loader } from '../../components/common/Loader';
import { formatDateTime, formatMoney, displayAmount } from '../../utils/format';
import { useT } from '../../i18n';

// Withdrawals are carrier-only (INTEGRATION.md §12 requestWithdrawal), so a
// shipper's statement never shows WITHDRAWAL.
const TRANSACTION_TYPES = [
    TransactionType.TOP_UP,
    TransactionType.TRIP_SETTLEMENT,
    TransactionType.COMMISSION_DEDUCTION,
    TransactionType.FEE_DEDUCTION,
    TransactionType.DEBT_FORGIVENESS,
];

export const WalletPage = () => {
    const { t } = useT();
    const [wallet, setWallet] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = () => {
        return Promise.all([
            walletService.getWallet(),
            walletService.getTransactions()
        ])
            .then(([w, t]) => {
            setWallet(w);
            setTransactions(t);
        })
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        fetchData();
    }, []);
    // Live balance — top-ups, reservations, settlements and fees show without a refresh.
    useEffect(() => walletService.subscribe(setWallet, () => {}), []);
    useEffect(() => walletService.subscribeTransactions(setTransactions, () => {}), []);

    if (isLoading)
        return <Loader label={t('wallet.loading')} />;
    if (!wallet)
        return <div>{t('wallet.noData')}</div>;
    const columns = [
        { key: 'id', header: t('wallet.columns.id'), render: (tx) => <strong>{tx.id}</strong> },
        { key: 'type', header: t('wallet.columns.type'), render: (tx) => (TRANSACTION_TYPES.includes(tx.type) ? t(`wallet.tx.shipper.${tx.type}`) : tx.type) },
        { key: 'amount', header: t('wallet.columns.amount'), render: (tx) => (tx.amount === 0 && tx.withheld
            ? <span className="text-helper">{t('wallet.withheldFromDue', { amount: displayAmount(tx.withheld) })}</span>
            : <span style={{ color: tx.amount >= 0 ? 'var(--color-success)' : 'var(--color-error)' }} dir="ltr">
        {tx.amount > 0 ? '+' : ''}{t('common.money', { amount: displayAmount(tx.amount) })}
      </span>) },
        { key: 'date', header: t('common.date'), render: (tx) => <span dir="ltr">{formatDateTime(tx.timestamp)}</span> },
        { key: 'ref', header: t('wallet.columns.reference'), render: (tx) => tx.referenceId || '-' }
    ];
    return (<div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h2 style={{ margin: 0 }}>{t('nav.wallet')}</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
        <Card variant="dark">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              {/* Available is what the shipper can actually commit — it's the
                  number that changes when a hold is placed or released. */}
              <div style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>{t('wallet.available')}</div>
              <div style={{ fontSize: 36, fontWeight: 'bold' }}>{formatMoney(wallet.available)}</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', marginTop: 4, fontSize: 13 }}>
                {t('wallet.total', { amount: formatMoney(wallet.balance) })}{wallet.reservedBalance > 0 ? t('wallet.ofWhichReserved', { amount: formatMoney(wallet.reservedBalance) }) : ''}
              </div>
            </div>
            {/* Wallet Icon */}
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
              <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
            </svg>
          </div>
          <TopUpUnavailable tone="dark" />
        </Card>

        <Card>
          <h3 style={{ marginBottom: 16 }}>{t('wallet.reservedShipperTitle')}</h3>
          <PriceBlock amount={wallet.reservedBalance} size="lg"/>
          <p className="text-helper" style={{ marginTop: 8 }}>
            {t('wallet.reservedShipperText')}
          </p>
        </Card>
      </div>

      <Card>
        <h3 style={{ marginBottom: 16 }}>{t('wallet.history')}</h3>
        <DataTable data={transactions} columns={columns} keyExtractor={tx => tx.id} emptyMessage={t('wallet.noTransactions')}/>
      </Card>

    </div>);
};
