import React, { useEffect, useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { PriceBlock } from '../../components/common/PriceBlock';
import { DataTable } from '../../components/common/DataTable';
import { WithdrawModal } from '../../components/wallet/WithdrawModal';
import { TopUpModal } from '../../components/wallet/TopUpModal';
import { walletService, authService } from '../../services/api';
import { TransactionType } from '../../constants/enums';
import { Loader } from '../../components/common/Loader';
import { formatDateTime, formatMoney } from '../../utils/format';
import { transactionDescription } from '../../utils/transactions';
import { useT } from '../../i18n';

// INTEGRATION.md §8/§9. Rows with amount 0 and a `withheld` figure
// (commission, debt recovered) explain money taken before it reached the
// wallet — shown as explanation, not as a further deduction.
const TRANSACTION_TYPES = [
    TransactionType.TOP_UP,
    TransactionType.TRIP_SETTLEMENT,
    TransactionType.COMMISSION_DEDUCTION,
    TransactionType.WITHDRAWAL,
    TransactionType.FEE_DEDUCTION,
    TransactionType.DEBT_FORGIVENESS,
];

// Carrier earnings mainly come from TRIP_SETTLEMENT (trip payouts, net of
// the platform commission) — but topUpWallet is still open to a carrier
// too, since it's the ONLY way out of outstandingDebt (a carrier who owes
// money can't take new work otherwise; INTEGRATION.md §10, §16 open
// question 4). The top-up action is offered for that reason, not for
// carriers to fund shipments.
export const CarrierWallet = () => {
    const { t } = useT();
    const [wallet, setWallet] = useState(null);
    const [transactions, setTransactions] = useState([]);
    // outstandingDebt lives on the carrier's own profile (users/{uid}), not
    // on the wallet doc — a negative wallet balance is not how the backend
    // represents debt.
    const [outstandingDebt, setOutstandingDebt] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [bankDetails, setBankDetails] = useState(null);
    const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
    const [isTopUpOpen, setIsTopUpOpen] = useState(false);
    const [isToppingUp, setIsToppingUp] = useState(false);

    const fetchData = () => Promise.all([
        walletService.getWallet(),
        walletService.getTransactions(),
        authService.getCurrentUser(),
    ]).then(([w, list, user]) => {
        setWallet(w);
        // Carrier earnings come only from trip settlements — filter out any
        // stray transaction types that don't apply to this role.
        setTransactions(list.filter(txn => TRANSACTION_TYPES.includes(txn.type)));
        setOutstandingDebt(user?.outstandingDebt ?? 0);
        setBankDetails(user ? { iban: user.iban || '', bankAccountName: user.bankAccountName || '' } : null);
    }).finally(() => setIsLoading(false));

    useEffect(() => { fetchData(); }, []);
    // Live balance — top-ups, reservations, settlements and fees show without a refresh.
    useEffect(() => walletService.subscribe(setWallet, () => {}), []);
    useEffect(() => walletService.subscribeTransactions((list) => setTransactions(list.filter(txn => TRANSACTION_TYPES.includes(txn.type))), () => {}), []);

    const handleWithdrawCompleted = async () => {
        await fetchData();
        setIsWithdrawOpen(false);
    };

    // Errors propagate to TopUpModal, which shows them and only reports
    // success once the backend has actually credited the wallet.
    const handleTopUp = async (amount) => {
        setIsToppingUp(true);
        try {
            await walletService.topUp(amount);
            await fetchData();
        } finally {
            setIsToppingUp(false);
        }
    };

    if (isLoading) return <Loader label={t('wallet.loading')} />;
    if (!wallet) return <div>{t('wallet.noData')}</div>;

    const columns = [
        { key: 'id', header: t('wallet.columns.id'), render: (tx) => <strong>{tx.id}</strong> },
        { key: 'type', header: t('wallet.columns.type'), render: (tx) => (TRANSACTION_TYPES.includes(tx.type) ? t(`wallet.tx.carrier.${tx.type}`) : tx.type) },
        { key: 'amount', header: t('wallet.columns.amount'), render: (tx) => (tx.amount === 0 && tx.withheld
            ? <span className="text-helper">{t('wallet.withheldFromDue', { amount: tx.withheld })}</span>
            : <span style={{ color: tx.amount >= 0 ? 'var(--color-success)' : 'var(--color-error)' }} dir="ltr">
        {tx.amount > 0 ? '+' : ''}{t('common.money', { amount: tx.amount })}
      </span>) },
        { key: 'date', header: t('common.date'), render: (tx) => <span dir="ltr">{formatDateTime(tx.timestamp)}</span> },
        { key: 'desc', header: t('wallet.columns.description'), render: (tx) => transactionDescription(tx.description) },
    ];

    return (<div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h2 style={{ margin: 0 }}>{t('nav.wallet')}</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
        <Card variant="dark">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>{t('wallet.availableToWithdraw')}</div>
              <div style={{ fontSize: 36, fontWeight: 'bold' }}>{formatMoney(wallet.available)}</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', marginTop: 4, fontSize: 13 }}>
                {t('wallet.total', { amount: formatMoney(wallet.balance) })}{wallet.reservedBalance > 0 ? t('wallet.ofWhichPendingWithdrawals', { amount: formatMoney(wallet.reservedBalance) }) : ''}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Button variant="secondary" style={{ flex: 1 }} onClick={() => setIsWithdrawOpen(true)} disabled={outstandingDebt > 0}>
              {t('wallet.requestWithdrawal')}
            </Button>
            <Button variant="outline" style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', borderColor: 'transparent' }} onClick={() => setIsTopUpOpen(true)}>
              {t('wallet.topUp')}
            </Button>
          </div>
          {outstandingDebt > 0 && (
            <p style={{ color: '#ffb4b4', fontSize: 13, marginTop: 12 }}>
              {t('wallet.debtNotice', { amount: outstandingDebt })}
            </p>
          )}
        </Card>

        <Card>
          <h3 style={{ marginBottom: 16 }}>{t('wallet.reservedCarrierTitle')}</h3>
          <PriceBlock amount={wallet.reservedBalance} size="lg"/>
          <p className="text-helper" style={{ marginTop: 8 }}>
            {t('wallet.reservedCarrierText')}
          </p>
        </Card>
      </div>

      <Card>
        <h3 style={{ marginBottom: 16 }}>{t('wallet.history')}</h3>
        <DataTable data={transactions} columns={columns} keyExtractor={tx => tx.id} emptyMessage={t('wallet.noTransactions')}/>
      </Card>

      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        onCompleted={handleWithdrawCompleted}
        currentBalance={wallet.available}
        savedBankDetails={bankDetails}
      />

      <TopUpModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        onConfirm={handleTopUp}
        isLoading={isToppingUp}
      />
    </div>);
};
