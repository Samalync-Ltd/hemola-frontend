import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { StatusBadge } from '../common/StatusBadge';
import { authService } from '../../services/api';
import { TRUCK_TYPE_OPTIONS, TruckTypeAr } from '../../constants/enums';

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
    const [form, setForm] = useState({ brand: '', model: '', type: '', capacityTons: '', plateNumber: '' });
    const [files, setFiles] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setIsEditing(isNew);
            setForm({
                brand: truck?.brand || '',
                model: truck?.model || '',
                type: truck?.type || TRUCK_TYPE_OPTIONS[0],
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
    const handleFileChange = (e) => setFiles({ ...files, [e.target.name]: e.target.files[0] });

    const handleSave = async () => {
        setError('');
        if (isNew && (!files.operatingCard || !files.registration)) {
            setError('يرجى إرفاق بطاقة تشغيل المركبة والاستمارة (رخصة السير)');
            return;
        }
        setIsSaving(true);
        try {
            const updatedUser = isNew
                ? await authService.addTruck(user.id, { ...form, operatingCardFile: files.operatingCard, registrationFile: files.registration })
                : await authService.updateTruck(user.id, truck.id, form);
            onSaved?.(updatedUser);
            if (isNew) onClose(); else setIsEditing(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('هل تريد حذف هذه الشاحنة من أسطولك؟')) return;
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
                        <h3 style={{ margin: 0 }}>{isNew ? 'إضافة شاحنة' : isEditing ? 'تعديل بيانات الشاحنة' : 'تفاصيل الشاحنة'}</h3>
                        {!isNew && !isEditing && (
                            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>تعديل</Button>
                        )}
                    </div>

                    {error && (
                        <div style={{ padding: 12, marginBottom: 16, borderRadius: 8, backgroundColor: 'rgba(229,62,62,0.08)', color: 'var(--color-error)', fontSize: 13 }}>
                            {error}
                        </div>
                    )}

                    {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <Input name="brand" label="الشركة المصنّعة" value={form.brand} onChange={handleFieldChange} />
                            <Input name="model" label="الطراز" value={form.model} onChange={handleFieldChange} />
                            <div>
                                <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>نوع الشاحنة</label>
                                <select
                                    name="type"
                                    value={form.type}
                                    onChange={handleFieldChange}
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)' }}
                                >
                                    {/* A pre-existing truck (e.g. mock-seeded data) may hold a value
                                        outside the enum — keep it selectable instead of silently
                                        swapping it for the first option in the list. */}
                                    {form.type && !TRUCK_TYPE_OPTIONS.includes(form.type) && (
                                        <option value={form.type}>{form.type}</option>
                                    )}
                                    {TRUCK_TYPE_OPTIONS.map(t => <option key={t} value={t}>{TruckTypeAr[t] || t}</option>)}
                                </select>
                            </div>
                            <Input name="capacityTons" type="number" min="0" label="الحمولة القصوى (طن)" value={form.capacityTons} onChange={handleFieldChange} />
                            <Input name="plateNumber" label="رقم اللوحة" value={form.plateNumber} onChange={handleFieldChange} />

                            {isNew && (<>
                                <Input name="operatingCard" type="file" label="بطاقة تشغيل مركبة" onChange={handleFileChange} />
                                <Input name="registration" type="file" label="الاستمارة (رخصة السير)" onChange={handleFileChange} />
                            </>)}

                            <div style={{ display: 'flex', gap: 12 }}>
                                <Button style={{ flex: 1 }} onClick={handleSave} isLoading={isSaving}>حفظ</Button>
                                <Button
                                    variant="outline"
                                    style={{ flex: 1 }}
                                    onClick={() => (isNew ? onClose() : setIsEditing(false))}
                                    disabled={isSaving}
                                >
                                    إلغاء
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span className="text-helper">نوع الشاحنة</span>
                                {/* Older mock-seeded trucks may still carry a raw Arabic label
                                    instead of one of the real TruckType enum keys — fall back to
                                    showing it as-is rather than losing the information. */}
                                <strong>{(truck.type === 'OTHER' ? truck.customType : TruckTypeAr[truck.type]) || truck.type || '—'}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span className="text-helper">الشركة المصنّعة / الطراز</span>
                                <strong>{[truck.brand, truck.model].filter(Boolean).join(' / ') || '—'}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span className="text-helper">الحمولة القصوى</span>
                                <strong>{truck.capacityTons ?? '—'} طن</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span className="text-helper">رقم اللوحة</span>
                                <strong dir="ltr">{truck.plateNumber || '—'}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className="text-helper">بطاقة التشغيل</span>
                                <StatusBadge status={truck.operatingCard?.status} />
                            </div>
                            {truck.operatingCard?.expiryDate && (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span className="text-helper">تاريخ انتهاء بطاقة التشغيل</span>
                                    <strong dir="ltr">{truck.operatingCard.expiryDate}</strong>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className="text-helper">الاستمارة (رخصة السير)</span>
                                <StatusBadge status={truck.registration?.status} />
                            </div>
                            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                                <Button variant="outline" style={{ flex: 1 }} onClick={onClose}>إغلاق</Button>
                                <Button variant="danger" style={{ flex: 1 }} onClick={handleDelete} isLoading={isSaving}>حذف</Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </div>,
        document.body
    );
};
