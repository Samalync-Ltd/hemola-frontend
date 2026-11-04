import React, { useEffect, useState } from 'react';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { authService } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ChangePasswordModal } from '../../components/profile/ChangePasswordModal';
import { TruckDetailsModal } from '../../components/profile/TruckDetailsModal';
import { isValidSaudiPhone } from '../../utils/validators';
import { PROFILE_UPDATED_EVENT } from '../../constants/config';
import { toArabicError } from '../../utils/errors';
export const Profile = () => {
    const [user, setUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isPasswordOpen, setIsPasswordOpen] = useState(false);
    const [isTruckOpen, setIsTruckOpen] = useState(false);
    const [selectedTruck, setSelectedTruck] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [saveMessage, setSaveMessage] = useState('');
    // Form state
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        companyName: ''
    });
    const resetForm = (u) => setFormData({
        name: u.name || '',
        phone: u.phone || '',
        email: u.email || '',
        companyName: u.companyName || ''
    });
    useEffect(() => {
        authService.getCurrentUser().then(u => {
            setUser(u);
            if (u) resetForm(u);
            setIsLoading(false);
        }).catch(() => setIsLoading(false));
    }, []);
    if (isLoading)
        return <div>جاري التحميل...</div>;
    if (!user)
        return <div>حدث خطأ</div>;
    const startEditing = () => {
        setSaveError('');
        setSaveMessage('');
        setIsEditing(true);
    };
    const cancelEditing = () => {
        resetForm(user);
        setSaveError('');
        setIsEditing(false);
    };
    const handleSave = async () => {
        setSaveError('');
        setSaveMessage('');
        if (!formData.name.trim()) { setSaveError('اسم المسؤول مطلوب'); return; }
        if (user.accountType === 'COMPANY' && !formData.companyName.trim()) { setSaveError('اسم المنشأة مطلوب'); return; }
        if (!isValidSaudiPhone(formData.phone)) { setSaveError('رقم الجوال غير صحيح — أدخل رقم جوال سعودي (05xxxxxxxx)'); return; }

        setIsSaving(true);
        try {
            const updated = await authService.updateProfile(user.id, {
                name: formData.name,
                companyName: formData.companyName,
                phone: formData.phone,
            });
            setUser(updated);
            resetForm(updated);
            setIsEditing(false);
            setSaveMessage('تم حفظ التغييرات بنجاح');
            window.dispatchEvent(new CustomEvent(PROFILE_UPDATED_EVENT, { detail: updated }));
        } catch (err) {
            setSaveError(toArabicError(err, 'تعذّر حفظ التغييرات، حاول مرة أخرى'));
        } finally {
            setIsSaving(false);
        }
    };
    return (<div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 800, margin: '0 auto' }}>
      <h2 style={{ margin: 0 }}>إعدادات الحساب</h2>
      
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 'bold' }}>
              {user.companyName ? user.companyName.substring(0, 1) : user.name.substring(0, 1)}
            </div>
            <div>
              <h3 style={{ margin: '0 0 4px' }}>{user.companyName || user.name}</h3>
              <StatusBadge status={user.accountStatus}/>
              {user.role === 'CARRIER' && (
                  <div style={{ marginTop: 8, fontSize: 14 }}>
                      <span className="text-helper">التقييم: </span>
                      <strong style={{ color: 'var(--color-accent)' }}>⭐ {user.rating}</strong>
                      <span className="text-helper" style={{ margin: '0 8px' }}>|</span>
                      <span className="text-helper">رحلات مكتملة: </span>
                      <strong>{user.completedTrips}</strong>
                  </div>
              )}
            </div>
          </div>
          <Button variant={isEditing ? "outline" : "primary"} onClick={isEditing ? cancelEditing : startEditing} disabled={isSaving}>
            {isEditing ? 'إلغاء التعديل' : 'تعديل البيانات'}
          </Button>
        </div>

        <div className="responsive-two-col-even">
          {user.accountType === 'COMPANY' && (<Input label="اسم المنشأة" value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} disabled={!isEditing}/>)}
          <Input label="اسم المسؤول" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} disabled={!isEditing}/>
          <Input label="رقم الجوال" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} disabled={!isEditing} dir="ltr" style={{ textAlign: 'right' }}/>
          <div>
            {/* The email is the Firebase Auth login and there is no backend
                path for a user to change it, so it is shown, not edited. */}
            <Input label="البريد الإلكتروني" value={formData.email} disabled dir="ltr" style={{ textAlign: 'right' }}/>
            {isEditing && <div className="text-helper" style={{ marginTop: -8, fontSize: 12 }}>لا يمكن تغيير البريد الإلكتروني من هنا — تواصل مع الدعم لتغييره.</div>}
          </div>
        </div>

        {saveError && <div role="alert" style={{ marginTop: 16, color: 'var(--color-error)', fontSize: 14 }}>{saveError}</div>}
        {saveMessage && !isEditing && <div role="status" style={{ marginTop: 16, color: 'var(--color-success)', fontSize: 14 }}>{saveMessage}</div>}

        {isEditing && (<div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={handleSave} isLoading={isSaving} disabled={isSaving}>حفظ التغييرات</Button>
          </div>)}
      </Card>

      {user.role === 'CARRIER' && (
          <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ margin: 0 }}>مركباتي</h3>
                  <Button size="sm" onClick={() => { setSelectedTruck(null); setIsTruckOpen(true); }}>إضافة شاحنة</Button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {(user.trucks || []).length === 0 && (
                      <p className="text-helper">لا توجد شاحنات مسجلة بعد — أضف شاحنتك الأولى.</p>
                  )}
                  {(user.trucks || []).map(truck => (
                      <button
                          key={truck.id}
                          type="button"
                          onClick={() => { setSelectedTruck(truck); setIsTruckOpen(true); }}
                          style={{ padding: 16, border: '1px solid var(--color-border)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', cursor: 'pointer', width: '100%', textAlign: 'right', font: 'inherit', color: 'inherit' }}
                      >
                          <div>
                              <strong style={{ display: 'block', marginBottom: 4 }}>{truck.type || 'لم يتم تحديد نوع الشاحنة'} {truck.brand ? `— ${truck.brand} ${truck.model}` : ''}</strong>
                              <span className="text-helper">اللوحة: {truck.plateNumber || '—'} | السعة: {truck.capacityTons ?? '—'} طن</span>
                          </div>
                          <StatusBadge status={truck.operatingCard?.status} />
                      </button>
                  ))}
              </div>
          </Card>
      )}

      <Card>
        <h3 style={{ marginBottom: 16 }}>الأمان</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--color-border)' }}>
          <div>
            <strong>تغيير كلمة المرور</strong>
          </div>
          <Button variant="outline" onClick={() => setIsPasswordOpen(true)}>تغيير</Button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' }}>
          <div>
            <strong style={{ color: 'var(--color-error)' }}>تسجيل الخروج</strong>
            <div className="text-helper">تسجيل الخروج من هذا الجهاز</div>
          </div>
          <Button variant="danger" onClick={async () => {
              await authService.logout();
              window.location.href = '/login';
          }}>خروج</Button>
        </div>
      </Card>

      <ChangePasswordModal isOpen={isPasswordOpen} onClose={() => setIsPasswordOpen(false)} />
      {user.role === 'CARRIER' && (
          <TruckDetailsModal
              isOpen={isTruckOpen}
              onClose={() => setIsTruckOpen(false)}
              user={user}
              truck={selectedTruck}
              onSaved={(updatedUser) => setUser(updatedUser)}
              onDeleted={(updatedUser) => setUser(updatedUser)}
          />
      )}
    </div>);
};
