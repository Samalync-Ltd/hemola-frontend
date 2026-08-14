import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriceBlock } from '../../components/common/PriceBlock';
import { shipmentService } from '../../services/api';
import { ShipmentStatus, ShipmentStatusAr } from '../../constants/enums';
export const MyShipments = () => {
    const navigate = useNavigate();
    const [shipments, setShipments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('ALL');
    useEffect(() => {
        shipmentService.getShipments().then(data => {
            setShipments(data);
            setIsLoading(false);
        });
    }, []);
    const tabs = [
        { id: 'ALL', label: 'الكل' },
        ...Object.values(ShipmentStatus).map(status => ({
            id: status,
            label: ShipmentStatusAr[status]
        }))
    ];
    const filteredShipments = activeTab === 'ALL'
        ? shipments
        : shipments.filter(s => s.status === activeTab);
    const columns = [
        { key: 'id', header: 'رقم الشحنة', render: (s) => <strong>{s.id}</strong> },
        { key: 'route', header: 'المسار', render: (s) => `${s.pickupCity} -> ${s.deliveryCity}` },
        { key: 'cargo', header: 'البضاعة', render: (s) => s.cargoType },
        { key: 'weight', header: 'الوزن', render: (s) => `${s.weight} طن` },
        { key: 'date', header: 'تاريخ التحميل', render: (s) => s.loadingDate },
        { key: 'price', header: 'السعر المقترح', render: (s) => <PriceBlock amount={s.proposedPrice}/> },
        { key: 'offers', header: 'عدد العروض', render: (s) => s.offerCount },
        { key: 'status', header: 'الحالة', render: (s) => <StatusBadge status={s.status}/> },
        {
            key: 'actions',
            header: 'الإجراء',
            render: (s) => {
                if (s.status === ShipmentStatus.OFFERS_PENDING || s.status === ShipmentStatus.NEGOTIATING || s.status === ShipmentStatus.SELECTION_AWAITING) {
                    return <Button size="sm" variant="outline" onClick={() => navigate(`/app/shipments/${s.id}/offers`)}>عرض العروض</Button>;
                }
                if (s.status === ShipmentStatus.ACTIVE) {
                    return <Button size="sm" onClick={() => navigate(`/app/trips/${s.id}/track`)}>متابعة الرحلة</Button>;
                }
                return <Button size="sm" variant="outline" onClick={() => navigate(`/app/shipments/${s.id}`)}>التفاصيل</Button>;
            }
        },
    ];
    return (<div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>شحناتي</h2>
        <Button onClick={() => navigate('/app/shipments/new')}>إنشاء شحنة جديدة</Button>
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
                    marginLeft: 8,
                    padding: '2px 8px',
                    backgroundColor: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : 'var(--color-background)',
                    borderRadius: 12,
                    fontSize: 12
                }}>
                  {shipments.filter(s => s.status === tab.id).length}
                </span>)}
            </button>))}
        </div>

        {isLoading ? (<div>جاري التحميل...</div>) : (<DataTable data={filteredShipments} columns={columns} keyExtractor={(s) => s.id} emptyMessage="لا توجد شحنات حالياً"/>)}
      </Card>
    </div>);
};
