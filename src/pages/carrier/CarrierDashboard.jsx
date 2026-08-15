import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../shipper/Dashboard.module.css';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriceBlock } from '../../components/common/PriceBlock';
import { DataTable } from '../../components/common/DataTable';
import { shipmentService, tripService, walletService, authService, offerService } from '../../services/api';
import { ShipmentStatus, OfferStatus } from '../../constants/enums';
import { WithdrawModal } from '../../components/wallet/WithdrawModal';

export const CarrierDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [availableShipments, setAvailableShipments] = useState([]);
    const [trips, setTrips] = useState([]);
    const [offers, setOffers] = useState([]);
    const [wallet, setWallet] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
    const [isWithdrawing, setIsWithdrawing] = useState(false);

    const fetchData = async () => {
        try {
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);
            
            const [sh, tr, wa, off] = await Promise.all([
                shipmentService.getShipments(),
                tripService.getTrips(),
                walletService.getWallet(),
                offerService.getOffersByCarrier(currentUser.id)
            ]);
            
            // For a carrier, available shipments are those pending offers or negotiating 
            // and NOT assigned to them or anyone else
            setAvailableShipments(sh.filter(s => 
                s.status === ShipmentStatus.OFFERS_PENDING || 
                s.status === ShipmentStatus.NEGOTIATING
            ));
            
            setTrips(tr.filter(t => t.carrierId === currentUser.id));
            setWallet(wa);
            setOffers(off);
        }
        finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        fetchData();
    }, []);

    const handleWithdraw = async (amount) => {
        setIsWithdrawing(true);
        try {
            await walletService.withdraw(amount);
            await fetchData();
            setIsWithdrawOpen(false);
        } catch (error) {
            console.error('Failed to withdraw', error);
        } finally {
            setIsWithdrawing(false);
        }
    };

    if (isLoading) {
        return <div>جاري التحميل...</div>;
    }

    const activeTrips = trips.filter(t => t.currentStage !== 'DELIVERED');
    const pendingOffers = offers.filter(o => o.status === OfferStatus.PENDING || o.status === OfferStatus.COUNTERED);

    const shipmentColumns = [
        { key: 'route', header: 'المسار', render: (s) => `${s.pickupCity} -> ${s.deliveryCity}` },
        { key: 'cargo', header: 'البضاعة', render: (s) => `${s.cargoType} (${s.weight} طن)` },
        { key: 'date', header: 'التاريخ', render: (s) => s.loadingDate },
        { key: 'price', header: 'السعر', render: (s) => <span dir="ltr">{s.proposedPrice} ر.س</span> },
        {
            key: 'actions',
            header: 'الإجراء',
            render: (s) => (<Button size="sm" variant="outline" onClick={() => navigate(`/app/shipments/${s.id}`)}>
          تقديم عرض
        </Button>)
        },
    ];

    return (<div className={styles.dashboard}>
      <div className={styles.kpiGrid}>
        <Card className={styles.kpiCard}>
          <span className={styles.kpiLabel}>شحنات متاحة</span>
          <span className={styles.kpiValue}>{availableShipments.length}</span>
        </Card>
        <Card className={styles.kpiCard}>
          <span className={styles.kpiLabel}>عروض بانتظار الرد</span>
          <span className={styles.kpiValue}>{pendingOffers.length}</span>
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
            <h3 className={styles.sectionTitle}>شحنات متاحة حديثاً</h3>
            <Button variant="outline" size="sm" onClick={() => navigate('/app/shipments')}>تصفح الشحنات</Button>
          </div>
          <DataTable data={availableShipments.slice(0, 5)} columns={shipmentColumns} keyExtractor={(s) => s.id} emptyMessage="لا توجد شحنات متاحة حالياً المطابقة لنوع مركبتك"/>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {activeTrips.length > 0 && (<div>
              <h3 className={styles.sectionTitle} style={{ marginBottom: 16 }}>رحلاتك الجارية</h3>
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
                  <Button style={{ width: '100%' }} onClick={() => navigate(`/app/trips/${trip.id}/track`)}>تحديث حالة الرحلة</Button>
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
            <div style={{ display: 'flex', gap: 12 }}>
              <Button variant="secondary" style={{ flex: 1 }} onClick={() => setIsWithdrawOpen(true)}>سحب الرصيد</Button>
              <Button variant="outline" style={{ flex: 1 }} onClick={() => navigate('/app/wallet')}>سجل العمليات</Button>
            </div>
          </Card>
        </div>
      </div>

      {wallet && (
        <WithdrawModal
            isOpen={isWithdrawOpen}
            onClose={() => setIsWithdrawOpen(false)}
            onConfirm={handleWithdraw}
            isLoading={isWithdrawing}
            currentBalance={wallet.balance}
        />
      )}
    </div>);
};

const WalletIcon = () => (<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
  </svg>);
