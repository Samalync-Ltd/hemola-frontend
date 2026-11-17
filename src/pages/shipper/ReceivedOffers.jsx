import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriceBlock } from '../../components/common/PriceBlock';
import { shipmentService, offerService } from '../../services/api';
import { OfferStatus } from '../../constants/enums';
import { Loader } from '../../components/common/Loader';
import { formatDateTime, formatMoney, formatRating, formatRoute, formatWeight } from '../../utils/format';
import { toUserMessage } from '../../utils/errors';
import { useT } from '../../i18n';
import { useNames } from '../../i18n/catalog';

/** Live: new offers, counters and the assignment appear without a refresh. */
export const ReceivedOffers = () => {
    const { shipmentId } = useParams();
    const navigate = useNavigate();
    const { t } = useT();
    const { cargoName, truckName } = useNames();
    const [shipment, setShipment] = useState(undefined); // undefined = loading
    const [offers, setOffers] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!shipmentId) return undefined;
        const onError = (err) => setError(toUserMessage(err));
        const unsubscribers = [
            shipmentService.subscribe(shipmentId, setShipment, onError),
            offerService.subscribeOffersForShipment(shipmentId, setOffers, onError),
        ];
        return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
    }, [shipmentId]);

    if (shipment === undefined || offers === null)
        return error ? <div role="alert">{error}</div> : <Loader label={t('offers.loading')} />;
    if (!shipment)
        return <div>{t('errors.app.shipmentNotFound')}</div>;

    const columns = [
        { key: 'carrier', header: t('offers.carrier'), render: (o) => (<div>
        <div style={{ fontWeight: 700 }}>{o.carrierName}</div>
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
          ⭐ {formatRating(o.carrierRating, o.carrierCompletedTrips)} | {truckName(o.carrierTruckType)}
        </div>
      </div>) },
        { key: 'price', header: t('offers.offeredPrice'), render: (o) => <PriceBlock amount={o.offeredPrice}/> },
        { key: 'status', header: t('common.status'), render: (o) => <StatusBadge status={o.status}/> },
        { key: 'time', header: t('offers.submittedAt'), render: (o) => <span dir="ltr">{formatDateTime(o.submittedAt)}</span> },
        {
            key: 'actions',
            header: t('common.action'),
            render: (o) => (<div style={{ display: 'flex', gap: 8 }}>
          {o.status === OfferStatus.ACCEPTED && shipment.tripId ? (
            <Button size="sm" onClick={() => navigate(`/app/trips/${shipment.tripId}/track`)}>{t('trips.view')}</Button>
          ) : (
            <Button size="sm" variant={o.status === OfferStatus.PENDING ? 'primary' : 'outline'} onClick={() => navigate(`/app/shipments/${shipment.id}/negotiation/${o.id}`)}>
              {o.status === OfferStatus.PENDING && o.proposedBy === 'CARRIER' ? t('offers.reply') : t('offers.openNegotiation')}
            </Button>
          )}
        </div>)
        },
    ];
    return (<div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>{t('offers.receivedTitle', { route: formatRoute(shipment.pickupCity, shipment.deliveryCity, 'arrowLeft') })}</h2>
        <Button variant="outline" onClick={() => navigate(`/app/shipments/${shipment.id}`)}>{t('shipments.detailsButton')}</Button>
      </div>

      {shipment.tripId && (
        <div role="status" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', padding: '14px 18px', borderRadius: 12, backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid var(--color-success)' }}>
          <span style={{ fontWeight: 700, color: 'var(--color-success)' }}>
            {t('offers.assigned')}{shipment.finalPrice ? ` — ${formatMoney(shipment.finalPrice)}` : ''}
          </span>
          <Button onClick={() => navigate(`/app/trips/${shipment.tripId}/track`)}>{t('trips.view')}</Button>
        </div>
      )}

      <Card variant="dark">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 24 }}>
            <div>
              <div className="text-helper" style={{ color: 'rgba(255,255,255,0.7)' }}>{t('shipments.columns.route')}</div>
              <strong>{formatRoute(shipment.pickupCity, shipment.deliveryCity, 'to')}</strong>
            </div>
            <div>
              <div className="text-helper" style={{ color: 'rgba(255,255,255,0.7)' }}>{t('shipments.cargo')}</div>
              <strong>{cargoName(shipment)} ({formatWeight(shipment.weight)})</strong>
            </div>
            <div>
              <div className="text-helper" style={{ color: 'rgba(255,255,255,0.7)' }}>{t('shipments.requiredTruck')}</div>
              <strong>{truckName(shipment.requiredTruckType)}</strong>
            </div>
          </div>
          <div style={{ textAlign: 'end' }}>
            <div className="text-helper" style={{ color: 'rgba(255,255,255,0.7)' }}>{t('shipments.proposedPrice')}</div>
            <strong style={{ fontSize: 20 }}>{formatMoney(shipment.proposedPrice)}</strong>
          </div>
        </div>
      </Card>

      {error && <div role="alert" style={{ color: 'var(--color-error)', fontSize: 13 }}>{error}</div>}

      <Card>
        <DataTable data={offers} columns={columns} keyExtractor={(o) => o.id} emptyMessage={t('offers.empty')}/>
      </Card>
    </div>);
};
