import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { shipmentService, walletService } from '../../services/api';
import { InsufficientBalanceNotice } from '../../components/wallet/InsufficientBalanceNotice';
import { MapPickerModal } from '../../components/map/MapPickerModal';
import { TRUCK_TYPE_OPTIONS } from '../../constants/enums';
import { isValidSaudiPhone } from '../../utils/validators';
import { toUserMessage } from '../../utils/errors';
import { useT } from '../../i18n';
import { isTruckTypeActive, loadCatalog, useCatalog, useNames } from '../../i18n/catalog';

const STEP_KEYS = ['locations', 'cargo', 'truck', 'schedule', 'price', 'review'];

export const CreateShipment = () => {
    const navigate = useNavigate();
    const { t, lang } = useT();
    const { truckName, cargoItemName } = useNames();
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [publishError, setPublishError] = useState('');
    const [wallet, setWallet] = useState(null);
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
        cargoType: '', // the id from config/cargoTypes — what createShipment takes
        weight: '',
        description: '',
        requiredTruckType: '',
        loadingDate: '',
        loadingTime: '',
        proposedPrice: ''
    });
    const [errors, setErrors] = useState({});
    const [pickerOpen, setPickerOpen] = useState(null); // 'pickup' | 'delivery' | null
    // Admin-managed lists (config/cargoTypes, config/truckTypes). The backend
    // takes only a cargo type id from that list, and refuses a truck type the
    // admin switched off — so both pickers offer exactly what it accepts.
    // Re-read on opening, so a change the admin just made is already here.
    const catalog = useCatalog();
    useEffect(() => { loadCatalog({ refresh: true }); }, []);
    // A cargo type the admin switched off (active: false) isn't offered.
    const cargoOptions = (catalog.cargoTypes || []).filter(item => item.active !== false);
    const truckOptions = TRUCK_TYPE_OPTIONS.filter(isTruckTypeActive);
    const selectedCargo = cargoOptions.find(item => item.id === formData.cargoType);
    const steps = STEP_KEYS.map(key => t(`shipments.create.steps.${key}`));

    useEffect(() => walletService.subscribe(setWallet, () => {}), []);

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
            if (!formData.pickupCity) newErrors.pickupCity = t('common.required');
            if (!formData.deliveryCity) newErrors.deliveryCity = t('common.required');
            // The backend requires precise coordinates for both ends
            // (siteDetails.pickupCoords/deliveryCoords) — the map pin is
            // not optional here, unlike the old mock-only flow.
            if (formData.pickupLat == null) newErrors.pickupPin = t('shipments.create.pickupPinRequired');
            if (formData.deliveryLat == null) newErrors.deliveryPin = t('shipments.create.deliveryPinRequired');
            if (!formData.onSiteContact) newErrors.onSiteContact = t('common.required');
            else if (!isValidSaudiPhone(formData.onSiteContact)) newErrors.onSiteContact = t('shipments.create.phoneFormat');
        } else if (step === 1) {
            if (!formData.cargoType) newErrors.cargoType = t('shipments.create.chooseCargoType');
            if (!formData.weight || Number(formData.weight) <= 0) newErrors.weight = t('shipments.create.validWeight');
        } else if (step === 2) {
            if (!formData.requiredTruckType) newErrors.requiredTruckType = t('auth.register.chooseTruckType');
        } else if (step === 3) {
            if (!formData.loadingDate) newErrors.loadingDate = t('common.required');
            if (!formData.loadingTime) newErrors.loadingTime = t('common.required');
        } else if (step === 4) {
            if (!formData.proposedPrice || Number(formData.proposedPrice) <= 0) newErrors.proposedPrice = t('shipments.create.validPrice');
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
                cargoType: formData.cargoType,
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
            setPublishError(toUserMessage(err, t('shipments.create.publishFailed')));
        }
        finally {
            setIsLoading(false);
        }
    };

    // Posting isn't blocked — the money is only reserved when an offer is
    // accepted — but the shipper should know now that they'll need to top up.
    const suggestedPrice = Number(formData.proposedPrice) || 0;
    const balanceWarning = wallet && suggestedPrice > 0 && wallet.available < suggestedPrice ? (
        <InsufficientBalanceNotice available={wallet.available} required={suggestedPrice} label={t('shipments.create.proposedPriceLabel')} warning>
            {t('shipments.create.balanceWarning')}
        </InsufficientBalanceNotice>
    ) : null;

    const ErrorMsg = ({ error }) => error ? <div style={{ color: 'var(--color-error)', fontSize: 12, marginTop: -8, marginBottom: 8 }}>{error}</div> : null;

    return (<div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>{t('shipments.create.title')}</h2>
        <Button variant="outline" onClick={() => navigate('/app/shipments')}>{t('common.cancel')}</Button>
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
              <h3 style={{ marginBottom: 16 }}>{t('shipments.create.locationsTitle')}</h3>
              <Input name="pickupCity" label={t('shipments.pickupCity')} value={formData.pickupCity} onChange={handleChange}/>
              <ErrorMsg error={errors.pickupCity} />
              <Button
                type="button"
                variant="outline"
                size="sm"
                style={{ marginBottom: 16 }}
                onClick={() => setPickerOpen('pickup')}
              >
                {formData.pickupLat ? t('shipments.create.pinSet') : t('shipments.create.setPickupPin')}
              </Button>
              <ErrorMsg error={errors.pickupPin} />

              <div style={{ margin: '24px 0', borderTop: '1px solid var(--color-border)' }}></div>

              <Input name="deliveryCity" label={t('shipments.deliveryCity')} value={formData.deliveryCity} onChange={handleChange}/>
              <ErrorMsg error={errors.deliveryCity} />
              <Button
                type="button"
                variant="outline"
                size="sm"
                style={{ marginBottom: 16 }}
                onClick={() => setPickerOpen('delivery')}
              >
                {formData.deliveryLat ? t('shipments.create.pinSet') : t('shipments.create.setDeliveryPin')}
              </Button>
              <ErrorMsg error={errors.deliveryPin} />

              <div style={{ margin: '24px 0', borderTop: '1px solid var(--color-border)' }}></div>
              <p className="text-helper" style={{ marginBottom: 8 }}>
                {t('shipments.create.privateNote')}
              </p>
              <Input name="onSiteContact" numeric="phone" label={t('shipments.onSiteContact')} value={formData.onSiteContact} onChange={handleChange} dir="ltr" style={{ textAlign: lang === 'ar' ? 'right' : 'left' }} />
              <ErrorMsg error={errors.onSiteContact} />
              <Input name="pickupNotes" label={t('shipments.create.pickupNotesOptional')} value={formData.pickupNotes} onChange={handleChange}/>
              <Input name="deliveryNotes" label={t('shipments.create.deliveryNotesOptional')} value={formData.deliveryNotes} onChange={handleChange}/>

              <MapPickerModal
                isOpen={pickerOpen === 'pickup'}
                onClose={() => setPickerOpen(null)}
                title={t('shipments.create.pickupPinTitle')}
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
                title={t('shipments.create.deliveryPinTitle')}
                cityName={formData.deliveryCity}
                initialPoint={formData.deliveryLat ? [formData.deliveryLat, formData.deliveryLng] : null}
                onConfirm={([lat, lng], city) => {
                  setFormData(f => ({ ...f, deliveryLat: lat, deliveryLng: lng, deliveryCity: city || f.deliveryCity }));
                  setErrors(e => ({ ...e, deliveryPin: null, ...(city ? { deliveryCity: null } : {}) }));
                }}
              />
            </div>)}

          {currentStep === 1 && (<div>
              <h3 style={{ marginBottom: 16 }}>{t('shipments.create.cargoTitle')}</h3>
              <Select name="cargoType" label={t('shipments.cargoType')} value={formData.cargoType} onChange={handleChange} options={[
                { value: '', label: t('shipments.create.chooseCargoType') },
                ...cargoOptions.map(item => ({ value: item.id, label: cargoItemName(item) })),
              ]}/>
              <ErrorMsg error={errors.cargoType} />
              {catalog.loaded && cargoOptions.length === 0 && (
                  <p role="alert" className="text-helper" style={{ color: 'var(--color-error)', marginTop: -4 }}>{t('shipments.create.noCargoTypes')}</p>
              )}
              <Input name="weight" numeric="decimal" label={t('shipments.create.weightTons')} value={formData.weight} onChange={handleChange}/>
              <ErrorMsg error={errors.weight} />
              <Input name="description" label={t('shipments.create.descriptionOptional')} value={formData.description} onChange={handleChange}/>
            </div>)}

          {currentStep === 2 && (<div>
              <h3 style={{ marginBottom: 16 }}>{t('shipments.requiredTruck')}</h3>
              <Select name="requiredTruckType" label={t('account.truck.type')} value={formData.requiredTruckType} onChange={handleChange} options={[
                { value: '', label: t('account.truck.chooseType') },
                ...truckOptions.map(code => ({ value: code, label: truckName(code) })),
              ]}/>
              <ErrorMsg error={errors.requiredTruckType} />
            </div>)}

          {currentStep === 3 && (<div>
              <h3 style={{ marginBottom: 16 }}>{t('shipments.create.scheduleTitle')}</h3>
              <Input name="loadingDate" type="date" label={t('shipments.loadingDate')} value={formData.loadingDate} onChange={handleChange}/>
              <ErrorMsg error={errors.loadingDate} />
              <Input name="loadingTime" type="time" label={t('shipments.create.loadingTime')} value={formData.loadingTime} onChange={handleChange}/>
              <ErrorMsg error={errors.loadingTime} />
            </div>)}

          {currentStep === 4 && (<div>
              <h3 style={{ marginBottom: 16 }}>{t('shipments.create.pricingTitle')}</h3>
              <Input name="proposedPrice" numeric="integer" label={t('shipments.create.proposedPriceSar')} value={formData.proposedPrice} onChange={handleChange}/>
              <ErrorMsg error={errors.proposedPrice} />
              <p className="text-helper" style={{ marginTop: 8 }}>
                {t('shipments.create.priceHelp')}
              </p>
              {balanceWarning}
            </div>)}

          {currentStep === 5 && (<div>
              <h3 style={{ marginBottom: 16 }}>{t('shipments.create.reviewTitle')}</h3>
              {publishError && (
                  <div style={{ padding: 12, marginBottom: 16, borderRadius: 8, backgroundColor: 'rgba(229,62,62,0.08)', color: 'var(--color-error)', fontSize: 13 }}>
                      {publishError}
                  </div>
              )}
              {balanceWarning && <div style={{ marginBottom: 16 }}>{balanceWarning}</div>}
              <div className="responsive-two-col-even">
                <div><strong>{t('shipments.labels.route')}</strong> {t('shipments.routeTo', { from: formData.pickupCity, to: formData.deliveryCity })}</div>
                <div><strong>{t('shipments.labels.cargo')}</strong> {cargoItemName(selectedCargo)} ({t('common.tons', { value: formData.weight })})</div>
                <div><strong>{t('shipments.labels.truck')}</strong> {truckName(formData.requiredTruckType)}</div>
                <div><strong>{t('shipments.labels.schedule')}</strong> {formData.loadingDate} - {formData.loadingTime}</div>
                <div><strong>{t('shipments.labels.proposedPrice')}</strong> {t('common.money', { amount: formData.proposedPrice })}</div>
              </div>
              <div style={{ marginTop: 24, padding: 16, backgroundColor: 'rgba(15, 36, 64, 0.05)', borderRadius: 8 }}>
                <p style={{ margin: 0, fontWeight: 'bold' }}>{t('shipments.create.afterTitle')}</p>
                <ul style={{ margin: '8px 0 0', paddingInlineStart: 20, paddingInlineEnd: 0, fontSize: 14 }}>
                  <li>{t('shipments.create.after1')}</li>
                  <li>{t('shipments.create.after2')}</li>
                  <li>{t('shipments.create.after3')}</li>
                </ul>
              </div>
            </div>)}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
            <Button variant="outline" onClick={prevStep} disabled={currentStep === 0}>{t('auth.register.previous')}</Button>
            {currentStep < steps.length - 1 ? (<Button onClick={nextStep}>{t('auth.register.next')}</Button>) : (<Button onClick={handlePublish} isLoading={isLoading}>{t('shipments.create.publish')}</Button>)}
          </div>
        </Card>

        <div>
          <Card>
            <h4 style={{ margin: '0 0 16px' }}>{t('shipments.create.summary')}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-helper">{t('shipments.create.summaryPickup')}</span>
                <span>{formData.pickupCity || '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-helper">{t('shipments.create.summaryDelivery')}</span>
                <span>{formData.deliveryCity || '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-helper">{t('shipments.cargo')}</span>
                <span>{selectedCargo ? cargoItemName(selectedCargo) : '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-helper">{t('shipments.truck')}</span>
                <span>{formData.requiredTruckType ? truckName(formData.requiredTruckType) : '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-helper">{t('shipments.price')}</span>
                <strong>{formData.proposedPrice ? t('common.money', { amount: formData.proposedPrice }) : '-'}</strong>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>);
};
