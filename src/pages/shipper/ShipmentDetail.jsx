import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriceBlock } from '../../components/common/PriceBlock';
import { shipmentService } from '../../services/api';
import { ShipmentStatus } from '../../constants/enums';
import { toUserMessage } from '../../utils/errors';
import { useT } from '../../i18n';
import { useNames } from '../../i18n/catalog';
import { formatDateTime, formatWeight } from '../../utils/format';
import { Loader } from '../../components/common/Loader';
export const ShipmentDetail = () => {
    const { shipmentId } = useParams();
    const navigate = useNavigate();
    const { t } = useT();
    const { cargoName, truckName } = useNames();
    const [shipment, setShipment] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isCancelling, setIsCancelling] = useState(false);
    useEffect(() => {
        if (shipmentId) {
            shipmentService.getShipmentById(shipmentId)
                .then(setShipment)
                .catch(err => setError(toUserMessage(err)))
                .finally(() => setIsLoading(false));
        }
    }, [shipmentId]);
    if (isLoading)
        return <Loader label={t('shipments.loadingOne')} />;
    if (error || !shipment)
        return <div>{error || t('errors.app.shipmentNotFound')}</div>;

    // Free before assignment — no trip/reservation exists yet, so there's
    // nothing to charge. Once a carrier is assigned, cancellation moves to
    // the trip-track screen where commission rules apply.
    const canCancelFree = shipment.status !== ShipmentStatus.ACTIVE && shipment.status !== ShipmentStatus.COMPLETED && shipment.status !== ShipmentStatus.CANCELLED;

    const handleCancel = async () => {
        if (!window.confirm(t('shipments.detail.cancelConfirm'))) return;
        setIsCancelling(true);
        try {
            const updated = await shipmentService.cancelShipment(shipment.id);
            setShipment(updated);
        } catch (err) {
            alert(toUserMessage(err));
        } finally {
            setIsCancelling(false);
        }
    };

    return (<div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, marginBottom: 8 }}>{t('shipments.detail.title', { id: shipment.id })}</h2>
          <StatusBadge status={shipment.status}/>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="outline" onClick={() => navigate('/app/shipments')}>{t('shipments.detail.backToList')}</Button>
          {shipment.offerCount > 0 && (<Button onClick={() => navigate(`/app/shipments/${shipment.id}/offers`)}>{t('shipments.detail.openOffers')}</Button>)}
          {canCancelFree && (
            <Button variant="danger" onClick={handleCancel} isLoading={isCancelling}>{t('shipments.detail.cancel')}</Button>
          )}
        </div>
      </div>

      <div className="responsive-two-col">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Card>
            <h3 style={{ marginBottom: 16 }}>{t('shipments.detail.routeAndCargo')}</h3>
            <div className="responsive-two-col-even">
              <div>
                <div className="text-helper">{t('shipments.pickupCity')}</div>
                <div style={{ fontWeight: 700 }}>{shipment.pickupCity}</div>
              </div>
              <div>
                <div className="text-helper">{t('shipments.deliveryCity')}</div>
                <div style={{ fontWeight: 700 }}>{shipment.deliveryCity}</div>
              </div>
              <div>
                <div className="text-helper">{t('shipments.cargoType')}</div>
                <div style={{ fontWeight: 700 }}>{cargoName(shipment)}</div>
              </div>
              <div>
                <div className="text-helper">{t('shipments.weight')}</div>
                <div style={{ fontWeight: 700 }}>{formatWeight(shipment.weight)}</div>
              </div>
              <div>
                <div className="text-helper">{t('shipments.requiredTruckType')}</div>
                <div style={{ fontWeight: 700 }}>{truckName(shipment.requiredTruckType)}</div>
              </div>
              <div>
                <div className="text-helper">{t('shipments.loadingDateTime')}</div>
                <div style={{ fontWeight: 700 }}>{formatDateTime(shipment.loadingDate)}</div>
              </div>
            </div>
            {shipment.description && (<div style={{ marginTop: 16 }}>
                <div className="text-helper">{t('shipments.extraNotes')}</div>
                <div>{shipment.description}</div>
              </div>)}
          </Card>

          <Card>
            <h3 style={{ marginBottom: 16 }}>{t('shipments.detail.siteTitle')}</h3>
            <p className="text-helper" style={{ fontSize: 12, marginBottom: 12 }}>
              {t('shipments.detail.siteLocked')}
            </p>
            <div className="responsive-two-col-even">
              <div>
                <div className="text-helper">{t('shipments.onSiteContact')}</div>
                <div dir="ltr">{shipment.onSiteContact || '—'}</div>
              </div>
              <div>
                <div className="text-helper">{t('shipments.pickupNotes')}</div>
                <div>{shipment.pickupNotes || '—'}</div>
              </div>
              <div>
                <div className="text-helper">{t('shipments.deliveryNotes')}</div>
                <div>{shipment.deliveryNotes || '—'}</div>
              </div>
            </div>
          </Card>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Card>
            <h3 style={{ marginBottom: 16 }}>{t('shipments.detail.priceSummary')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <PriceBlock label={t('shipments.detail.yourProposedPrice')} amount={shipment.proposedPrice} size="lg"/>
              {shipment.finalPrice && (<div style={{ paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
                  <PriceBlock label={t('shipments.finalPrice')} amount={shipment.finalPrice} size="lg"/>
                </div>)}
            </div>
          </Card>

          <Card>
            <h3 style={{ marginBottom: 16 }}>{t('shipments.detail.activity')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span className="text-helper">{formatDateTime(shipment.createdAt)}</span>
                <strong>{t('shipments.detail.posted')}</strong>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>);
};
