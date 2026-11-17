import React from 'react';
import styles from './StatusBadge.module.css';
import { ShipmentStatus, OfferStatus, TripStage, AccountStatus, DocumentStatus } from '../../constants/enums';
import { useT } from '../../i18n';

const SHIPMENT_VARIANT = {
    [ShipmentStatus.PENDING_OFFERS]: 'neutral',
    [ShipmentStatus.NEGOTIATING]: 'warning',
    [ShipmentStatus.ACTIVE]: 'info',
    [ShipmentStatus.COMPLETED]: 'success',
    [ShipmentStatus.CANCELLED]: 'error',
};
const OFFER_VARIANT = {
    [OfferStatus.PENDING]: 'neutral',
    [OfferStatus.COUNTERED]: 'warning',
    [OfferStatus.ACCEPTED]: 'success',
    [OfferStatus.REJECTED]: 'error',
};

/**
 * A status as a coloured pill. The text comes from the status code
 * (enums.* in src/i18n/strings) unless a `label` is given.
 */
export const StatusBadge = ({ status, label, className = '' }) => {
    const { t } = useT();
    let text = label || status;
    let variant = 'neutral';
    // Shipment, offer and trip statuses share no codes except PENDING
    // (offer) — checked in the same order as always.
    if (SHIPMENT_VARIANT[status]) {
        text = label || t(`enums.shipmentStatus.${status}`);
        variant = SHIPMENT_VARIANT[status];
    }
    if (OFFER_VARIANT[status]) {
        text = label || t(`enums.offerStatus.${status}`);
        variant = OFFER_VARIANT[status];
    }
    if (Object.values(TripStage).includes(status)) {
        text = label || t(`enums.tripStage.${status}`);
        variant = status === TripStage.DELIVERED ? 'success' : 'warning';
    }
    // Account & document review
    if (status === AccountStatus.UNDER_REVIEW || status === DocumentStatus.PENDING) {
        text = label || t('enums.review.UNDER_REVIEW');
        variant = 'warning';
    } else if (status === AccountStatus.VERIFIED || status === DocumentStatus.APPROVED) {
        text = label || t('enums.review.VERIFIED');
        variant = 'success';
    } else if (status === AccountStatus.REJECTED || status === DocumentStatus.REJECTED) {
        text = label || t('enums.review.REJECTED');
        variant = 'error';
    }
    const classes = [styles.badge, styles[variant], className].filter(Boolean).join(' ');
    return (<span className={classes}>
      {text}
    </span>);
};
