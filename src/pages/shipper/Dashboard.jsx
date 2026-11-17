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
import { Loader } from '../../components/common/Loader';
import { formatMoney, formatRoute } from '../../utils/format';
import { useT } from '../../i18n';
import { useNames } from '../../i18n/catalog';
export const Dashboard = () => {
    const navigate = useNavigate();
    const { t } = useT();
    const { cargoName } = useNames();
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
    // Live balance — top-ups, reservations, settlements and fees show without a refresh.
    useEffect(() => walletService.subscribe(setWallet, () => {}), []);

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

    if (isLoading) {
        return <Loader label={t('dashboard.loading')} />;
    }
    const pendingShipments = shipments.filter(s => s.status === ShipmentStatus.PENDING_OFFERS ||
        s.status === ShipmentStatus.NEGOTIATING);
    // Read status before stage — a cancelled trip keeps the stage it stopped at.
    const activeTrips = trips.filter(t => t.overallStatus ? t.overallStatus === 'ACTIVE' : t.currentStage !== 'DELIVERED');
    const columns = [
        { key: 'id', header: t('shipments.columns.id'), render: (s) => <strong>{s.id}</strong> },
        { key: 'route', header: t('shipments.columns.route'), render: (s) => t('shipments.routeArrow', { from: s.pickupCity, to: s.deliveryCity }) },
        { key: 'cargo', header: t('shipments.cargo'), render: (s) => cargoName(s) },
        { key: 'status', header: t('common.status'), render: (s) => <StatusBadge status={s.status}/> },
        { key: 'offers', header: t('shipments.columns.offers'), render: (s) => s.offerCount > 0 ? t('shipments.offerCount', { count: s.offerCount }) : '-' },
        {
            key: 'actions',
            header: t('common.action'),
            render: (s) => (<Button size="sm" variant="outline" onClick={() => navigate(`/app/shipments/${s.id}`)}>
          {s.offerCount > 0 ? t('shipments.viewOffers') : t('common.details')}
        </Button>)
        },
    ];
    return (<div className={styles.dashboard}>
      <div className={styles.kpiGrid}>
        <Card className={styles.kpiCard}>
          <span className={styles.kpiLabel}>{t('enums.shipmentStatus.PENDING_OFFERS')}</span>
          <span className={styles.kpiValue}>{shipments.filter(s => s.status === ShipmentStatus.PENDING_OFFERS).length}</span>
        </Card>
        <Card className={styles.kpiCard}>
          <span className={styles.kpiLabel}>{t('enums.shipmentStatus.NEGOTIATING')}</span>
          <span className={styles.kpiValue}>{shipments.filter(s => s.status === ShipmentStatus.NEGOTIATING).length}</span>
        </Card>
        <Card className={styles.kpiCard}>
          <span className={styles.kpiLabel}>{t('dashboard.activeTripsKpi')}</span>
          <span className={styles.kpiValue}>{activeTrips.length}</span>
        </Card>
        <Card className={styles.kpiCard}>
          <span className={styles.kpiLabel}>{t('wallet.available')}</span>
          <span className={styles.kpiValue}>{wallet ? formatMoney(wallet.available) : '-'}</span>
        </Card>
      </div>

      <div className={styles.sections}>
        <div>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>{t('dashboard.needsAction')}</h3>
            <Button variant="outline" size="sm" onClick={() => navigate('/app/shipments')}>{t('common.viewAll')}</Button>
          </div>
          <DataTable data={pendingShipments.slice(0, 5)} columns={columns} keyExtractor={(s) => s.id} emptyMessage={t('dashboard.needsActionEmpty')}/>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {activeTrips.length > 0 && (<div>
              <h3 className={styles.sectionTitle} style={{ marginBottom: 16 }}>{t('dashboard.activeTrips')}</h3>
              {activeTrips.slice(0, 2).map(trip => (<Card key={trip.id} style={{ marginBottom: 16 }}>
                  <div className={styles.tripCard}>
                    <div className={styles.tripInfo}>
                      <strong>{trip.shipmentId}</strong>
                      <span className="text-helper">{formatRoute(trip.pickupCity, trip.deliveryCity, 'arrowLeft')}</span>
                      <StatusBadge status={trip.currentStage}/>
                    </div>
                    <div>
                      <PriceBlock amount={trip.finalPrice}/>
                    </div>
                  </div>
                  <Button style={{ width: '100%' }} onClick={() => navigate(`/app/trips/${trip.id}/track`)}>{t('trips.follow')}</Button>
                </Card>))}
            </div>)}

          <Card variant="dark">
            <div className={styles.walletHeader}>
              <div className={styles.walletBalance}>
                <span className="text-helper">{t('wallet.available')}</span>
                <h2>{formatMoney(wallet?.available)}</h2>
              </div>
              <WalletIcon />
            </div>
            {wallet?.reservedBalance ? (<div style={{ marginBottom: 16 }}>
                <span className="text-helper" style={{ display: 'block' }}>{t('dashboard.reservedForTrips', { amount: formatMoney(wallet.reservedBalance) })}</span>
              </div>) : null}
            <div style={{ display: 'flex', gap: 12 }}>
              <Button variant="secondary" style={{ flex: 1 }} onClick={() => setIsTopUpOpen(true)}>{t('wallet.topUpWallet')}</Button>
              <Button variant="outline" style={{ flex: 1 }} onClick={() => navigate('/app/wallet')}>{t('wallet.statement')}</Button>
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
