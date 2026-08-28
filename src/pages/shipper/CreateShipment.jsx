import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { shipmentService, authService } from '../../services/api';
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
    const [formData, setFormData] = useState({
        pickupCity: '',
        pickupLocation: '',
        deliveryCity: '',
        deliveryLocation: '',
        pickupDirections: '',
        pickupContact: '',
        deliveryDirections: '',
        deliveryContact: '',
        cargoType: '',
        customCargoType: '',
        weight: '',
        volume: '',
        description: '',
        requiredTruckType: '',
        customTruckType: '',
        loadingDate: '',
        loadingTime: '',
        proposedPrice: ''
    });
    const [errors, setErrors] = useState({});

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
            if (!formData.pickupLocation) newErrors.pickupLocation = 'هذا الحقل مطلوب';
            if (!formData.deliveryCity) newErrors.deliveryCity = 'هذا الحقل مطلوب';
            if (!formData.deliveryLocation) newErrors.deliveryLocation = 'هذا الحقل مطلوب';
        } else if (step === 1) {
            if (!formData.cargoType) newErrors.cargoType = 'يرجى اختيار نوع البضاعة';
            if (formData.cargoType === 'أخرى' && !formData.customCargoType) newErrors.customCargoType = 'هذا الحقل مطلوب';
            if (!formData.weight || Number(formData.weight) <= 0) newErrors.weight = 'يجب إدخال وزن صحيح أكبر من 0';
            if (!formData.volume || Number(formData.volume) <= 0) newErrors.volume = 'يجب إدخال حجم صحيح أكبر من 0';
        } else if (step === 2) {
            if (!formData.requiredTruckType) newErrors.requiredTruckType = 'يرجى اختيار نوع الشاحنة';
            if (formData.requiredTruckType === 'أخرى' && !formData.customTruckType) newErrors.customTruckType = 'هذا الحقل مطلوب';
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
        setIsLoading(true);
        try {
            const finalCargoType = formData.cargoType === 'أخرى' ? formData.customCargoType : formData.cargoType;
            const finalTruckType = formData.requiredTruckType === 'أخرى' ? formData.customTruckType : formData.requiredTruckType;
            const currentUser = await authService.getCurrentUser();

            await shipmentService.createShipment({
                ...formData,
                cargoType: finalCargoType,
                requiredTruckType: finalTruckType,
                weight: Number(formData.weight),
                volume: Number(formData.volume),
                proposedPrice: Number(formData.proposedPrice),
                shipperId: currentUser?.id ?? 'user-shipper-1'
            });
            navigate(`/app/shipments`);
        }
        catch (err) {
            console.error(err);
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

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <Card>
          {currentStep === 0 && (<div>
              <h3 style={{ marginBottom: 16 }}>مواقع التحميل والتسليم</h3>
              <Input name="pickupCity" label="مدينة التحميل" value={formData.pickupCity} onChange={handleChange}/>
              <ErrorMsg error={errors.pickupCity} />
              <Input name="pickupLocation" label="تفاصيل موقع التحميل" value={formData.pickupLocation} onChange={handleChange}/>
              <ErrorMsg error={errors.pickupLocation} />
              
              <div style={{ margin: '24px 0', borderTop: '1px solid var(--color-border)' }}></div>
              
              <Input name="deliveryCity" label="مدينة التسليم" value={formData.deliveryCity} onChange={handleChange}/>
              <ErrorMsg error={errors.deliveryCity} />
              <Input name="deliveryLocation" label="تفاصيل موقع التسليم" value={formData.deliveryLocation} onChange={handleChange}/>
              <ErrorMsg error={errors.deliveryLocation} />

              <div style={{ margin: '24px 0', borderTop: '1px solid var(--color-border)' }}></div>
              <p className="text-helper" style={{ marginBottom: 8 }}>
                بيانات إضافية (اختياري) — لا تظهر إلا للناقل بعد إسناد الشحنة إليه فقط.
              </p>
              <Input name="pickupDirections" label="إرشادات الوصول لموقع التحميل" value={formData.pickupDirections} onChange={handleChange}/>
              <Input name="pickupContact" label="جوال المسؤول في موقع التحميل" value={formData.pickupContact} onChange={handleChange}/>
              <Input name="deliveryDirections" label="إرشادات الوصول لموقع التسليم" value={formData.deliveryDirections} onChange={handleChange}/>
              <Input name="deliveryContact" label="جوال المسؤول في موقع التسليم" value={formData.deliveryContact} onChange={handleChange}/>
            </div>)}

          {currentStep === 1 && (<div>
              <h3 style={{ marginBottom: 16 }}>تفاصيل البضاعة</h3>
              <Select name="cargoType" label="نوع البضاعة" value={formData.cargoType} onChange={handleChange} options={[
                { value: '', label: 'اختر نوع البضاعة' },
                { value: 'مواد غذائية', label: 'مواد غذائية' },
                { value: 'أجهزة كهربائية', label: 'أجهزة كهربائية' },
                { value: 'مواد بناء', label: 'مواد بناء' },
                { value: 'بضائع عامة', label: 'بضائع عامة' },
                { value: 'أخرى', label: 'أخرى' }
              ]}/>
              <ErrorMsg error={errors.cargoType} />
              {formData.cargoType === 'أخرى' && (
                  <>
                  <Input name="customCargoType" label="اكتب نوع البضاعة" value={formData.customCargoType} onChange={handleChange}/>
                  <ErrorMsg error={errors.customCargoType} />
                  </>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <Input name="weight" type="number" label="الوزن (طن)" value={formData.weight} onChange={handleChange}/>
                  <ErrorMsg error={errors.weight} />
                </div>
                <div>
                  <Input name="volume" type="number" label="الحجم (متر مكعب)" value={formData.volume} onChange={handleChange}/>
                  <ErrorMsg error={errors.volume} />
                </div>
              </div>
              <Input name="description" label="وصف إضافي (اختياري)" value={formData.description} onChange={handleChange}/>
            </div>)}

          {currentStep === 2 && (<div>
              <h3 style={{ marginBottom: 16 }}>الشاحنة المطلوبة</h3>
              <Select name="requiredTruckType" label="نوع الشاحنة" value={formData.requiredTruckType} onChange={handleChange} options={[
                { value: '', label: 'اختر نوع الشاحنة' },
                { value: 'دينا', label: 'دينا (حتى 4 طن)' },
                { value: 'دينا مغلقة', label: 'دينا مغلقة' },
                { value: 'شاحنة نقل ثقيل (تريلا)', label: 'شاحنة نقل ثقيل (تريلا)' },
                { value: 'تريلا جوانب', label: 'تريلا جوانب' },
                { value: 'أخرى', label: 'أخرى' }
              ]}/>
              <ErrorMsg error={errors.requiredTruckType} />
              {formData.requiredTruckType === 'أخرى' && (
                  <>
                  <Input name="customTruckType" label="اكتب نوع الشاحنة" value={formData.customTruckType} onChange={handleChange}/>
                  <ErrorMsg error={errors.customTruckType} />
                  </>
              )}
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div><strong>المسار:</strong> {formData.pickupCity} إلى {formData.deliveryCity}</div>
                <div><strong>البضاعة:</strong> {formData.cargoType === 'أخرى' ? formData.customCargoType : formData.cargoType} ({formData.weight} طن)</div>
                <div><strong>الشاحنة:</strong> {formData.requiredTruckType === 'أخرى' ? formData.customTruckType : formData.requiredTruckType}</div>
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
                <span>{formData.requiredTruckType || '-'}</span>
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
