import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { DataTable } from '../../components/common/DataTable';
import { PriceBlock } from '../../components/common/PriceBlock';
import { shipmentService } from '../../services/api';
import { ShipmentStatus } from '../../constants/enums';

export const CarrierShipments = () => {
    const navigate = useNavigate();
    const [shipments, setShipments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        shipmentService.getShipments().then(data => {
            // Carriers can only browse shipments that are looking for offers
            const available = data.filter(s => 
                s.status === ShipmentStatus.OFFERS_PENDING || 
                s.status === ShipmentStatus.NEGOTIATING
            );
            setShipments(available);
            setIsLoading(false);
        });
    }, []);

    const columns = [
        { key: 'route', header: 'المسار', render: (s) => `${s.pickupCity} -> ${s.deliveryCity}` },
        { key: 'cargo', header: 'البضاعة', render: (s) => s.cargoType },
        { key: 'weight', header: 'الوزن', render: (s) => `${s.weight} طن` },
        { key: 'date', header: 'تاريخ التحميل', render: (s) => s.loadingDate },
        { key: 'price', header: 'السعر المقترح', render: (s) => <PriceBlock amount={s.proposedPrice}/> },
        {
            key: 'actions',
            header: 'الإجراء',
            render: (s) => (
                <Button size="sm" onClick={() => navigate(`/app/shipments/${s.id}`)}>
                    تقديم عرض
                </Button>
            )
        },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0 }}>تصفح الشحنات المتاحة</h2>
            </div>

            <Card>
                {isLoading ? (
                    <div>جاري التحميل...</div>
                ) : (
                    <DataTable 
                        data={shipments} 
                        columns={columns} 
                        keyExtractor={(s) => s.id} 
                        emptyMessage="لا توجد شحنات متاحة حالياً المطابقة لنوع مركبتك"
                    />
                )}
            </Card>
        </div>
    );
};
