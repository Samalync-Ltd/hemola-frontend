import React, { useEffect, useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { PriceBlock } from '../../components/common/PriceBlock';
import { DataTable } from '../../components/common/DataTable';
import { WithdrawModal } from '../../components/wallet/WithdrawModal';
import { TopUpModal } from '../../components/wallet/TopUpModal';
import { walletService, authService } from '../../services/api';
import { TransactionType } from '../../constants/enums';

// INTEGRATION.md §8/§9. Rows with amount 0 and a `withheld` figure
// (commission, debt recovered) explain money taken before it reached the
// wallet — shown as explanation, not as a further deduction.
const TRANSACTION_LABELS = {
    [TransactionType.TOP_UP]: 'شحن رصيد',
    [TransactionType.TRIP_SETTLEMENT]: 'أرباح رحلة',
    [TransactionType.COMMISSION_DEDUCTION]: 'عمولة المنصة',
    [TransactionType.WITHDRAWAL]: 'سحب رصيد',
    [TransactionType.FEE_DEDUCTION]: 'سداد مديونية',
    [TransactionType.DEBT_FORGIVENESS]: 'إعفاء من المديونية',
};

// Carrier earnings mainly come from TRIP_SETTLEMENT (trip payouts, net of
// the platform commission) — but topUpWallet is still open to a carrier
// too, since it's the ONLY way out of outstandingDebt (a carrier who owes
// money can't take new work otherwise; INTEGRATION.md §10, §16 open
// question 4). The top-up action is offered for that reason, not for
// carriers to fund shipments.
export const CarrierWallet = () => {
    const [wallet, setWallet] = useState(null);
    const [transactions, setTransactions] = useState([]);
    // outstandingDebt lives on the carrier's own profile (users/{uid}), not
    // on the wallet doc — a negative wallet balance is not how the real
    // backend represents debt, unlike the old mock's shortcut.
    const [outstandingDebt, setOutstandingDebt] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [isTopUpOpen, setIsTopUpOpen] = useState(false);
    const [isToppingUp, setIsToppingUp] = useState(false);

    const fetchData = () => Promise.all([
        walletService.getWallet(),
        walletService.getTransactions(),
        authService.getCurrentUser(),
    ]).then(([w, t, user]) => {
        setWallet(w);
        // Carrier earnings come only from trip settlements — filter out any
        // stray transaction types that don't apply to this role.
        setTransactions(t.filter(txn => txn.type in TRANSACTION_LABELS));
        // The mock has no outstandingDebt field of its own — it represents
        // the same idea as a negative wallet balance instead, so fall back
        // to that when the real field isn't present.
        setOutstandingDebt(user?.outstandingDebt || (w.balance < 0 ? Math.abs(w.balance) : 0));
    }).finally(() => setIsLoading(false));

    useEffect(() => { fetchData(); }, []);

    const handleWithdraw = async (amount) => {
        setIsWithdrawing(true);
        try {
            await walletService.withdraw(amount);
            await fetchData();
            setIsWithdrawOpen(false);
        } catch (error) {
            alert(error.message);
        } finally {
            setIsWithdrawing(false);
        }
    };

    const handleTopUp = async (amount) => {
        setIsToppingUp(true);
        try {
            await walletService.topUp(amount);
            await fetchData();
            setIsTopUpOpen(false);
        } catch (error) {
            alert(error.message);
        } finally {
            setIsToppingUp(false);
        }
    };

    if (isLoading) return <div>جاري التحميل...</div>;
    if (!wallet) return <div>لا توجد بيانات للمحفظة</div>;

    const columns = [
        { key: 'id', header: 'رقم العملية', render: (t) => <strong>{t.id}</strong> },
        { key: 'type', header: 'النوع', render: (t) => TRANSACTION_LABELS[t.type] || t.type },
        { key: 'amount', header: 'المبلغ', render: (t) => (t.amount === 0 && t.withheld
            ? <span className="text-helper">خُصم {t.withheld} ر.س من المستحق</span>
            : <span style={{ color: t.amount >= 0 ? 'var(--color-success)' : 'var(--color-error)' }} dir="ltr">
        {t.amount > 0 ? '+' : ''}{t.amount} ر.س
      </span>) },
        { key: 'date', header: 'التاريخ', render: (t) => <span dir="ltr">{new Date(t.timestamp).toLocaleString('ar-SA')}</span> },
        { key: 'desc', header: 'الوصف', render: (t) => t.description || '-' },
    ];

    return (<div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h2 style={{ margin: 0 }}>المحفظة</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
        <Card variant="dark">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>الرصيد الإجمالي</div>
              <div style={{ fontSize: 36, fontWeight: 'bold' }}>{wallet.balance} ر.س</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', marginTop: 4, fontSize: 13 }}>
                المتاح للسحب: <strong style={{ color: 'white' }}>{wallet.available} ر.س</strong>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Button variant="secondary" style={{ flex: 1 }} onClick={() => setIsWithdrawOpen(true)} disabled={outstandingDebt > 0}>
              طلب سحب الرصيد
            </Button>
            <Button variant="outline" style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', borderColor: 'transparent' }} onClick={() => setIsTopUpOpen(true)}>
              شحن الرصيد
            </Button>
          </div>
          {outstandingDebt > 0 && (
            <p style={{ color: '#ffb4b4', fontSize: 13, marginTop: 12 }}>
              عليك سداد {outstandingDebt} ر.س من عمولة إلغاء سابقة — لا يمكنك تقديم عروض جديدة أو سحب رصيد حتى تُسدد. اشحن رصيدك لسداد الدين تلقائياً والعودة للعمل.
            </p>
          )}
        </Card>

        <Card>
          <h3 style={{ marginBottom: 16 }}>الرصيد المعلق (طلبات سحب قيد المعالجة)</h3>
          <PriceBlock amount={wallet.reservedBalance} size="lg"/>
          <p className="text-helper" style={{ marginTop: 8 }}>
            هذا الرصيد محجوز ريثما تتم معالجة طلب السحب.
          </p>
        </Card>
      </div>

      <Card>
        <h3 style={{ marginBottom: 16 }}>سجل العمليات</h3>
        <DataTable data={transactions} columns={columns} keyExtractor={t => t.id} emptyMessage="لا توجد عمليات سابقة"/>
      </Card>

      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        onConfirm={handleWithdraw}
        isLoading={isWithdrawing}
        currentBalance={wallet.available}
      />

      <TopUpModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        onConfirm={handleTopUp}
        isLoading={isToppingUp}
      />
    </div>);
};
