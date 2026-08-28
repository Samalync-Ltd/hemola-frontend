import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { authService } from '../../services/api';

const TRUCK_TYPE_OPTIONS = ['دينا', 'دينا مغلقة', 'شاحنة نقل ثقيل (تريلا)', 'تريلا جوانب', 'أخرى'];

/** Full detail view for the carrier's registered truck, with an edit action — not just a static card. */
export const TruckDetailsModal = ({ isOpen, onClose, user, onUpdated }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [truckType, setTruckType] = useState(user?.truckType || '');
    const [plateNumber, setPlateNumber] = useState(user?.plateNumber || '');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsEditing(false);
            setTruckType(user?.truckType || '');
            setPlateNumber(user?.plateNumber || '');
        }
    }, [isOpen, user]);

    if (!isOpen) return null;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updated = await authService.updateTruckInfo(user.id, { truckType, plateNumber });
            onUpdated?.(updated);
            setIsEditing(false);
        } finally {
            setIsSaving(false);
        }
    };

    return createPortal(
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div style={{ width: 420, maxWidth: '90%' }}>
                <Card>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 style={{ margin: 0 }}>{isEditing ? 'تعديل بيانات الشاحنة' : 'تفاصيل الشاحنة'}</h3>
                        {!isEditing && (
                            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>تعديل</Button>
                        )}
                    </div>

                    {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>نوع الشاحنة</label>
                                <select
                                    value={truckType}
                                    onChange={e => setTruckType(e.target.value)}
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)' }}
                                >
                                    {TRUCK_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <Input label="رقم اللوحة" value={plateNumber} onChange={e => setPlateNumber(e.target.value)} />
                            <div style={{ display: 'flex', gap: 12 }}>
                                <Button style={{ flex: 1 }} onClick={handleSave} isLoading={isSaving}>حفظ</Button>
                                <Button variant="outline" style={{ flex: 1 }} onClick={() => setIsEditing(false)} disabled={isSaving}>إلغاء</Button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span className="text-helper">نوع الشاحنة</span>
                                <strong>{user?.truckType || '—'}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span className="text-helper">رقم اللوحة</span>
                                <strong dir="ltr">{user?.plateNumber || '—'}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span className="text-helper">الرحلات المكتملة</span>
                                <strong>{user?.completedTrips ?? 0}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span className="text-helper">التقييم</span>
                                <strong>⭐ {user?.rating ?? '—'}</strong>
                            </div>
                            <Button variant="outline" style={{ marginTop: 12 }} onClick={onClose}>إغلاق</Button>
                        </div>
                    )}
                </Card>
            </div>
        </div>,
        document.body
    );
};
