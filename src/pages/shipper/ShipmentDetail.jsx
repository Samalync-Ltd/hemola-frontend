import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriceBlock } from '../../components/common/PriceBlock';
import { Input } from '../../components/common/Input';
import { shipmentService } from '../../services/api';
import { ShipmentStatus } from '../../constants/enums';
export const ShipmentDetail = () => {
    const { shipmentId } = useParams();
    const navigate = useNavigate();
    const [shipment, setShipment] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isCancelling, setIsCancelling] = useState(false);
    const [isEditingSite, setIsEditingSite] = useState(false);
    const [isSavingSite, setIsSavingSite] = useState(false);
    const [siteForm, setSiteForm] = useState({ pickupDirections: '', pickupContact: '', deliveryDirections: '', deliveryContact: '' });
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

    const openSiteEdit = () => {
        setSiteForm({
            pickupDirections: shipment.pickupDirections || '',
            pickupContact: shipment.pickupContact || '',
            deliveryDirections: shipment.deliveryDirections || '',
            deliveryContact: shipment.deliveryContact || '',
        });
        setIsEditingSite(true);
    };

    const handleSaveSiteDetails = async () => {
        setIsSavingSite(true);
        try {
            const updated = await shipmentService.updateSiteDetails(shipment.id, siteForm);
            setShipment(updated);
            setIsEditingSite(false);
        } catch (err) {
            alert(err.message);
        } finally {
            setIsSavingSite(false);
        }
    };

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

          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>بيانات الموقع (تظهر للناقل بعد الإسناد فقط)</h3>
              {canCancelFree && !isEditingSite && (
                <Button variant="outline" size="sm" onClick={openSiteEdit}>تعديل</Button>
              )}
            </div>
            {!canCancelFree && (
              <p className="text-helper" style={{ fontSize: 12, marginBottom: 12 }}>
                تم إسناد الشحنة لناقل — لم يعد بالإمكان تعديل بيانات الموقع.
              </p>
            )}
            {isEditingSite ? (
              <div>
                <Input label="إرشادات الوصول لموقع التحميل" value={siteForm.pickupDirections} onChange={e => setSiteForm(f => ({ ...f, pickupDirections: e.target.value }))}/>
                <Input label="جوال المسؤول في موقع التحميل" value={siteForm.pickupContact} onChange={e => setSiteForm(f => ({ ...f, pickupContact: e.target.value }))}/>
                <Input label="إرشادات الوصول لموقع التسليم" value={siteForm.deliveryDirections} onChange={e => setSiteForm(f => ({ ...f, deliveryDirections: e.target.value }))}/>
                <Input label="جوال المسؤول في موقع التسليم" value={siteForm.deliveryContact} onChange={e => setSiteForm(f => ({ ...f, deliveryContact: e.target.value }))}/>
                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                    <Button size="sm" onClick={handleSaveSiteDetails} isLoading={isSavingSite}>حفظ</Button>
                    <Button size="sm" variant="outline" onClick={() => setIsEditingSite(false)}>إلغاء</Button>
                </div>
              </div>
            ) : (
              <div className="responsive-two-col-even">
                <div>
                  <div className="text-helper">إرشادات موقع التحميل</div>
                  <div>{shipment.pickupDirections || '—'}</div>
                </div>
                <div>
                  <div className="text-helper">جوال المسؤول (تحميل)</div>
                  <div dir="ltr">{shipment.pickupContact || '—'}</div>
                </div>
                <div>
                  <div className="text-helper">إرشادات موقع التسليم</div>
                  <div>{shipment.deliveryDirections || '—'}</div>
                </div>
                <div>
                  <div className="text-helper">جوال المسؤول (تسليم)</div>
                  <div dir="ltr">{shipment.deliveryContact || '—'}</div>
                </div>
              </div>
            )}
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
