import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { shipmentService } from '../../services/api';
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
        cargoType: '',
        weight: '',
        volume: '',
        description: '',
        requiredTruckType: '',
        loadingDate: '',
        loadingTime: '',
        proposedPrice: ''
    });
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    const nextStep = () => setCurrentStep(s => Math.min(s + 1, steps.length - 1));
    const prevStep = () => setCurrentStep(s => Math.max(s - 1, 0));
    const handlePublish = async () => {
        setIsLoading(true);
        try {
            const newShipment = await shipmentService.createShipment({
                ...formData,
                weight: Number(formData.weight),
                volume: Number(formData.volume),
                proposedPrice: Number(formData.proposedPrice),
                shipperId: 'user-shipper-1' // mock
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
              <Input name="pickupLocation" label="تفاصيل موقع التحميل" value={formData.pickupLocation} onChange={handleChange}/>
              <div style={{ margin: '24px 0', borderTop: '1px solid var(--color-border)' }}></div>
              <Input name="deliveryCity" label="مدينة التسليم" value={formData.deliveryCity} onChange={handleChange}/>
              <Input name="deliveryLocation" label="تفاصيل موقع التسليم" value={formData.deliveryLocation} onChange={handleChange}/>
            </div>)}

          {currentStep === 1 && (<div>
              <h3 style={{ marginBottom: 16 }}>تفاصيل البضاعة</h3>
              <Select name="cargoType" label="نوع البضاعة" value={formData.cargoType} onChange={handleChange} options={[
                { value: '', label: 'اختر نوع البضاعة' },
                { value: 'مواد غذائية', label: 'مواد غذائية' },
                { value: 'أجهزة كهربائية', label: 'أجهزة كهربائية' },
                { value: 'مواد بناء', label: 'مواد بناء' },
                { value: 'بضائع عامة', label: 'بضائع عامة' }
            ]}/>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Input name="weight" type="number" label="الوزن (طن)" value={formData.weight} onChange={handleChange}/>
                <Input name="volume" type="number" label="الحجم (متر مكعب)" value={formData.volume} onChange={handleChange}/>
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
                { value: 'تريلا جوانب', label: 'تريلا جوانب' }
            ]}/>
            </div>)}

          {currentStep === 3 && (<div>
              <h3 style={{ marginBottom: 16 }}>جدولة الشحنة</h3>
              <Input name="loadingDate" type="date" label="تاريخ التحميل" value={formData.loadingDate} onChange={handleChange}/>
              <Input name="loadingTime" type="time" label="وقت التحميل" value={formData.loadingTime} onChange={handleChange}/>
            </div>)}

          {currentStep === 4 && (<div>
              <h3 style={{ marginBottom: 16 }}>التسعير</h3>
              <Input name="proposedPrice" type="number" label="السعر المقترح (ر.س)" value={formData.proposedPrice} onChange={handleChange}/>
              <p className="text-helper" style={{ marginTop: 8 }}>
                هذا هو السعر الذي سيظهر للناقلين كعرض مبدئي. يمكن للناقلين قبوله أو تقديم عروض مضادة.
              </p>
            </div>)}

          {currentStep === 5 && (<div>
              <h3 style={{ marginBottom: 16 }}>مراجعة الشحنة</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div><strong>المسار:</strong> {formData.pickupCity} إلى {formData.deliveryCity}</div>
                <div><strong>البضاعة:</strong> {formData.cargoType} ({formData.weight} طن)</div>
                <div><strong>الشاحنة:</strong> {formData.requiredTruckType}</div>
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
