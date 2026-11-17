import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { FileInput } from '../common/FileInput';
import { StatusBadge } from '../common/StatusBadge';
import { authService } from '../../services/api';
import { TRUCK_TYPE_OPTIONS } from '../../constants/enums';
import { toUserMessage } from '../../utils/errors';
import { useT } from '../../i18n';
import { useNames } from '../../i18n/catalog';
import { formatWeight } from '../../utils/format';

/**
 * Detail/edit view for ONE truck in the carrier's fleet (see
 * Profile.jsx's "مركباتي" list, which renders one of these per truck plus
 * an "add truck" entry point). `truck` null means "creating a new truck" —
 * that's the only case that also asks for the truck's own operatingCard/
 * registration documents; editing an existing truck only touches its own
 * brand/model/type/capacity/plate, not its already-uploaded documents.
 */
export const TruckDetailsModal = ({ isOpen, onClose, user, truck, onSaved, onDeleted }) => {
    const isNew = !truck;
    const [isEditing, setIsEditing] = useState(isNew);
    const [form, setForm] = useState({ brand: '', model: '', type: '', customType: '', capacityTons: '', plateNumber: '' });
    const [files, setFiles] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const { t } = useT();
    const { truckName } = useNames();

    useEffect(() => {
        if (isOpen) {
            setIsEditing(isNew);
            setForm({
                brand: truck?.brand || '',
                model: truck?.model || '',
                type: truck?.type || TRUCK_TYPE_OPTIONS[0],
                customType: truck?.customType || '',
                capacityTons: truck?.capacityTons ?? '',
                plateNumber: truck?.plateNumber || '',
            });
            setFiles({});
            setError('');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, truck]);

    if (!isOpen) return null;

    const handleFieldChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
    const handleFileChange = (name, file) => setFiles(f => ({ ...f, [name]: file }));

    const handleSave = async () => {
        setError('');
        if (isNew && (!files.operatingCard || !files.registration)) {
            setError(t('account.truck.papersRequired'));
            return;
        }
        // Type, capacity and plate were checked by the admin against the
        // papers — changing them sends the truck back for review.
        if (!isNew) {
            const reviewed = (t) => [t.type, t.customType || '', Number(t.capacityTons), t.plateNumber].join('|');
            if (reviewed(form) !== reviewed(truck)
                && !window.confirm(t('account.truck.reviewConfirm'))) {
                return;
            }
        }
        setIsSaving(true);
        try {
            const updatedUser = isNew
                ? await authService.addTruck(user.id, { ...form, operatingCardFile: files.operatingCard, registrationFile: files.registration })
                : await authService.updateTruck(user.id, truck.id, form);
            onSaved?.(updatedUser);
            if (isNew) onClose(); else setIsEditing(false);
        } catch (err) {
            setError(toUserMessage(err));
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(t('account.truck.deleteConfirm'))) return;
        setIsSaving(true);
        try {
            const updatedUser = await authService.removeTruck(user.id, truck.id);
            onDeleted?.(updatedUser);
            onClose();
        } finally {
            setIsSaving(false);
        }
    };

    return createPortal(
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div style={{ width: 420, maxWidth: '90%' }}>
                <Card>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 style={{ margin: 0 }}>{isNew ? t('account.truck.add') : isEditing ? t('account.truck.editTitle') : t('account.truck.detailsTitle')}</h3>
                        {!isNew && !isEditing && (
                            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>{t('account.truck.edit')}</Button>
                        )}
                    </div>

                    {error && (
                        <div style={{ padding: 12, marginBottom: 16, borderRadius: 8, backgroundColor: 'rgba(229,62,62,0.08)', color: 'var(--color-error)', fontSize: 13 }}>
                            {error}
                        </div>
                    )}

                    {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <Input name="brand" label={t('account.truck.brand')} value={form.brand} onChange={handleFieldChange} />
                            <Input name="model" label={t('account.truck.model')} value={form.model} onChange={handleFieldChange} />
                            <div>
                                <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>{t('account.truck.type')}</label>
                                <select
                                    name="type"
                                    value={form.type}
                                    onChange={handleFieldChange}
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)' }}
                                >
                                    {/* An older truck record may hold a value
                                        outside the enum — keep it selectable instead of silently
                                        swapping it for the first option in the list. */}
                                    {form.type && !TRUCK_TYPE_OPTIONS.includes(form.type) && (
                                        <option value={form.type}>{form.type}</option>
                                    )}
                                    {TRUCK_TYPE_OPTIONS.map(code => <option key={code} value={code}>{truckName(code)}</option>)}
                                </select>
                            </div>
                            <Input name="capacityTons" numeric="decimal" label={t('account.truck.capacity')} value={form.capacityTons} onChange={handleFieldChange} />
                            <Input name="plateNumber" label={t('account.truck.plate')} value={form.plateNumber} onChange={handleFieldChange} />

                            {isNew && (<>
                                <FileInput name="operatingCard" label={t('account.truck.operatingCard')} file={files.operatingCard} onChange={handleFileChange} />
                                <FileInput name="registration" label={t('account.truck.registration')} file={files.registration} onChange={handleFileChange} />
                            </>)}

                            <div style={{ display: 'flex', gap: 12 }}>
                                <Button style={{ flex: 1 }} onClick={handleSave} isLoading={isSaving}>{t('common.save')}</Button>
                                <Button
                                    variant="outline"
                                    style={{ flex: 1 }}
                                    onClick={() => (isNew ? onClose() : setIsEditing(false))}
                                    disabled={isSaving}
                                >
                                    {t('common.cancel')}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span className="text-helper">{t('account.truck.type')}</span>
                                {/* Older truck records may still carry a raw Arabic label
                                    instead of one of the real TruckType enum keys — fall back to
                                    showing it as-is rather than losing the information. */}
                                <strong>{truckName(truck.type, truck.customType)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span className="text-helper">{t('account.truck.brandModel')}</span>
                                <strong>{[truck.brand, truck.model].filter(Boolean).join(' / ') || '—'}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span className="text-helper">{t('account.truck.capacityShort')}</span>
                                <strong>{formatWeight(truck.capacityTons ?? '—')}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span className="text-helper">{t('account.truck.plate')}</span>
                                <strong dir="ltr">{truck.plateNumber || '—'}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className="text-helper">{t('account.truck.operatingCardShort')}</span>
                                <StatusBadge status={truck.operatingCard?.status} />
                            </div>
                            {truck.operatingCard?.expiryDate && (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span className="text-helper">{t('account.truck.operatingCardExpiry')}</span>
                                    <strong dir="ltr">{truck.operatingCard.expiryDate}</strong>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className="text-helper">{t('account.truck.registration')}</span>
                                <StatusBadge status={truck.registration?.status} />
                            </div>
                            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                                <Button variant="outline" style={{ flex: 1 }} onClick={onClose}>{t('common.close')}</Button>
                                <Button variant="danger" style={{ flex: 1 }} onClick={handleDelete} isLoading={isSaving}>{t('account.truck.delete')}</Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </div>,
        document.body
    );
};
