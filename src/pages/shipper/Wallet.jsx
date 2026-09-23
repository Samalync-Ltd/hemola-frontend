import React, { useEffect, useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { walletService } from '../../services/api';
import { PriceBlock } from '../../components/common/PriceBlock';
import { DataTable } from '../../components/common/DataTable';
import { TopUpModal } from '../../components/wallet/TopUpModal';
import { TransactionType } from '../../constants/enums';

// Withdrawals are carrier-only (INTEGRATION.md §12 requestWithdrawal), so a
// shipper's statement never shows WITHDRAWAL.
const TRANSACTION_LABELS = {
    [TransactionType.TOP_UP]: 'شحن رصيد',
    [TransactionType.TRIP_SETTLEMENT]: 'دفعة شحنة',
    [TransactionType.COMMISSION_DEDUCTION]: 'عمولة إلغاء',
    [TransactionType.FEE_DEDUCTION]: 'سداد مديونية',
    [TransactionType.DEBT_FORGIVENESS]: 'إعفاء من المديونية',
};

export const WalletPage = () => {
    const [wallet, setWallet] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isTopUpOpen, setIsTopUpOpen] = useState(false);
    const [isToppingUp, setIsToppingUp] = useState(false);

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

    const handleTopUp = async (amount) => {
        setIsToppingUp(true);
        try {
            await walletService.topUp(amount);
            await fetchData();
            setIsTopUpOpen(false);
        } catch (error) {
            console.error('Failed to top up', error);
        } finally {
            setIsToppingUp(false);
        }
    };

    if (isLoading)
        return <div>جاري التحميل...</div>;
    if (!wallet)
        return <div>لا توجد بيانات للمحفظة</div>;
    const columns = [
        { key: 'id', header: 'رقم العملية', render: (t) => <strong>{t.id}</strong> },
        { key: 'type', header: 'النوع', render: (t) => TRANSACTION_LABELS[t.type] || t.type },
        { key: 'amount', header: 'المبلغ', render: (t) => (t.amount === 0 && t.withheld
            ? <span className="text-helper">خُصم {t.withheld} ر.س من المستحق</span>
            : <span style={{ color: t.amount >= 0 ? 'var(--color-success)' : 'var(--color-error)' }} dir="ltr">
        {t.amount > 0 ? '+' : ''}{t.amount} ر.س
      </span>) },
        { key: 'date', header: 'التاريخ', render: (t) => <span dir="ltr">{new Date(t.timestamp).toLocaleString('ar-SA')}</span> },
        { key: 'ref', header: 'المرجع', render: (t) => t.referenceId || '-' }
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
                المتاح للاستخدام: <strong style={{ color: 'white' }}>{wallet.available} ر.س</strong>
              </div>
            </div>
            {/* Wallet Icon */}
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
              <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
            </svg>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Button variant="secondary" style={{ flex: 1 }} onClick={() => setIsTopUpOpen(true)}>شحن الرصيد</Button>
          </div>
        </Card>

        <Card>
          <h3 style={{ marginBottom: 16 }}>الرصيد المعلق (محجوز للرحلات)</h3>
          <PriceBlock amount={wallet.reservedBalance} size="lg"/>
          <p className="text-helper" style={{ marginTop: 8 }}>
            هذا الرصيد محجوز للرحلات الجارية أو قيد التفاوض النهائي. لا يمكن سحبه حتى انتهاء الرحلة.
          </p>
        </Card>
      </div>

      <Card>
        <h3 style={{ marginBottom: 16 }}>سجل العمليات</h3>
        <DataTable data={transactions} columns={columns} keyExtractor={t => t.id} emptyMessage="لا توجد عمليات سابقة"/>
      </Card>

      <TopUpModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        onConfirm={handleTopUp}
        isLoading={isToppingUp}
      />
    </div>);
};
