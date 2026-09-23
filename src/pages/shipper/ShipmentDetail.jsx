import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriceBlock } from '../../components/common/PriceBlock';
import { shipmentService } from '../../services/api';
import { ShipmentStatus, TruckTypeAr } from '../../constants/enums';
export const ShipmentDetail = () => {
    const { shipmentId } = useParams();
    const navigate = useNavigate();
    const [shipment, setShipment] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isCancelling, setIsCancelling] = useState(false);
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

    // Free before assignment — no trip/reservation exists yet, so there's
    // nothing to charge. Once a carrier is assigned, cancellation moves to
    // the trip-track screen where commission rules apply.
    const canCancelFree = shipment.status !== ShipmentStatus.ACTIVE && shipment.status !== ShipmentStatus.COMPLETED && shipment.status !== ShipmentStatus.CANCELLED;

    const handleCancel = async () => {
        if (!window.confirm('هل تريد إلغاء هذه الشحنة؟ لم يتم إسنادها لناقل بعد، فلن يتم خصم أي مبلغ.')) return;
        setIsCancelling(true);
        try {
            const updated = await shipmentService.cancelShipment(shipment.id);
            setShipment(updated);
        } catch (err) {
            alert(err.message);
        } finally {
            setIsCancelling(false);
        }
    };

    return (<div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, marginBottom: 8 }}>تفاصيل الشحنة {shipment.id}</h2>
          <StatusBadge status={shipment.status}/>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="outline" onClick={() => navigate('/app/shipments')}>عودة للقائمة</Button>
          {shipment.offerCount > 0 && (<Button onClick={() => navigate(`/app/shipments/${shipment.id}/offers`)}>فتح التفاوض / العروض</Button>)}
          {canCancelFree && (
            <Button variant="danger" onClick={handleCancel} isLoading={isCancelling}>إلغاء الشحنة</Button>
          )}
        </div>
      </div>

      <div className="responsive-two-col">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Card>
            <h3 style={{ marginBottom: 16 }}>تفاصيل المسار والبضاعة</h3>
            <div className="responsive-two-col-even">
              <div>
                <div className="text-helper">مدينة التحميل</div>
                <div style={{ fontWeight: 700 }}>{shipment.pickupCity}</div>
              </div>
              <div>
                <div className="text-helper">مدينة التسليم</div>
                <div style={{ fontWeight: 700 }}>{shipment.deliveryCity}</div>
              </div>
              <div>
                <div className="text-helper">نوع البضاعة</div>
                <div style={{ fontWeight: 700 }}>{shipment.cargoType}</div>
              </div>
              <div>
                <div className="text-helper">الوزن</div>
                <div style={{ fontWeight: 700 }}>{shipment.weight} طن</div>
              </div>
              <div>
                <div className="text-helper">نوع الشاحنة المطلوبة</div>
                <div style={{ fontWeight: 700 }}>{TruckTypeAr[shipment.requiredTruckType] || shipment.requiredTruckType}</div>
              </div>
              <div>
                <div className="text-helper">تاريخ ووقت التحميل</div>
                <div style={{ fontWeight: 700 }}>{shipment.loadingDate ? new Date(shipment.loadingDate).toLocaleString('ar-SA') : '—'}</div>
              </div>
            </div>
            {shipment.description && (<div style={{ marginTop: 16 }}>
                <div className="text-helper">ملاحظات إضافية</div>
                <div>{shipment.description}</div>
              </div>)}
          </Card>

          <Card>
            <h3 style={{ marginBottom: 16 }}>بيانات الموقع (تظهر للناقل بعد الإسناد فقط)</h3>
            <p className="text-helper" style={{ fontSize: 12, marginBottom: 12 }}>
              لا يمكن تعديل بيانات الموقع بعد نشر الشحنة.
            </p>
            <div className="responsive-two-col-even">
              <div>
                <div className="text-helper">جوال المسؤول في الموقع</div>
                <div dir="ltr">{shipment.onSiteContact || '—'}</div>
              </div>
              <div>
                <div className="text-helper">ملاحظات موقع التحميل</div>
                <div>{shipment.pickupNotes || '—'}</div>
              </div>
              <div>
                <div className="text-helper">ملاحظات موقع التسليم</div>
                <div>{shipment.deliveryNotes || '—'}</div>
              </div>
            </div>
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
                <span className="text-helper">{shipment.createdAt ? new Date(shipment.createdAt).toLocaleString('ar-SA') : '—'}</span>
                <strong>تم نشر الشحنة</strong>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>);
};
