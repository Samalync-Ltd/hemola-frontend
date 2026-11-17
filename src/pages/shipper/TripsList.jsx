import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriceBlock } from '../../components/common/PriceBlock';
import { tripService, authService } from '../../services/api';
import { SkeletonRows } from '../../components/common/Loader';
import { useT } from '../../i18n';
import { formatRoute } from '../../utils/format';
export const TripsList = () => {
    const navigate = useNavigate();
    const { t } = useT();
    const [trips, setTrips] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        Promise.all([authService.getCurrentUser(), tripService.getTrips()]).then(([user, data]) => {
            // Each side only sees their own trips — a shipper never sees
            // another shipper's trips, a carrier never sees another
            // carrier's.
            const mine = user
                ? data.filter(trip => user.role === 'CARRIER' ? trip.carrierId === user.id : trip.shipperId === user.id)
                : data;
            setTrips(mine);
            setIsLoading(false);
        });
    }, []);
    const columns = [
        { key: 'id', header: t('trips.columns.id'), render: (trip) => <strong>{trip.id}</strong> },
        { key: 'shipment', header: t('shipments.columns.id'), render: (trip) => trip.shipmentId },
        { key: 'route', header: t('shipments.columns.route'), render: (trip) => formatRoute(trip.pickupCity, trip.deliveryCity, 'arrowLeft') },
        { key: 'carrier', header: t('offers.carrier'), render: (trip) => trip.carrierName },
        { key: 'price', header: t('trips.columns.finalPrice'), render: (trip) => <PriceBlock amount={trip.finalPrice}/> },
        { key: 'status', header: t('trips.columns.status'), render: (trip) => <StatusBadge status={trip.overallStatus === 'CANCELLED' ? 'CANCELLED' : trip.currentStage}/> },
        {
            key: 'actions',
            header: t('common.action'),
            render: (trip) => (<Button size="sm" variant="outline" onClick={() => navigate(`/app/trips/${trip.id}/track`)}>
          {t('trips.follow')}
        </Button>)
        },
    ];
    return (<div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>{t('trips.listTitle')}</h2>
      </div>

      <Card>
        {isLoading ? (<SkeletonRows rows={6} columns={5} label={t('trips.loadingList')} />) : (<DataTable data={trips} columns={columns} keyExtractor={(trip) => trip.id} emptyMessage={t('trips.empty')}/>)}
      </Card>
    </div>);
};
