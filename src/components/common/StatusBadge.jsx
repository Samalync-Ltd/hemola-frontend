import React from 'react';
import styles from './StatusBadge.module.css';
import { ShipmentStatus, ShipmentStatusAr, OfferStatus, OfferStatusAr, TripStage, TripStageAr, AccountStatus, DocumentStatus } from '../../constants/enums';
export const StatusBadge = ({ status, label, className = '' }) => {
    let text = label || status;
    let variant = styles.neutral;
    // ShipmentStatus
    if (Object.values(ShipmentStatus).includes(status)) {
        text = label || ShipmentStatusAr[status];
        switch (status) {
            case ShipmentStatus.OFFERS_PENDING:
                variant = styles.neutral;
                break;
            case ShipmentStatus.NEGOTIATING:
            case ShipmentStatus.SELECTION_AWAITING:
                variant = styles.warning;
                break;
            case ShipmentStatus.ACTIVE:
                variant = styles.info;
                break;
            case ShipmentStatus.COMPLETED:
                variant = styles.success;
                break;
            case ShipmentStatus.CANCELLED:
                variant = styles.error;
                break;
        }
    }
    // OfferStatus
    if (Object.values(OfferStatus).includes(status)) {
        text = label || OfferStatusAr[status];
        switch (status) {
            case OfferStatus.PENDING:
                variant = styles.neutral;
                break;
            case OfferStatus.COUNTERED:
                variant = styles.warning;
                break;
            case OfferStatus.ACCEPTED:
                variant = styles.success;
                break;
            case OfferStatus.REJECTED:
                variant = styles.error;
                break;
        }
    }
    // TripStage
    if (Object.values(TripStage).includes(status)) {
        text = label || TripStageAr[status];
        switch (status) {
            case TripStage.ASSIGNED:
            case TripStage.EN_ROUTE_PICKUP:
            case TripStage.ARRIVED_PICKUP:
            case TripStage.LOADED:
            case TripStage.EN_ROUTE_DELIVERY:
                variant = styles.warning;
                break;
            case TripStage.DELIVERED:
                variant = styles.success;
                break;
        }
    }
    // Account & Document
    if (status === AccountStatus.UNDER_REVIEW || status === DocumentStatus.PENDING) {
        text = label || 'قيد المراجعة';
        variant = styles.warning;
    }
    else if (status === AccountStatus.VERIFIED || status === DocumentStatus.APPROVED) {
        text = label || 'موثق';
        variant = styles.success;
    }
    else if (status === AccountStatus.REJECTED || status === DocumentStatus.REJECTED) {
        text = label || 'مرفوض';
        variant = styles.error;
    }
    const classes = [styles.badge, variant, className].filter(Boolean).join(' ');
    return (<span className={classes}>
      {text}
    </span>);
};
