import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './Auth.module.css';
import { Input } from '../../components/common/Input';
import { FileInput } from '../../components/common/FileInput';
import { Button } from '../../components/common/Button';
import { isValidSaudiPhone, normalizeSaudiPhone } from '../../utils/validators';
import { authService } from '../../services/api';
import { toUserMessage } from '../../utils/errors';
import { DOCUMENT_KEYS } from '../../constants/documentKeys';
import { TRUCK_TYPE_OPTIONS } from '../../constants/enums';
import { useT, usePageTitle } from '../../i18n';
import { truckTypeName } from '../../i18n/catalog';
import { LanguageSwitch } from '../../components/common/LanguageSwitch';

export const Register = () => {
    const navigate = useNavigate();
    const { t, lang } = useT();
    usePageTitle('auth.register.pageTitle');
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
    
    // Step 4/5 files, keyed by document type — uploaded on submit
    const [files, setFiles] = useState({});
    
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const handleTextChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleFileChange = (name, file) => {
        setFiles(f => ({ ...f, [name]: file }));
        setErrors(e => ({ ...e, [name]: null }));
    };

    const validateStep = () => {
        const newErrors = {};
        let isValid = true;

        if (step === 1) {
            if (!role) { newErrors.role = t('auth.register.chooseRole'); isValid = false; }
        } else if (step === 2) {
            if (!accountType) { newErrors.accountType = t('auth.register.chooseAccountType'); isValid = false; }
        } else if (step === 3) {
            if (accountType === 'COMPANY') {
                if (!formData.companyName.trim()) { newErrors.companyName = t('auth.register.enterCompanyName'); isValid = false; }
                if (!formData.name.trim()) { newErrors.name = t('common.required'); isValid = false; }
            } else {
                if (!formData.name.trim()) { newErrors.name = t('common.required'); isValid = false; }
            }
            
            if (!formData.phone.trim()) { newErrors.phone = t('common.required'); isValid = false; }
            else if (!isValidSaudiPhone(formData.phone)) { newErrors.phone = t('auth.register.phoneFormat'); isValid = false; }
            
            if (!formData.email.trim()) { newErrors.email = t('common.required'); isValid = false; }
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { newErrors.email = t('auth.invalidEmail'); isValid = false; }
            
            if (!formData.password.trim()) { newErrors.password = t('common.required'); isValid = false; }
        } else if (step === 4) {
            if (role === 'SHIPPER') {
                if (accountType === 'INDIVIDUAL' && !files[DOCUMENT_KEYS.NATIONAL_ID]) { newErrors[DOCUMENT_KEYS.NATIONAL_ID] = t('common.required'); isValid = false; }
                if (accountType === 'COMPANY') {
                    if (!files[DOCUMENT_KEYS.COMMERCIAL_REGISTRATION]) { newErrors[DOCUMENT_KEYS.COMMERCIAL_REGISTRATION] = t('common.required'); isValid = false; }
                    if (!files[DOCUMENT_KEYS.MANAGER_ID]) { newErrors[DOCUMENT_KEYS.MANAGER_ID] = t('common.required'); isValid = false; }
                }
            } else if (role === 'CARRIER') {
                if (accountType === 'INDIVIDUAL') {
                    if (!files[DOCUMENT_KEYS.NATIONAL_ID]) { newErrors[DOCUMENT_KEYS.NATIONAL_ID] = t('common.required'); isValid = false; }
                    if (!files[DOCUMENT_KEYS.PUBLIC_DRIVING_LICENCE]) { newErrors[DOCUMENT_KEYS.PUBLIC_DRIVING_LICENCE] = t('common.required'); isValid = false; }
                }
                if (accountType === 'COMPANY') {
                    if (!files[DOCUMENT_KEYS.COMMERCIAL_REGISTRATION]) { newErrors[DOCUMENT_KEYS.COMMERCIAL_REGISTRATION] = t('common.required'); isValid = false; }
                    if (!files[DOCUMENT_KEYS.MANAGER_ID]) { newErrors[DOCUMENT_KEYS.MANAGER_ID] = t('common.required'); isValid = false; }
                }
            }
        } else if (step === 5 && role === 'CARRIER') {
            if (!formData.brand?.trim()) { newErrors.brand = t('common.required'); isValid = false; }
            if (!formData.model?.trim()) { newErrors.model = t('common.required'); isValid = false; }
            if (!formData.truckType?.trim()) { newErrors.truckType = t('auth.register.chooseTruckType'); isValid = false; }
            if (formData.truckType === 'OTHER' && !formData.customType?.trim()) { newErrors.customType = t('auth.register.specifyTruckType'); isValid = false; }
            if (!formData.capacityTons || Number(formData.capacityTons) <= 0) { newErrors.capacityTons = t('auth.register.validCapacity'); isValid = false; }
            if (!formData.plateNumber?.trim()) { newErrors.plateNumber = t('common.required'); isValid = false; }
            if (!files.operatingCard) { newErrors.operatingCard = t('common.required'); isValid = false; }
            if (!files.registration) { newErrors.registration = t('common.required'); isValid = false; }
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
                role, accountType, ...formData,
                // Account-level documents only — the truck's two papers
                // belong to the truck record below, not to users/{uid}/documents.
                files: Object.fromEntries(Object.values(DOCUMENT_KEYS).filter(k => files[k]).map(k => [k, files[k]])),
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
            setIsLoading(false);
            setStep(role === 'CARRIER' ? 6 : 5); // Review step
        } catch (err) {
            setIsLoading(false);
            setErrors({ form: toUserMessage(err, t('auth.register.failed')) });
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

    // The admin approves from the dashboard; the user signs in
    // again afterwards (Login routes on accountStatus).
    const returnToLogin = async () => {
        await authService.logout();
        navigate('/login');
    };

    return (<div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.langRow}><LanguageSwitch /></div>
        <div className={styles.logoArea} style={{ marginBottom: 24 }}>
          <img src="/logos/2.png" alt={t('brand.name')} style={{ height: 80, objectFit: 'contain' }} />
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
              <h2 style={{ textAlign: 'center', marginBottom: 24 }}>{t('auth.register.roleQuestion')}</h2>
              <div className={styles.tabs} style={{ flexDirection: 'column', gap: 8, backgroundColor: 'transparent' }}>
                <button type="button" className={`${styles.tab} ${role === 'SHIPPER' ? styles.tabActive : ''}`} onClick={() => { setRole('SHIPPER'); setErrors({}); }} style={{ padding: 16, border: '1px solid var(--color-border)' }}>
                  {t('auth.roleShipper')}
                </button>
                <button type="button" className={`${styles.tab} ${role === 'CARRIER' ? styles.tabActive : ''}`} onClick={() => { setRole('CARRIER'); setErrors({}); }} style={{ padding: 16, border: '1px solid var(--color-border)' }}>
                  {t('auth.register.roleCarrier')}
                </button>
              </div>
              {errors.role && <span style={{ color: 'var(--color-error)', fontSize: 13 }}>{errors.role}</span>}
            </>)}

          {step === 2 && (<>
              <h2 style={{ textAlign: 'center', marginBottom: 24 }}>{role === 'SHIPPER' ? t('auth.register.shipperType') : t('auth.register.carrierType')}</h2>
              <div className={styles.tabs} style={{ flexDirection: 'column', gap: 8, backgroundColor: 'transparent' }}>
                <button type="button" className={`${styles.tab} ${accountType === 'INDIVIDUAL' ? styles.tabActive : ''}`} onClick={() => { setAccountType('INDIVIDUAL'); setErrors({}); }} style={{ padding: 16, border: '1px solid var(--color-border)' }}>
                  {t('enums.accountType.INDIVIDUAL')}
                </button>
                <button type="button" className={`${styles.tab} ${accountType === 'COMPANY' ? styles.tabActive : ''}`} onClick={() => { setAccountType('COMPANY'); setErrors({}); }} style={{ padding: 16, border: '1px solid var(--color-border)' }}>
                  {t('enums.accountType.COMPANY')}
                </button>
              </div>
              {errors.accountType && <span style={{ color: 'var(--color-error)', fontSize: 13 }}>{errors.accountType}</span>}
            </>)}

          {step === 3 && (<>
              <h2 style={{ textAlign: 'center', marginBottom: 24 }}>{t('auth.register.basicInfo')}</h2>
              {accountType === 'COMPANY' && (
                  <Input name="companyName" label={t('auth.register.companyName')} value={formData.companyName} onChange={handleTextChange} error={errors.companyName} />
              )}
              <Input name="name" label={accountType === 'COMPANY' ? t('auth.register.contactName') : t('auth.register.name')} value={formData.name} onChange={handleTextChange} error={errors.name} />
              <Input name="phone" label={t('auth.mobile')} numeric="phone" value={formData.phone} onChange={handleTextChange} error={errors.phone} />
              <Input name="email" label={t('auth.email')} type="email" value={formData.email} onChange={handleTextChange} error={errors.email} />
              <Input name="password" label={t('auth.password')} type="password" value={formData.password} onChange={handleTextChange} error={errors.password} />
            </>)}

          {step === 4 && role === 'SHIPPER' && (<>
              <h2 style={{ textAlign: 'center', marginBottom: 24 }}>{t('auth.register.documents')}</h2>
              {accountType === 'INDIVIDUAL' ? (
                  <FileInput name={DOCUMENT_KEYS.NATIONAL_ID} label={t('auth.register.nationalId')} file={files[DOCUMENT_KEYS.NATIONAL_ID]} onChange={handleFileChange} error={errors[DOCUMENT_KEYS.NATIONAL_ID]} />
              ) : (<>
                  <FileInput name={DOCUMENT_KEYS.COMMERCIAL_REGISTRATION} label={t('auth.register.commercialRegistration')} file={files[DOCUMENT_KEYS.COMMERCIAL_REGISTRATION]} onChange={handleFileChange} error={errors[DOCUMENT_KEYS.COMMERCIAL_REGISTRATION]} />
                  <FileInput name={DOCUMENT_KEYS.MANAGER_ID} label={t('auth.register.managerId')} file={files[DOCUMENT_KEYS.MANAGER_ID]} onChange={handleFileChange} error={errors[DOCUMENT_KEYS.MANAGER_ID]} />
                </>)}
            </>)}

          {step === 4 && role === 'CARRIER' && (<>
              <h2 style={{ textAlign: 'center', marginBottom: 24 }}>{t('auth.register.basicDocuments')}</h2>
              {accountType === 'INDIVIDUAL' ? (<>
                  <FileInput name={DOCUMENT_KEYS.NATIONAL_ID} label={t('auth.register.nationalId')} file={files[DOCUMENT_KEYS.NATIONAL_ID]} onChange={handleFileChange} error={errors[DOCUMENT_KEYS.NATIONAL_ID]} />
                  <FileInput name={DOCUMENT_KEYS.PUBLIC_DRIVING_LICENCE} label={t('auth.register.drivingLicence')} file={files[DOCUMENT_KEYS.PUBLIC_DRIVING_LICENCE]} onChange={handleFileChange} error={errors[DOCUMENT_KEYS.PUBLIC_DRIVING_LICENCE]} />
              </>) : (<>
                  <FileInput name={DOCUMENT_KEYS.COMMERCIAL_REGISTRATION} label={t('auth.register.commercialRegistration')} file={files[DOCUMENT_KEYS.COMMERCIAL_REGISTRATION]} onChange={handleFileChange} error={errors[DOCUMENT_KEYS.COMMERCIAL_REGISTRATION]} />
                  <FileInput name={DOCUMENT_KEYS.MANAGER_ID} label={t('auth.register.managerId')} file={files[DOCUMENT_KEYS.MANAGER_ID]} onChange={handleFileChange} error={errors[DOCUMENT_KEYS.MANAGER_ID]} />
                </>)}
            </>)}

          {step === 5 && role === 'CARRIER' && (<>
              <h2 style={{ textAlign: 'center', marginBottom: 24 }}>{t('auth.register.truckDetails')}</h2>
              <Input name="brand" label={t('account.truck.brand')} value={formData.brand || ''} onChange={handleTextChange} error={errors.brand} />
              <Input name="model" label={t('account.truck.model')} value={formData.model || ''} onChange={handleTextChange} error={errors.model} />
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>{t('account.truck.type')}</label>
                <select
                    name="truckType"
                    value={formData.truckType || ''}
                    onChange={handleTextChange}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)' }}
                >
                    <option value="" disabled>{t('account.truck.chooseType')}</option>
                    {TRUCK_TYPE_OPTIONS.map(code => <option key={code} value={code}>{truckTypeName(code, null, lang)}</option>)}
                </select>
                {errors.truckType && <span style={{ color: 'var(--color-error)', fontSize: 13 }}>{errors.truckType}</span>}
              </div>
              {formData.truckType === 'OTHER' && (
                  <Input name="customType" label={t('account.truck.customType')} value={formData.customType || ''} onChange={handleTextChange} error={errors.customType} />
              )}
              <Input name="capacityTons" numeric="decimal" label={t('account.truck.capacity')} value={formData.capacityTons || ''} onChange={handleTextChange} error={errors.capacityTons} />
              <Input name="plateNumber" label={t('account.truck.plate')} value={formData.plateNumber || ''} onChange={handleTextChange} error={errors.plateNumber} />
              <FileInput name="operatingCard" label={t('account.truck.operatingCard')} file={files.operatingCard} onChange={handleFileChange} error={errors.operatingCard} />
              <FileInput name="registration" label={t('account.truck.registration')} file={files.registration} onChange={handleFileChange} error={errors.registration} />
            </>)}

          {( (step === 5 && role === 'SHIPPER') || (step === 6 && role === 'CARRIER') ) && (<div style={{ textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, backgroundColor: 'rgba(255, 122, 41, 0.1)', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 32 }}>⏳</span>
              </div>
              <h2 style={{ marginBottom: 16 }}>{t('layout.underReviewTitle')}</h2>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: 32 }}>
                {t('layout.underReviewText')}
              </p>
              <p className="text-helper" style={{ marginTop: -16, marginBottom: 32 }}>
                {t('auth.register.verificationBefore')}<strong dir="ltr">{formData.email}</strong>{t('auth.register.verificationAfter')}
              </p>
              
              <Button type="button" onClick={returnToLogin} variant="outline" style={{ width: '100%' }}>
                {t('auth.backToSignIn')}
              </Button>
            </div>)}

          {errors.form && (
            <div role="alert" style={{ marginTop: 24, padding: '12px 16px', borderRadius: 8, color: 'var(--color-error)', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid var(--color-error)' }}>
              {errors.form}
            </div>
          )}

          <div style={{ display: 'flex', gap: 16, marginTop: 32 }}>
            {step > 1 && !( (step === 5 && role === 'SHIPPER') || (step === 6 && role === 'CARRIER') ) && (<Button type="button" variant="outline" onClick={prevStep} style={{ flex: 1 }}>
                {t('auth.register.previous')}
              </Button>)}
            {((role === 'SHIPPER' && step < 4) || (role === 'CARRIER' && step < 5)) && (<Button type="submit" style={{ flex: 2 }}>
                {t('auth.register.next')}
              </Button>)}
            {((role === 'SHIPPER' && step === 4) || (role === 'CARRIER' && step === 5)) && (<Button type="submit" style={{ flex: 2 }} isLoading={isLoading}>
                {t('auth.register.submit')}
              </Button>)}
          </div>
          
          {step === 1 && (<div className={styles.registerLink} style={{ textAlign: 'center' }}>
              {t('auth.register.haveAccount')}
              <Link to="/login">{t('auth.signIn')}</Link>
            </div>)}
        </form>
      </div>
    </div>);
};
