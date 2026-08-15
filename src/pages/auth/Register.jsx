import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './Auth.module.css';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
export const Register = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [role, setRole] = useState('SHIPPER');
    const [accountType, setAccountType] = useState('COMPANY');
    const [isLoading, setIsLoading] = useState(false);
    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);
    const handleRegister = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate API delay
        setTimeout(() => {
            setIsLoading(false);
            setStep(role === 'CARRIER' ? 6 : 5); // Review step
        }, 1000);
    };
    const simulateAdminApproval = () => {
        navigate('/app');
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

        <form className={styles.form} onSubmit={(e) => { 
            e.preventDefault(); 
            if ((role === 'SHIPPER' && step === 4) || (role === 'CARRIER' && step === 5)) {
                handleRegister(e);
            } else {
                nextStep(); 
            }
        }}>
          
          {step === 1 && (<>
              <h2 style={{ textAlign: 'center', marginBottom: 24 }}>أنت تستخدم حمولة بصفتك؟</h2>
              <div className={styles.tabs} style={{ flexDirection: 'column', gap: 8, backgroundColor: 'transparent' }}>
                <button type="button" className={`${styles.tab} ${role === 'SHIPPER' ? styles.tabActive : ''}`} onClick={() => setRole('SHIPPER')} style={{ padding: 16, border: '1px solid var(--color-border)' }}>
                  صاحب شحنة
                </button>
                <button type="button" className={`${styles.tab} ${role === 'CARRIER' ? styles.tabActive : ''}`} onClick={() => setRole('CARRIER')} style={{ padding: 16, border: '1px solid var(--color-border)' }}>
                  صاحب شاحنة / ناقل
                </button>
              </div>
            </>)}

          {step === 2 && (<>
              <h2 style={{ textAlign: 'center', marginBottom: 24 }}>{role === 'SHIPPER' ? 'نوع صاحب الشحنة' : 'نوع الناقل'}</h2>
              <div className={styles.tabs} style={{ flexDirection: 'column', gap: 8, backgroundColor: 'transparent' }}>
                <button type="button" className={`${styles.tab} ${accountType === 'INDIVIDUAL' ? styles.tabActive : ''}`} onClick={() => setAccountType('INDIVIDUAL')} style={{ padding: 16, border: '1px solid var(--color-border)' }}>
                  فرد
                </button>
                <button type="button" className={`${styles.tab} ${accountType === 'COMPANY' ? styles.tabActive : ''}`} onClick={() => setAccountType('COMPANY')} style={{ padding: 16, border: '1px solid var(--color-border)' }}>
                  شركة / منشأة
                </button>
              </div>
            </>)}

          {step === 3 && (<>
              <h2 style={{ textAlign: 'center', marginBottom: 24 }}>البيانات الأساسية</h2>
              {accountType === 'COMPANY' && (<Input label="اسم الشركة / المنشأة" required/>)}
              <Input label={accountType === 'COMPANY' ? "اسم المسؤول" : "الاسم"} required/>
              <Input label="رقم الجوال" type="tel" required/>
              <Input label="البريد الإلكتروني" type="email" required/>
              <Input label="كلمة المرور" type="password" required/>
            </>)}

          {step === 4 && role === 'SHIPPER' && (<>
              <h2 style={{ textAlign: 'center', marginBottom: 24 }}>المستندات</h2>
              {accountType === 'INDIVIDUAL' ? (<Input type="file" label="الهوية" required/>) : (<>
                  <Input type="file" label="السجل التجاري / مستندات المنشأة" required/>
                  <Input type="file" label="بيانات المسؤول" required/>
                </>)}
            </>)}

          {step === 4 && role === 'CARRIER' && (<>
              <h2 style={{ textAlign: 'center', marginBottom: 24 }}>المستندات الأساسية</h2>
              {accountType === 'INDIVIDUAL' ? (<Input type="file" label="الهوية الوطنية / الإقامة" required/>) : (<>
                  <Input type="file" label="السجل التجاري" required/>
                  <Input type="file" label="هوية المسؤول" required/>
                  <Input type="file" label="ترخيص هيئة النقل" required/>
                </>)}
              <Input type="file" label="رخصة القيادة للمندوب" required/>
            </>)}

          {step === 5 && role === 'CARRIER' && (<>
              <h2 style={{ textAlign: 'center', marginBottom: 24 }}>بيانات الشاحنة</h2>
              <Input label="نوع الشاحنة (تريلا، دينا...)" required/>
              <Input label="رقم اللوحة" required/>
              <Input type="file" label="الاستمارة (رخصة السير)" required/>
              <Input type="file" label="وثيقة التأمين" required/>
            </>)}

          {( (step === 5 && role === 'SHIPPER') || (step === 6 && role === 'CARRIER') ) && (<div style={{ textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, backgroundColor: 'rgba(255, 122, 41, 0.1)', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 32 }}>⏳</span>
              </div>
              <h2 style={{ marginBottom: 16 }}>حسابك قيد المراجعة</h2>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: 32 }}>
                بانتظار موافقة الإدارة لتفعيل الحساب.
              </p>
              
              <div style={{ padding: 16, backgroundColor: '#f0f9ff', borderRadius: 8, border: '1px dashed #3b82f6' }}>
                <p style={{ fontSize: 13, marginBottom: 8 }}>لأغراض العرض التوضيحي (Demo):</p>
                <Button type="button" onClick={simulateAdminApproval} variant="outline" style={{ width: '100%' }}>
                  محاكاة موافقة الإدارة والدخول
                </Button>
              </div>
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
