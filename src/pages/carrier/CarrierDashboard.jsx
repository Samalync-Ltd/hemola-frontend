import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../shipper/Dashboard.module.css';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriceBlock } from '../../components/common/PriceBlock';
import { DataTable } from '../../components/common/DataTable';
import { shipmentService, tripService, walletService, authService, offerService } from '../../services/api';
import { OfferStatus } from '../../constants/enums';
import { WithdrawModal } from '../../components/wallet/WithdrawModal';
import { Loader } from '../../components/common/Loader';
import { isShipmentForCarrier, carrierBlockReason } from '../../utils/carrierEligibility';
import { CarrierBlockNotice } from '../../components/carrier/CarrierBlockNotice';
import { formatDateTime, formatMoney, formatRoute, formatWeight, displayAmount } from '../../utils/format';
import { useT } from '../../i18n';
import { useNames } from '../../i18n/catalog';

export const CarrierDashboard = () => {
    const navigate = useNavigate();
    const { t } = useT();
    const { cargoName } = useNames();
    const [user, setUser] = useState(null);
    const [availableShipments, setAvailableShipments] = useState([]);
    const [trips, setTrips] = useState([]);
    const [offers, setOffers] = useState([]);
    const [wallet, setWallet] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

    const fetchData = async () => {
        try {
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);

            const [sh, tr, wa, off] = await Promise.all([
                shipmentService.getShipments(),
                tripService.getTrips(),
                walletService.getWallet(),
                // The pending-offers count is secondary — never let it take
                // the whole home page down with it.
                offerService.getOffersByCarrier(currentUser.id).catch(() => [])
            ]);

            // Same rule as the shipments page: open, and one of the carrier's
            // trucks matches the type and can carry the weight.
            const available = sh.filter(s => isShipmentForCarrier(s, currentUser));
            setAvailableShipments(available);

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
    // Live balance — top-ups, reservations, settlements and fees show without a refresh.
    useEffect(() => walletService.subscribe(setWallet, () => {}), []);

    const handleWithdrawCompleted = async () => {
        await fetchData();
        setIsWithdrawOpen(false);
    };

    if (isLoading) {
        return <Loader label={t('dashboard.loading')} />;
    }

    // Only trips still running — cancelled and completed ones drop off the home page.
    const activeTrips = trips.filter(t => t.overallStatus ? t.overallStatus === 'ACTIVE' : t.currentStage !== 'DELIVERED');
    const pendingOffers = offers.filter(o => o.status === OfferStatus.PENDING || o.status === OfferStatus.COUNTERED);

    const shipmentColumns = [
        { key: 'route', header: t('shipments.columns.route'), render: (s) => formatRoute(s.pickupCity, s.deliveryCity) },
        { key: 'cargo', header: t('shipments.cargo'), render: (s) => `${cargoName(s)} (${formatWeight(s.weight)})` },
        { key: 'date', header: t('common.date'), render: (s) => formatDateTime(s.loadingDate) },
        { key: 'price', header: t('shipments.price'), render: (s) => <span dir="ltr">{t('common.money', { amount: displayAmount(s.proposedPrice) })}</span> },
        {
            key: 'actions',
            header: t('common.action'),
            render: (s) => (<Button size="sm" variant="outline" onClick={() => navigate(`/app/shipments/${s.id}`)}>
         {t('shipments.carrier.viewDetails')}
        </Button>)
        },
    ];

    return (<div className={styles.dashboard}>
      <CarrierBlockNotice reason={carrierBlockReason(user)} />
      <div className={styles.kpiGrid}>
        <Card className={styles.kpiCard}>
          <span className={styles.kpiLabel}>{t('dashboard.availableShipments')}</span>
          <span className={styles.kpiValue}>{availableShipments.length}</span>
        </Card>
        <Card className={styles.kpiCard} style={{ cursor: 'pointer' }} onClick={() => navigate('/app/shipments')}>
          <span className={styles.kpiLabel}>{t('dashboard.pendingOffers')}</span>
          <span className={styles.kpiValue}>{pendingOffers.length}</span>
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
            <h3 className={styles.sectionTitle}>{t('dashboard.newShipments')}</h3>
            <Button variant="outline" size="sm" onClick={() => navigate('/app/shipments')}>{t('dashboard.browseShipments')}</Button>
          </div>
          <DataTable data={availableShipments.slice(0, 5)} columns={shipmentColumns} keyExtractor={(s) => s.id} emptyMessage={t('dashboard.noMatchingShipments')}/>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {activeTrips.length > 0 && (<div>
              <h3 className={styles.sectionTitle} style={{ marginBottom: 16 }}>{t('dashboard.yourActiveTrips')}</h3>
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
                  <Button style={{ width: '100%' }} onClick={() => navigate(`/app/trips/${trip.id}/track`)}>{t('dashboard.updateTrip')}</Button>
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
            <div style={{ display: 'flex', gap: 12 }}>
              <Button variant="secondary" style={{ flex: 1 }} onClick={() => setIsWithdrawOpen(true)}>{t('wallet.withdrawBalance')}</Button>
              <Button variant="outline" style={{ flex: 1 }} onClick={() => navigate('/app/wallet')}>{t('wallet.history')}</Button>
            </div>
          </Card>
        </div>
      </div>

      {wallet && (
        <WithdrawModal
            isOpen={isWithdrawOpen}
            onClose={() => setIsWithdrawOpen(false)}
            onCompleted={handleWithdrawCompleted}
            currentBalance={wallet.available}
            savedBankDetails={user ? { iban: user.iban || '', bankAccountName: user.bankAccountName || '' } : null}
        />
      )}
    </div>);
};

const WalletIcon = () => (<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
  </svg>);
