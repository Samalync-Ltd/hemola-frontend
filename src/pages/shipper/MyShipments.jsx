import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriceBlock } from '../../components/common/PriceBlock';
import { shipmentService, authService } from '../../services/api';
import { ShipmentStatus } from '../../constants/enums';
import { useT } from '../../i18n';
import { useNames } from '../../i18n/catalog';
import { formatDateTime, formatWeight } from '../../utils/format';
import { SkeletonRows } from '../../components/common/Loader';
export const MyShipments = () => {
    const navigate = useNavigate();
    const { t } = useT();
    const { cargoName } = useNames();
    const [shipments, setShipments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('ALL');
    useEffect(() => {
        Promise.all([authService.getCurrentUser(), shipmentService.getShipments()]).then(([user, data]) => {
            // Each shipper only sees their own shipments — never another
            // shipper's, and never a brand-new account's seeded "sample" data.
            setShipments(user ? data.filter(s => s.shipperId === user.id) : data);
            setIsLoading(false);
        });
    }, []);
    const tabs = [
        { id: 'ALL', label: t('shipments.all') },
        ...Object.values(ShipmentStatus).map(status => ({
            id: status,
            label: t(`enums.shipmentStatus.${status}`)
        }))
    ];
    const filteredShipments = activeTab === 'ALL'
        ? shipments
        : shipments.filter(s => s.status === activeTab);
    const columns = [
        { key: 'id', header: t('shipments.columns.id'), render: (s) => <strong>{s.id}</strong> },
        { key: 'route', header: t('shipments.columns.route'), render: (s) => t('shipments.routeArrow', { from: s.pickupCity, to: s.deliveryCity }) },
        { key: 'cargo', header: t('shipments.cargo'), render: (s) => cargoName(s) },
        { key: 'weight', header: t('shipments.weight'), render: (s) => formatWeight(s.weight) },
        { key: 'date', header: t('shipments.loadingDate'), render: (s) => formatDateTime(s.loadingDate) },
        { key: 'price', header: t('shipments.proposedPrice'), render: (s) => <PriceBlock amount={s.proposedPrice}/> },
        { key: 'offers', header: t('shipments.columns.offerCount'), render: (s) => s.offerCount },
        { key: 'status', header: t('common.status'), render: (s) => <StatusBadge status={s.status}/> },
        {
            key: 'actions',
            header: t('common.action'),
            render: (s) => {
                if (s.status === ShipmentStatus.PENDING_OFFERS || s.status === ShipmentStatus.NEGOTIATING) {
                    return <Button size="sm" variant="outline" onClick={() => navigate(`/app/shipments/${s.id}/offers`)}>{t('shipments.viewOffers')}</Button>;
                }
                if (s.status === ShipmentStatus.ACTIVE) {
                    return <Button size="sm" onClick={() => navigate(`/app/trips/${s.id}/track`)}>{t('trips.follow')}</Button>;
                }
                return <Button size="sm" variant="outline" onClick={() => navigate(`/app/shipments/${s.id}`)}>{t('common.details')}</Button>;
            }
        },
    ];
    return (<div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>{t('nav.myShipments')}</h2>
        <Button onClick={() => navigate('/app/shipments/new')}>{t('shipments.create.title')}</Button>
      </div>

      <Card>
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', paddingBottom: 8 }}>
          {tabs.map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                padding: '8px 16px',
                borderRadius: 999,
                border: '1px solid',
                borderColor: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-border)',
                backgroundColor: activeTab === tab.id ? 'var(--color-primary)' : 'transparent',
                color: activeTab === tab.id ? 'white' : 'var(--color-text-primary)',
                fontWeight: 700,
                fontSize: 14,
                whiteSpace: 'nowrap',
                cursor: 'pointer'
            }}>
              {tab.label}
              {tab.id !== 'ALL' && (<span style={{
                    marginInlineStart: 8,
                    padding: '2px 8px',
                    backgroundColor: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : 'var(--color-background)',
                    borderRadius: 12,
                    fontSize: 12
                }}>
                  {shipments.filter(s => s.status === tab.id).length}
                </span>)}
            </button>))}
        </div>

        {isLoading ? (<SkeletonRows rows={6} columns={5} label={t('shipments.loadingList')} />) : (<DataTable data={filteredShipments} columns={columns} keyExtractor={(s) => s.id} emptyMessage={t('shipments.empty')}/>)}
      </Card>
    </div>);
};
