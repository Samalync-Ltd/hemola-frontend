import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { shipmentService, catalogService } from '../../services/api';
import { MapPickerModal } from '../../components/map/MapPickerModal';
import { TRUCK_TYPE_OPTIONS, TruckTypeAr } from '../../constants/enums';
import { isValidSaudiPhone } from '../../utils/validators';
import { toArabicError } from '../../utils/errors';
const DEFAULT_CARGO_NAMES = ['مواد غذائية', 'أجهزة كهربائية', 'مواد بناء', 'بضائع عامة'];
const steps = [
    'المواقع',
    'البضاعة',
    'نوع الشاحنة',
    'الجدولة',
    'السعر',
    'المراجعة'
];
export const CreateShipment = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [publishError, setPublishError] = useState('');
    const [formData, setFormData] = useState({
        pickupCity: '',
        deliveryCity: '',
        pickupNotes: '',
        deliveryNotes: '',
        onSiteContact: '',
        pickupLat: null,
        pickupLng: null,
        deliveryLat: null,
        deliveryLng: null,
        cargoType: '',
        customCargoType: '',
        weight: '',
        description: '',
        requiredTruckType: '',
        loadingDate: '',
        loadingTime: '',
        proposedPrice: ''
    });
    const [errors, setErrors] = useState({});
    const [pickerOpen, setPickerOpen] = useState(null); // 'pickup' | 'delivery' | null
    // Admin-managed lists (config/cargoTypes, config/truckTypes); the
    // built-in defaults apply until the admin saves their own.
    const [cargoOptions, setCargoOptions] = useState(DEFAULT_CARGO_NAMES);
    const [truckLabels, setTruckLabels] = useState(TruckTypeAr);
    const [truckOptions, setTruckOptions] = useState(TRUCK_TYPE_OPTIONS);

    useEffect(() => {
        catalogService.getCargoTypes()
            .then(items => { if (items) setCargoOptions(items.map(i => i.name)); })
            .catch(() => { /* keep defaults */ });
        catalogService.getTruckTypeOverrides()
            .then(overrides => {
                setTruckLabels(Object.fromEntries(TRUCK_TYPE_OPTIONS.map(t => [t, overrides[t]?.label || TruckTypeAr[t]])));
                setTruckOptions(TRUCK_TYPE_OPTIONS.filter(t => overrides[t]?.active !== false));
            })
            .catch(() => { /* keep defaults */ });
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        // Clear error for this field
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: null });
        }
    };

    const validateStep = (step) => {
        const newErrors = {};
        if (step === 0) {
            if (!formData.pickupCity) newErrors.pickupCity = 'هذا الحقل مطلوب';
            if (!formData.deliveryCity) newErrors.deliveryCity = 'هذا الحقل مطلوب';
            // The backend requires precise coordinates for both ends
            // (siteDetails.pickupCoords/deliveryCoords) — the map pin is
            // not optional here, unlike the old mock-only flow.
            if (formData.pickupLat == null) newErrors.pickupPin = 'يرجى تحديد موقع التحميل على الخريطة';
            if (formData.deliveryLat == null) newErrors.deliveryPin = 'يرجى تحديد موقع التسليم على الخريطة';
            if (!formData.onSiteContact) newErrors.onSiteContact = 'هذا الحقل مطلوب';
            else if (!isValidSaudiPhone(formData.onSiteContact)) newErrors.onSiteContact = 'صيغة رقم الجوال غير صحيحة (05XXXXXXXX)';
        } else if (step === 1) {
            if (!formData.cargoType) newErrors.cargoType = 'يرجى اختيار نوع البضاعة';
            if (formData.cargoType === 'أخرى' && !formData.customCargoType) newErrors.customCargoType = 'هذا الحقل مطلوب';
            if (!formData.weight || Number(formData.weight) <= 0) newErrors.weight = 'يجب إدخال وزن صحيح أكبر من 0';
        } else if (step === 2) {
            if (!formData.requiredTruckType) newErrors.requiredTruckType = 'يرجى اختيار نوع الشاحنة';
        } else if (step === 3) {
            if (!formData.loadingDate) newErrors.loadingDate = 'هذا الحقل مطلوب';
            if (!formData.loadingTime) newErrors.loadingTime = 'هذا الحقل مطلوب';
        } else if (step === 4) {
            if (!formData.proposedPrice || Number(formData.proposedPrice) <= 0) newErrors.proposedPrice = 'يجب إدخال سعر صحيح أكبر من 0';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(s => Math.min(s + 1, steps.length - 1));
        }
    };

    const prevStep = () => setCurrentStep(s => Math.max(s - 1, 0));

    const handlePublish = async () => {
        if (!validateStep(4)) return; // Final sanity check
        setPublishError('');
        setIsLoading(true);
        try {
            const finalCargoType = formData.cargoType === 'أخرى' ? formData.customCargoType : formData.cargoType;
            // loadingDate + loadingTime are collected separately in the UI but
            // sent as one ISO-8601 timestamp, as the backend expects.
            const loadingDateTime = new Date(`${formData.loadingDate}T${formData.loadingTime}`).toISOString();

            await shipmentService.createShipment({
                pickupCity: formData.pickupCity,
                deliveryCity: formData.deliveryCity,
                pickupLat: formData.pickupLat,
                pickupLng: formData.pickupLng,
                deliveryLat: formData.deliveryLat,
                deliveryLng: formData.deliveryLng,
                onSiteContact: formData.onSiteContact,
                pickupNotes: formData.pickupNotes,
                deliveryNotes: formData.deliveryNotes,
                cargoType: finalCargoType,
                weight: Number(formData.weight),
                description: formData.description,
                requiredTruckType: formData.requiredTruckType,
                loadingDate: loadingDateTime,
                proposedPrice: Number(formData.proposedPrice),
            });
            navigate(`/app/shipments`);
        }
        catch (err) {
            console.error(err);
            setPublishError(toArabicError(err, 'حدث خطأ أثناء نشر الشحنة'));
        }
        finally {
            setIsLoading(false);
        }
    };

    const ErrorMsg = ({ error }) => error ? <div style={{ color: 'var(--color-error)', fontSize: 12, marginTop: -8, marginBottom: 8 }}>{error}</div> : null;

    return (<div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>إنشاء شحنة جديدة</h2>
        <Button variant="outline" onClick={() => navigate('/app/shipments')}>إلغاء</Button>
      </div>

      {/* Stepper */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 12, left: 0, right: 0, height: 2, backgroundColor: 'var(--color-border)', zIndex: 0 }}></div>
        {steps.map((label, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            return (<div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, gap: 8 }}>
              <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    backgroundColor: isActive ? 'var(--color-accent)' : isCompleted ? 'var(--color-primary)' : 'var(--color-surface)',
                    border: `2px solid ${isActive || isCompleted ? 'transparent' : 'var(--color-border)'}`,
                    color: isActive || isCompleted ? 'white' : 'var(--color-text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold'
                }}>
                {isCompleted ? '✓' : index + 1}
              </div>
              <span style={{ fontSize: 12, fontWeight: isActive ? 'bold' : 'normal', color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                {label}
              </span>
            </div>);
        })}
      </div>

      <div className="responsive-two-col">
        <Card>
          {currentStep === 0 && (<div>
              <h3 style={{ marginBottom: 16 }}>مواقع التحميل والتسليم</h3>
              <Input name="pickupCity" label="مدينة التحميل" value={formData.pickupCity} onChange={handleChange}/>
              <ErrorMsg error={errors.pickupCity} />
              <Button
                type="button"
                variant="outline"
                size="sm"
                style={{ marginBottom: 16 }}
                onClick={() => setPickerOpen('pickup')}
              >
                {formData.pickupLat ? '📍 تم تحديد الموقع على الخريطة — تعديل' : '📍 تحديد موقع التحميل على الخريطة'}
              </Button>
              <ErrorMsg error={errors.pickupPin} />

              <div style={{ margin: '24px 0', borderTop: '1px solid var(--color-border)' }}></div>

              <Input name="deliveryCity" label="مدينة التسليم" value={formData.deliveryCity} onChange={handleChange}/>
              <ErrorMsg error={errors.deliveryCity} />
              <Button
                type="button"
                variant="outline"
                size="sm"
                style={{ marginBottom: 16 }}
                onClick={() => setPickerOpen('delivery')}
              >
                {formData.deliveryLat ? '📍 تم تحديد الموقع على الخريطة — تعديل' : '📍 تحديد موقع التسليم على الخريطة'}
              </Button>
              <ErrorMsg error={errors.deliveryPin} />

              <div style={{ margin: '24px 0', borderTop: '1px solid var(--color-border)' }}></div>
              <p className="text-helper" style={{ marginBottom: 8 }}>
                بيانات إضافية — لا تظهر إلا للناقل بعد إسناد الشحنة إليه فقط.
              </p>
              <Input name="onSiteContact" label="جوال المسؤول في الموقع" value={formData.onSiteContact} onChange={handleChange} dir="ltr" style={{ textAlign: 'right' }} />
              <ErrorMsg error={errors.onSiteContact} />
              <Input name="pickupNotes" label="ملاحظات موقع التحميل (اختياري)" value={formData.pickupNotes} onChange={handleChange}/>
              <Input name="deliveryNotes" label="ملاحظات موقع التسليم (اختياري)" value={formData.deliveryNotes} onChange={handleChange}/>

              <MapPickerModal
                isOpen={pickerOpen === 'pickup'}
                onClose={() => setPickerOpen(null)}
                title="تحديد موقع التحميل"
                cityName={formData.pickupCity}
                initialPoint={formData.pickupLat ? [formData.pickupLat, formData.pickupLng] : null}
                onConfirm={([lat, lng], city) => {
                  setFormData(f => ({ ...f, pickupLat: lat, pickupLng: lng, pickupCity: city || f.pickupCity }));
                  setErrors(e => ({ ...e, pickupPin: null, ...(city ? { pickupCity: null } : {}) }));
                }}
              />
              <MapPickerModal
                isOpen={pickerOpen === 'delivery'}
                onClose={() => setPickerOpen(null)}
                title="تحديد موقع التسليم"
                cityName={formData.deliveryCity}
                initialPoint={formData.deliveryLat ? [formData.deliveryLat, formData.deliveryLng] : null}
                onConfirm={([lat, lng], city) => {
                  setFormData(f => ({ ...f, deliveryLat: lat, deliveryLng: lng, deliveryCity: city || f.deliveryCity }));
                  setErrors(e => ({ ...e, deliveryPin: null, ...(city ? { deliveryCity: null } : {}) }));
                }}
              />
            </div>)}

          {currentStep === 1 && (<div>
              <h3 style={{ marginBottom: 16 }}>تفاصيل البضاعة</h3>
              <Select name="cargoType" label="نوع البضاعة" value={formData.cargoType} onChange={handleChange} options={[
                { value: '', label: 'اختر نوع البضاعة' },
                ...cargoOptions.map(name => ({ value: name, label: name })),
                { value: 'أخرى', label: 'أخرى' }
              ]}/>
              <ErrorMsg error={errors.cargoType} />
              {formData.cargoType === 'أخرى' && (
                  <>
                  <Input name="customCargoType" label="اكتب نوع البضاعة" value={formData.customCargoType} onChange={handleChange}/>
                  <ErrorMsg error={errors.customCargoType} />
                  </>
              )}
              <Input name="weight" type="number" label="الوزن (طن)" value={formData.weight} onChange={handleChange}/>
              <ErrorMsg error={errors.weight} />
              <Input name="description" label="وصف إضافي (اختياري)" value={formData.description} onChange={handleChange}/>
            </div>)}

          {currentStep === 2 && (<div>
              <h3 style={{ marginBottom: 16 }}>الشاحنة المطلوبة</h3>
              <Select name="requiredTruckType" label="نوع الشاحنة" value={formData.requiredTruckType} onChange={handleChange} options={[
                { value: '', label: 'اختر نوع الشاحنة' },
                ...truckOptions.map(t => ({ value: t, label: truckLabels[t] || t })),
              ]}/>
              <ErrorMsg error={errors.requiredTruckType} />
            </div>)}

          {currentStep === 3 && (<div>
              <h3 style={{ marginBottom: 16 }}>جدولة الشحنة</h3>
              <Input name="loadingDate" type="date" label="تاريخ التحميل" value={formData.loadingDate} onChange={handleChange}/>
              <ErrorMsg error={errors.loadingDate} />
              <Input name="loadingTime" type="time" label="وقت التحميل" value={formData.loadingTime} onChange={handleChange}/>
              <ErrorMsg error={errors.loadingTime} />
            </div>)}

          {currentStep === 4 && (<div>
              <h3 style={{ marginBottom: 16 }}>التسعير</h3>
              <Input name="proposedPrice" type="number" label="السعر المقترح (ر.س)" value={formData.proposedPrice} onChange={handleChange}/>
              <ErrorMsg error={errors.proposedPrice} />
              <p className="text-helper" style={{ marginTop: 8 }}>
                هذا هو السعر الذي سيظهر للناقلين كعرض مبدئي. يمكن للناقلين قبوله أو تقديم عروض مضادة.
              </p>
            </div>)}

          {currentStep === 5 && (<div>
              <h3 style={{ marginBottom: 16 }}>مراجعة الشحنة</h3>
              {publishError && (
                  <div style={{ padding: 12, marginBottom: 16, borderRadius: 8, backgroundColor: 'rgba(229,62,62,0.08)', color: 'var(--color-error)', fontSize: 13 }}>
                      {publishError}
                  </div>
              )}
              <div className="responsive-two-col-even">
                <div><strong>المسار:</strong> {formData.pickupCity} إلى {formData.deliveryCity}</div>
                <div><strong>البضاعة:</strong> {formData.cargoType === 'أخرى' ? formData.customCargoType : formData.cargoType} ({formData.weight} طن)</div>
                <div><strong>الشاحنة:</strong> {truckLabels[formData.requiredTruckType] || formData.requiredTruckType}</div>
                <div><strong>الجدولة:</strong> {formData.loadingDate} - {formData.loadingTime}</div>
                <div><strong>السعر المقترح:</strong> {formData.proposedPrice} ر.س</div>
              </div>
              <div style={{ marginTop: 24, padding: 16, backgroundColor: 'rgba(15, 36, 64, 0.05)', borderRadius: 8 }}>
                <p style={{ margin: 0, fontWeight: 'bold' }}>ماذا يحدث بعد النشر؟</p>
                <ul style={{ margin: '8px 0 0', paddingLeft: 0, paddingRight: 20, fontSize: 14 }}>
                  <li>ستظهر الشحنة للناقلين المطابقين لنوع الشاحنة.</li>
                  <li>يمكنك استقبال عروض أسعار والتفاوض مع الناقلين بشكل خاص.</li>
                  <li>لن يتم خصم أي مبالغ حتى يتم الاتفاق النهائي.</li>
                </ul>
              </div>
            </div>)}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
            <Button variant="outline" onClick={prevStep} disabled={currentStep === 0}>السابق</Button>
            {currentStep < steps.length - 1 ? (<Button onClick={nextStep}>التالي</Button>) : (<Button onClick={handlePublish} isLoading={isLoading}>نشر الشحنة</Button>)}
          </div>
        </Card>

        <div>
          <Card>
            <h4 style={{ margin: '0 0 16px' }}>ملخص الشحنة</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-helper">التحميل</span>
                <span>{formData.pickupCity || '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-helper">التسليم</span>
                <span>{formData.deliveryCity || '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-helper">البضاعة</span>
                <span>{formData.cargoType || '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-helper">الشاحنة</span>
                <span>{truckLabels[formData.requiredTruckType] || formData.requiredTruckType || '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-helper">السعر</span>
                <strong>{formData.proposedPrice ? `${formData.proposedPrice} ر.س` : '-'}</strong>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>);
};
