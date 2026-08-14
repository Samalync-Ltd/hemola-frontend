import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriceBlock } from '../../components/common/PriceBlock';
import { shipmentService } from '../../services/api';
export const ShipmentDetail = () => {
    const { shipmentId } = useParams();
    const navigate = useNavigate();
    const [shipment, setShipment] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    useEffect(() => {
        if (shipmentId) {
            shipmentService.getShipmentById(shipmentId)
                .then(setShipment)
                .catch(err => setError(err.message))
                .finally(() => setIsLoading(false));
        }
    }, [shipmentId]);
    if (isLoading)
        return <div>جاري التحميل...</div>;
    if (error || !shipment)
        return <div>{error || 'الشحنة غير موجودة'}</div>;
    return (<div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, marginBottom: 8 }}>تفاصيل الشحنة {shipment.id}</h2>
          <StatusBadge status={shipment.status}/>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="outline" onClick={() => navigate('/app/shipments')}>عودة للقائمة</Button>
          {shipment.offerCount > 0 && (<Button onClick={() => navigate(`/app/shipments/${shipment.id}/offers`)}>فتح التفاوض / العروض</Button>)}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Card>
            <h3 style={{ marginBottom: 16 }}>تفاصيل المسار والبضاعة</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div className="text-helper">موقع التحميل</div>
                <div style={{ fontWeight: 700 }}>{shipment.pickupCity} - {shipment.pickupLocation}</div>
              </div>
              <div>
                <div className="text-helper">موقع التسليم</div>
                <div style={{ fontWeight: 700 }}>{shipment.deliveryCity} - {shipment.deliveryLocation}</div>
              </div>
              <div>
                <div className="text-helper">نوع البضاعة</div>
                <div style={{ fontWeight: 700 }}>{shipment.cargoType}</div>
              </div>
              <div>
                <div className="text-helper">الوزن / الحجم</div>
                <div style={{ fontWeight: 700 }}>{shipment.weight} طن / {shipment.volume} م³</div>
              </div>
              <div>
                <div className="text-helper">نوع الشاحنة المطلوبة</div>
                <div style={{ fontWeight: 700 }}>{shipment.requiredTruckType}</div>
              </div>
              <div>
                <div className="text-helper">تاريخ ووقت التحميل</div>
                <div style={{ fontWeight: 700 }}>{shipment.loadingDate} - {shipment.loadingTime}</div>
              </div>
            </div>
            {shipment.description && (<div style={{ marginTop: 16 }}>
                <div className="text-helper">ملاحظات إضافية</div>
                <div>{shipment.description}</div>
              </div>)}
          </Card>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Card>
            <h3 style={{ marginBottom: 16 }}>ملخص السعر</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <PriceBlock label="السعر المقترح من قبلك" amount={shipment.proposedPrice} size="lg"/>
              {shipment.finalPrice && (<div style={{ paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
                  <PriceBlock label="السعر النهائي المتفق عليه" amount={shipment.finalPrice} size="lg"/>
                </div>)}
            </div>
          </Card>

          <Card>
            <h3 style={{ marginBottom: 16 }}>سجل النشاط</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span className="text-helper">{new Date(shipment.createdAt).toLocaleString('ar-SA')}</span>
                <strong>تم نشر الشحنة</strong>
              </div>
              {/* Demo activity log */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span className="text-helper">تحديث تلقائي</span>
                <strong>بانتظار عروض الناقلين</strong>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>);
};
