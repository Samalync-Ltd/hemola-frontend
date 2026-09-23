import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './Auth.module.css';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { isValidSaudiPhone, normalizeSaudiPhone } from '../../utils/validators';
import { markFreshAccount } from '../../utils/freshAccount';
import { authService, USE_FIREBASE_AUTH } from '../../services/api';
import { DOCUMENT_KEYS } from '../../constants/documentKeys';
import { TRUCK_TYPE_OPTIONS, TruckTypeAr } from '../../constants/enums';

export const Register = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    
    // Form state
    const [role, setRole] = useState('');
    const [accountType, setAccountType] = useState('');
    
    // Step 3
    const [formData, setFormData] = useState({
        companyName: '',
        name: '',
        phone: '',
        email: '',
        password: ''
    });
    
    // Step 4/5 files (mock just keeping track of if they have a value)
    const [files, setFiles] = useState({});
    
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const handleTextChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleFileChange = (e) => setFiles({ ...files, [e.target.name]: e.target.files[0] });

    const validateStep = () => {
        const newErrors = {};
        let isValid = true;

        if (step === 1) {
            if (!role) { newErrors.role = 'يرجى اختيار نوع الحساب'; isValid = false; }
        } else if (step === 2) {
            if (!accountType) { newErrors.accountType = 'يرجى اختيار نوع صاحب الحساب'; isValid = false; }
        } else if (step === 3) {
            if (accountType === 'COMPANY') {
                if (!formData.companyName.trim()) { newErrors.companyName = 'يرجى إدخال اسم الشركة'; isValid = false; }
                if (!formData.name.trim()) { newErrors.name = 'هذا الحقل مطلوب'; isValid = false; }
            } else {
                if (!formData.name.trim()) { newErrors.name = 'هذا الحقل مطلوب'; isValid = false; }
            }
            
            if (!formData.phone.trim()) { newErrors.phone = 'هذا الحقل مطلوب'; isValid = false; }
            else if (!isValidSaudiPhone(formData.phone)) { newErrors.phone = 'صيغة رقم الجوال غير صحيحة (05XXXXXXXX أو +9665XXXXXXXX)'; isValid = false; }
            
            if (!formData.email.trim()) { newErrors.email = 'هذا الحقل مطلوب'; isValid = false; }
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { newErrors.email = 'يرجى إدخال بريد إلكتروني صحيح'; isValid = false; }
            
            if (!formData.password.trim()) { newErrors.password = 'هذا الحقل مطلوب'; isValid = false; }
        } else if (step === 4) {
            if (role === 'SHIPPER') {
                if (accountType === 'INDIVIDUAL' && !files[DOCUMENT_KEYS.NATIONAL_ID]) { newErrors[DOCUMENT_KEYS.NATIONAL_ID] = 'هذا الحقل مطلوب'; isValid = false; }
                if (accountType === 'COMPANY') {
                    if (!files[DOCUMENT_KEYS.COMMERCIAL_REGISTRATION]) { newErrors[DOCUMENT_KEYS.COMMERCIAL_REGISTRATION] = 'هذا الحقل مطلوب'; isValid = false; }
                    if (!files[DOCUMENT_KEYS.MANAGER_ID]) { newErrors[DOCUMENT_KEYS.MANAGER_ID] = 'هذا الحقل مطلوب'; isValid = false; }
                }
            } else if (role === 'CARRIER') {
                if (accountType === 'INDIVIDUAL') {
                    if (!files[DOCUMENT_KEYS.NATIONAL_ID]) { newErrors[DOCUMENT_KEYS.NATIONAL_ID] = 'هذا الحقل مطلوب'; isValid = false; }
                    if (!files[DOCUMENT_KEYS.PUBLIC_DRIVING_LICENCE]) { newErrors[DOCUMENT_KEYS.PUBLIC_DRIVING_LICENCE] = 'هذا الحقل مطلوب'; isValid = false; }
                }
                if (accountType === 'COMPANY') {
                    if (!files[DOCUMENT_KEYS.COMMERCIAL_REGISTRATION]) { newErrors[DOCUMENT_KEYS.COMMERCIAL_REGISTRATION] = 'هذا الحقل مطلوب'; isValid = false; }
                    if (!files[DOCUMENT_KEYS.MANAGER_ID]) { newErrors[DOCUMENT_KEYS.MANAGER_ID] = 'هذا الحقل مطلوب'; isValid = false; }
                }
            }
        } else if (step === 5 && role === 'CARRIER') {
            if (!formData.brand?.trim()) { newErrors.brand = 'هذا الحقل مطلوب'; isValid = false; }
            if (!formData.model?.trim()) { newErrors.model = 'هذا الحقل مطلوب'; isValid = false; }
            if (!formData.truckType?.trim()) { newErrors.truckType = 'يرجى اختيار نوع الشاحنة'; isValid = false; }
            if (formData.truckType === 'OTHER' && !formData.customType?.trim()) { newErrors.customType = 'يرجى تحديد نوع الشاحنة'; isValid = false; }
            if (!formData.capacityTons || Number(formData.capacityTons) <= 0) { newErrors.capacityTons = 'يرجى إدخال حمولة صحيحة'; isValid = false; }
            if (!formData.plateNumber?.trim()) { newErrors.plateNumber = 'هذا الحقل مطلوب'; isValid = false; }
            if (!files.operatingCard) { newErrors.operatingCard = 'هذا الحقل مطلوب'; isValid = false; }
            if (!files.registration) { newErrors.registration = 'هذا الحقل مطلوب'; isValid = false; }
        }

        setErrors(newErrors);

        // Normalize to E.164 as soon as the field passes validation, so
        // whatever consumes formData.phone downstream (submission, review
        // screen, etc.) always sees the stored format regardless of which
        // accepted form the user typed.
        if (step === 3 && isValid) {
            const normalized = normalizeSaudiPhone(formData.phone);
            if (normalized !== formData.phone) setFormData(f => ({ ...f, phone: normalized }));
        }

        return isValid;
    };

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => { setErrors({}); setStep(s => s - 1); };

    const handleRegister = async () => {
        setIsLoading(true);
        try {
            const payload = {
                role, accountType, files, ...formData,
                ...(role === 'CARRIER' ? {
                    trucks: [{
                        brand: formData.brand,
                        model: formData.model,
                        type: formData.truckType,
                        ...(formData.truckType === 'OTHER' ? { customType: formData.customType } : {}),
                        capacityTons: formData.capacityTons,
                        plateNumber: formData.plateNumber,
                        operatingCardFile: files.operatingCard,
                        registrationFile: files.registration,
                    }],
                } : {}),
            };
            await authService.registerNewUser(payload);
            markFreshAccount();
            setIsLoading(false);
            setStep(role === 'CARRIER' ? 6 : 5); // Review step
        } catch (err) {
            setIsLoading(false);
            alert('حدث خطأ أثناء التسجيل: ' + err.message);
        }
    };

    const onSubmit = (e) => {
        e.preventDefault();
        if (!validateStep()) return;

        if ((role === 'SHIPPER' && step === 4) || (role === 'CARRIER' && step === 5)) {
            handleRegister();
        } else {
            nextStep(); 
        }
    };

    const simulateAdminApproval = () => {
        // A client-side transition, not a hard reload: mockUsers/mockShipments
        // etc. are plain in-memory module state (see src/mocks/data.js) with
        // no persistence layer under them — a full page load (window.location)
        // would re-execute those modules from scratch and silently discard
        // the user record just created above.
        navigate('/app');
    };

    // Real backend: the admin approves from the dashboard; the user signs in
    // again afterwards (Login routes on accountStatus).
    const returnToLogin = async () => {
        await authService.logout();
        navigate('/login');
    };

    return (<div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logoArea} style={{ marginBottom: 24 }}>
          <img src="/logos/2.png" alt="حمولة" style={{ height: 80, objectFit: 'contain' }} />
        </div>

        <div style={{ marginBottom: 24, fontSize: 14, color: 'var(--color-text-muted)', display: 'flex', justifyContent: 'center', gap: 8 }}>
          {Array.from({ length: role === 'CARRIER' ? 6 : 5 }, (_, i) => i + 1).map(s => (<div key={s} style={{
                width: 24, height: 24, borderRadius: '50%',
                backgroundColor: step === s ? 'var(--color-accent)' : step > s ? 'var(--color-success)' : 'var(--color-border)',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12
            }}>
              {s}
            </div>))}
        </div>

        <form className={styles.form} onSubmit={onSubmit} noValidate>
          
          {step === 1 && (<>
              <h2 style={{ textAlign: 'center', marginBottom: 24 }}>أنت تستخدم حمولة بصفتك؟</h2>
              <div className={styles.tabs} style={{ flexDirection: 'column', gap: 8, backgroundColor: 'transparent' }}>
                <button type="button" className={`${styles.tab} ${role === 'SHIPPER' ? styles.tabActive : ''}`} onClick={() => { setRole('SHIPPER'); setErrors({}); }} style={{ padding: 16, border: '1px solid var(--color-border)' }}>
                  صاحب شحنة
                </button>
                <button type="button" className={`${styles.tab} ${role === 'CARRIER' ? styles.tabActive : ''}`} onClick={() => { setRole('CARRIER'); setErrors({}); }} style={{ padding: 16, border: '1px solid var(--color-border)' }}>
                  صاحب شاحنة / ناقل
                </button>
              </div>
              {errors.role && <span style={{ color: 'var(--color-error)', fontSize: 13 }}>{errors.role}</span>}
            </>)}

          {step === 2 && (<>
              <h2 style={{ textAlign: 'center', marginBottom: 24 }}>{role === 'SHIPPER' ? 'نوع صاحب الشحنة' : 'نوع الناقل'}</h2>
              <div className={styles.tabs} style={{ flexDirection: 'column', gap: 8, backgroundColor: 'transparent' }}>
                <button type="button" className={`${styles.tab} ${accountType === 'INDIVIDUAL' ? styles.tabActive : ''}`} onClick={() => { setAccountType('INDIVIDUAL'); setErrors({}); }} style={{ padding: 16, border: '1px solid var(--color-border)' }}>
                  فرد
                </button>
                <button type="button" className={`${styles.tab} ${accountType === 'COMPANY' ? styles.tabActive : ''}`} onClick={() => { setAccountType('COMPANY'); setErrors({}); }} style={{ padding: 16, border: '1px solid var(--color-border)' }}>
                  شركة / منشأة
                </button>
              </div>
              {errors.accountType && <span style={{ color: 'var(--color-error)', fontSize: 13 }}>{errors.accountType}</span>}
            </>)}

          {step === 3 && (<>
              <h2 style={{ textAlign: 'center', marginBottom: 24 }}>البيانات الأساسية</h2>
              {accountType === 'COMPANY' && (
                  <Input name="companyName" label="اسم الشركة / المنشأة" value={formData.companyName} onChange={handleTextChange} error={errors.companyName} />
              )}
              <Input name="name" label={accountType === 'COMPANY' ? "اسم المسؤول" : "الاسم"} value={formData.name} onChange={handleTextChange} error={errors.name} />
              <Input name="phone" label="رقم الجوال" type="tel" value={formData.phone} onChange={handleTextChange} error={errors.phone} />
              <Input name="email" label="البريد الإلكتروني" type="email" value={formData.email} onChange={handleTextChange} error={errors.email} />
              <Input name="password" label="كلمة المرور" type="password" value={formData.password} onChange={handleTextChange} error={errors.password} />
            </>)}

          {step === 4 && role === 'SHIPPER' && (<>
              <h2 style={{ textAlign: 'center', marginBottom: 24 }}>المستندات</h2>
              {accountType === 'INDIVIDUAL' ? (
                  <Input name={DOCUMENT_KEYS.NATIONAL_ID} type="file" label="الهوية الوطنية / الإقامة" onChange={handleFileChange} error={errors[DOCUMENT_KEYS.NATIONAL_ID]} />
              ) : (<>
                  <Input name={DOCUMENT_KEYS.COMMERCIAL_REGISTRATION} type="file" label="السجل التجاري" onChange={handleFileChange} error={errors[DOCUMENT_KEYS.COMMERCIAL_REGISTRATION]} />
                  <Input name={DOCUMENT_KEYS.MANAGER_ID} type="file" label="هوية المسؤول" onChange={handleFileChange} error={errors[DOCUMENT_KEYS.MANAGER_ID]} />
                </>)}
            </>)}

          {step === 4 && role === 'CARRIER' && (<>
              <h2 style={{ textAlign: 'center', marginBottom: 24 }}>المستندات الأساسية</h2>
              {accountType === 'INDIVIDUAL' ? (<>
                  <Input name={DOCUMENT_KEYS.NATIONAL_ID} type="file" label="الهوية الوطنية / الإقامة" onChange={handleFileChange} error={errors[DOCUMENT_KEYS.NATIONAL_ID]} />
                  <Input name={DOCUMENT_KEYS.PUBLIC_DRIVING_LICENCE} type="file" label="رخصة قيادة عمومي" onChange={handleFileChange} error={errors[DOCUMENT_KEYS.PUBLIC_DRIVING_LICENCE]} />
              </>) : (<>
                  <Input name={DOCUMENT_KEYS.COMMERCIAL_REGISTRATION} type="file" label="السجل التجاري" onChange={handleFileChange} error={errors[DOCUMENT_KEYS.COMMERCIAL_REGISTRATION]} />
                  <Input name={DOCUMENT_KEYS.MANAGER_ID} type="file" label="هوية المسؤول" onChange={handleFileChange} error={errors[DOCUMENT_KEYS.MANAGER_ID]} />
                </>)}
            </>)}

          {step === 5 && role === 'CARRIER' && (<>
              <h2 style={{ textAlign: 'center', marginBottom: 24 }}>بيانات الشاحنة</h2>
              <Input name="brand" label="الشركة المصنّعة" value={formData.brand || ''} onChange={handleTextChange} error={errors.brand} />
              <Input name="model" label="الطراز" value={formData.model || ''} onChange={handleTextChange} error={errors.model} />
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>نوع الشاحنة</label>
                <select
                    name="truckType"
                    value={formData.truckType || ''}
                    onChange={handleTextChange}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)' }}
                >
                    <option value="" disabled>اختر نوع الشاحنة</option>
                    {TRUCK_TYPE_OPTIONS.map(t => <option key={t} value={t}>{TruckTypeAr[t] || t}</option>)}
                </select>
                {errors.truckType && <span style={{ color: 'var(--color-error)', fontSize: 13 }}>{errors.truckType}</span>}
              </div>
              {formData.truckType === 'OTHER' && (
                  <Input name="customType" label="حدد نوع الشاحنة" value={formData.customType || ''} onChange={handleTextChange} error={errors.customType} />
              )}
              <Input name="capacityTons" type="number" min="0" label="الحمولة القصوى (طن)" value={formData.capacityTons || ''} onChange={handleTextChange} error={errors.capacityTons} />
              <Input name="plateNumber" label="رقم اللوحة" value={formData.plateNumber || ''} onChange={handleTextChange} error={errors.plateNumber} />
              <Input name="operatingCard" type="file" label="بطاقة تشغيل مركبة" onChange={handleFileChange} error={errors.operatingCard} />
              <Input name="registration" type="file" label="الاستمارة (رخصة السير)" onChange={handleFileChange} error={errors.registration} />
            </>)}

          {( (step === 5 && role === 'SHIPPER') || (step === 6 && role === 'CARRIER') ) && (<div style={{ textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, backgroundColor: 'rgba(255, 122, 41, 0.1)', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 32 }}>⏳</span>
              </div>
              <h2 style={{ marginBottom: 16 }}>حسابك قيد المراجعة</h2>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: 32 }}>
                بانتظار موافقة الإدارة لتفعيل الحساب.
              </p>
              
              {USE_FIREBASE_AUTH ? (
                <Button type="button" onClick={returnToLogin} variant="outline" style={{ width: '100%' }}>
                  العودة لتسجيل الدخول
                </Button>
              ) : (
              <div style={{ padding: 16, backgroundColor: '#f0f9ff', borderRadius: 8, border: '1px dashed #3b82f6' }}>
                <p style={{ fontSize: 13, marginBottom: 8 }}>لأغراض العرض التوضيحي (Demo):</p>
                <Button type="button" onClick={simulateAdminApproval} variant="outline" style={{ width: '100%' }}>
                  محاكاة موافقة الإدارة والدخول
                </Button>
              </div>
              )}
            </div>)}

          <div style={{ display: 'flex', gap: 16, marginTop: 32 }}>
            {step > 1 && !( (step === 5 && role === 'SHIPPER') || (step === 6 && role === 'CARRIER') ) && (<Button type="button" variant="outline" onClick={prevStep} style={{ flex: 1 }}>
                السابق
              </Button>)}
            {((role === 'SHIPPER' && step < 4) || (role === 'CARRIER' && step < 5)) && (<Button type="submit" style={{ flex: 2 }}>
                التالي
              </Button>)}
            {((role === 'SHIPPER' && step === 4) || (role === 'CARRIER' && step === 5)) && (<Button type="submit" style={{ flex: 2 }} isLoading={isLoading}>
                إرسال الطلب
              </Button>)}
          </div>
          
          {step === 1 && (<div className={styles.registerLink} style={{ textAlign: 'center' }}>
              لديك حساب؟
              <Link to="/login">تسجيل الدخول</Link>
            </div>)}
        </form>
      </div>
    </div>);
};
