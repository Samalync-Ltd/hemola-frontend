import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Dashboard.module.css';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriceBlock } from '../../components/common/PriceBlock';
import { DataTable } from '../../components/common/DataTable';
import { shipmentService, tripService, walletService, authService } from '../../services/api';
import { ShipmentStatus } from '../../constants/enums';
import { TopUpModal } from '../../components/wallet/TopUpModal';
export const Dashboard = () => {
    const navigate = useNavigate();
    const [shipments, setShipments] = useState([]);
    const [trips, setTrips] = useState([]);
    const [wallet, setWallet] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isTopUpOpen, setIsTopUpOpen] = useState(false);
    const [isToppingUp, setIsToppingUp] = useState(false);

    const fetchData = async () => {
        try {
            const [user, sh, tr, wa] = await Promise.all([
                authService.getCurrentUser(),
                shipmentService.getShipments(),
                tripService.getTrips(),
                walletService.getWallet()
            ]);
            // Only this shipper's own shipments/trips — never another
            // shipper's, and never a brand-new account's seeded sample data.
            setShipments(user ? sh.filter(s => s.shipperId === user.id) : sh);
            setTrips(user ? tr.filter(t => t.shipperId === user.id) : tr);
            setWallet(wa);
        }
        finally {
            setIsLoading(false);
        }
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

    if (isLoading) {
        return <div>جاري التحميل...</div>;
    }
    const pendingShipments = shipments.filter(s => s.status === ShipmentStatus.OFFERS_PENDING ||
        s.status === ShipmentStatus.NEGOTIATING ||
        s.status === ShipmentStatus.SELECTION_AWAITING);
    const activeTrips = trips.filter(t => t.currentStage !== 'DELIVERED'); // Simplifying active condition for demo
    const columns = [
        { key: 'id', header: 'رقم الشحنة', render: (s) => <strong>{s.id}</strong> },
        { key: 'route', header: 'المسار', render: (s) => `${s.pickupCity} -> ${s.deliveryCity}` },
        { key: 'cargo', header: 'البضاعة', render: (s) => s.cargoType },
        { key: 'status', header: 'الحالة', render: (s) => <StatusBadge status={s.status}/> },
        { key: 'offers', header: 'العروض', render: (s) => s.offerCount > 0 ? `${s.offerCount} عروض` : '-' },
        {
            key: 'actions',
            header: 'الإجراء',
            render: (s) => (<Button size="sm" variant="outline" onClick={() => navigate(`/app/shipments/${s.id}`)}>
          {s.offerCount > 0 ? 'عرض العروض' : 'التفاصيل'}
        </Button>)
        },
    ];
    return (<div className={styles.dashboard}>
      <div className={styles.kpiGrid}>
        <Card className={styles.kpiCard}>
          <span className={styles.kpiLabel}>بانتظار العروض</span>
          <span className={styles.kpiValue}>{shipments.filter(s => s.status === ShipmentStatus.OFFERS_PENDING).length}</span>
        </Card>
        <Card className={styles.kpiCard}>
          <span className={styles.kpiLabel}>قيد التفاوض</span>
          <span className={styles.kpiValue}>{shipments.filter(s => s.status === ShipmentStatus.NEGOTIATING).length}</span>
        </Card>
        <Card className={styles.kpiCard}>
          <span className={styles.kpiLabel}>رحلات جارية</span>
          <span className={styles.kpiValue}>{activeTrips.length}</span>
        </Card>
        <Card className={styles.kpiCard}>
          <span className={styles.kpiLabel}>رصيد المحفظة</span>
          <span className={styles.kpiValue}>{wallet ? `${wallet.balance} ر.س` : '-'}</span>
        </Card>
      </div>

      <div className={styles.sections}>
        <div>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>شحنات تتطلب إجراء</h3>
            <Button variant="outline" size="sm" onClick={() => navigate('/app/shipments')}>عرض الكل</Button>
          </div>
          <DataTable data={pendingShipments.slice(0, 5)} columns={columns} keyExtractor={(s) => s.id} emptyMessage="لا توجد شحنات تتطلب إجراء حالياً"/>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {activeTrips.length > 0 && (<div>
              <h3 className={styles.sectionTitle} style={{ marginBottom: 16 }}>الرحلات الجارية</h3>
              {activeTrips.slice(0, 2).map(trip => (<Card key={trip.id} style={{ marginBottom: 16 }}>
                  <div className={styles.tripCard}>
                    <div className={styles.tripInfo}>
                      <strong>{trip.shipmentId}</strong>
                      <span className="text-helper">{trip.route}</span>
                      <StatusBadge status={trip.currentStage}/>
                    </div>
                    <div>
                      <PriceBlock amount={trip.finalPrice}/>
                    </div>
                  </div>
                  <Button style={{ width: '100%' }} onClick={() => navigate(`/app/trips/${trip.id}/track`)}>متابعة الرحلة</Button>
                </Card>))}
            </div>)}

          <Card variant="dark">
            <div className={styles.walletHeader}>
              <div className={styles.walletBalance}>
                <span className="text-helper">الرصيد الحالي</span>
                <h2>{wallet?.balance} ر.س</h2>
              </div>
              <WalletIcon />
            </div>
            {wallet?.reservedBalance ? (<div style={{ marginBottom: 16 }}>
                <span className="text-helper" style={{ display: 'block' }}>مبالغ محجوزة: {wallet.reservedBalance} ر.س</span>
              </div>) : null}
            <div style={{ display: 'flex', gap: 12 }}>
              <Button variant="secondary" style={{ flex: 1 }} onClick={() => setIsTopUpOpen(true)}>شحن المحفظة</Button>
              <Button variant="outline" style={{ flex: 1 }} onClick={() => navigate('/app/wallet')}>كشف حساب</Button>
            </div>
          </Card>
        </div>
      </div>
      
      <TopUpModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        onConfirm={handleTopUp}
        isLoading={isToppingUp}
      />
    </div>);
};
const WalletIcon = () => (<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
  </svg>);
