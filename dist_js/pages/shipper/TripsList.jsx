import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriceBlock } from '../../components/common/PriceBlock';
import { tripService } from '../../services/api';
export const TripsList = () => {
    const navigate = useNavigate();
    const [trips, setTrips] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        tripService.getTrips().then(data => {
            setTrips(data);
            setIsLoading(false);
        });
    }, []);
    const columns = [
        { key: 'id', header: 'رقم الرحلة', render: (t) => <strong>{t.id}</strong> },
        { key: 'shipment', header: 'رقم الشحنة', render: (t) => t.shipmentId },
        { key: 'route', header: 'المسار', render: (t) => t.route },
        { key: 'carrier', header: 'الناقل', render: (t) => t.carrierName },
        { key: 'price', header: 'السعر النهائي', render: (t) => <PriceBlock amount={t.finalPrice}/> },
        { key: 'status', header: 'حالة الرحلة', render: (t) => <StatusBadge status={t.currentStage}/> },
        {
            key: 'actions',
            header: 'الإجراء',
            render: (t) => (<Button size="sm" variant="outline" onClick={() => navigate(`/app/trips/${t.id}/track`)}>
          متابعة الرحلة
        </Button>)
        },
    ];
    return (<div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>الرحلات الجارية والمنفذة</h2>
      </div>

      <Card>
        {isLoading ? (<div>جاري التحميل...</div>) : (<DataTable data={trips} columns={columns} keyExtractor={(t) => t.id} emptyMessage="لا توجد رحلات حالياً"/>)}
      </Card>
    </div>);
};
