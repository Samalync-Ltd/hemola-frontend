import React, { useEffect, useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { PriceBlock } from '../../components/common/PriceBlock';
import { DataTable } from '../../components/common/DataTable';
import { WithdrawModal } from '../../components/wallet/WithdrawModal';
import { walletService } from '../../services/api';
import { TransactionType } from '../../constants/enums';

const TRANSACTION_LABELS = {
    [TransactionType.TRIP_SETTLEMENT]: 'أرباح رحلة',
    [TransactionType.WITHDRAWAL]: 'سحب رصيد',
    [TransactionType.COMMISSION_DEDUCTION]: 'عمولة إلغاء',
};

// Carrier wallet — deliberately no top-up affordance: earnings only ever
// come from TRIP_SETTLEMENT (trip payouts, net of the platform commission).
// Matches mobile's carrier wallet exactly.
export const CarrierWallet = () => {
    const [wallet, setWallet] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
    const [isWithdrawing, setIsWithdrawing] = useState(false);

    const fetchData = () => Promise.all([
        walletService.getWallet(),
        walletService.getTransactions(),
    ]).then(([w, t]) => {
        setWallet(w);
        // Carrier earnings come only from trip settlements — filter out any
        // stray transaction types that don't apply to this role.
        setTransactions(t.filter(txn => txn.type in TRANSACTION_LABELS));
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

    if (isLoading) return <div>جاري التحميل...</div>;
    if (!wallet) return <div>لا توجد بيانات للمحفظة</div>;

    const columns = [
        { key: 'id', header: 'رقم العملية', render: (t) => <strong>{t.id}</strong> },
        { key: 'type', header: 'النوع', render: (t) => TRANSACTION_LABELS[t.type] || t.type },
        { key: 'amount', header: 'المبلغ', render: (t) => (<span style={{ color: t.amount >= 0 ? 'var(--color-success)' : 'var(--color-error)' }} dir="ltr">
        {t.amount >= 0 ? '+' : ''}{t.amount} ر.س
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
          <Button variant="secondary" style={{ width: '100%' }} onClick={() => setIsWithdrawOpen(true)}>
            طلب سحب الرصيد
          </Button>
          {wallet.balance < 0 && (
            <p style={{ color: '#ffb4b4', fontSize: 13, marginTop: 12 }}>
              عليك سداد {Math.abs(wallet.balance)} ر.س من عمولة إلغاء سابقة — يتم خصمها تلقائياً من تسوية رحلتك القادمة.
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
    </div>);
};
