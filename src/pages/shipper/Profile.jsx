import React, { useEffect, useState } from 'react';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { authService } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ChangePasswordModal } from '../../components/profile/ChangePasswordModal';
import { NotificationSettingsModal } from '../../components/profile/NotificationSettingsModal';
import { TruckDetailsModal } from '../../components/profile/TruckDetailsModal';
export const Profile = () => {
    const [user, setUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isPasswordOpen, setIsPasswordOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isTruckOpen, setIsTruckOpen] = useState(false);
    // Form state
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        companyName: ''
    });
    useEffect(() => {
        authService.getCurrentUser().then(u => {
            setUser(u);
            setFormData({
                name: u.name,
                phone: u.phone,
                email: u.email,
                companyName: u.companyName || ''
            });
            setIsLoading(false);
        });
    }, []);
    if (isLoading)
        return <div>جاري التحميل...</div>;
    if (!user)
        return <div>حدث خطأ</div>;
    const handleSave = () => {
        // Mock save
        setUser({ ...user, ...formData });
        setIsEditing(false);
        alert('تم حفظ التغييرات بنجاح');
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
          <Button variant={isEditing ? "outline" : "primary"} onClick={() => isEditing ? setIsEditing(false) : setIsEditing(true)}>
            {isEditing ? 'إلغاء التعديل' : 'تعديل البيانات'}
          </Button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {user.accountType === 'COMPANY' && (<Input label="اسم المنشأة" value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} disabled={!isEditing}/>)}
          <Input label="اسم المسؤول" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} disabled={!isEditing}/>
          <Input label="رقم الجوال" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} disabled={!isEditing} dir="ltr" style={{ textAlign: 'right' }}/>
          <Input label="البريد الإلكتروني" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} disabled={!isEditing} dir="ltr" style={{ textAlign: 'right' }}/>
        </div>

        {isEditing && (<div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={handleSave}>حفظ التغييرات</Button>
          </div>)}
      </Card>

      {user.role === 'CARRIER' && (
          <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ margin: 0 }}>مركباتي</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <button
                      type="button"
                      onClick={() => setIsTruckOpen(true)}
                      style={{ padding: 16, border: '1px solid var(--color-border)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', cursor: 'pointer', width: '100%', textAlign: 'right', font: 'inherit', color: 'inherit' }}
                  >
                      <div>
                          <strong style={{ display: 'block', marginBottom: 4 }}>{user.truckType || 'لم يتم تحديد نوع الشاحنة'}</strong>
                          <span className="text-helper">اللوحة: {user.plateNumber || '—'}</span>
                      </div>
                      <StatusBadge status={user.accountStatus} />
                  </button>
              </div>
          </Card>
      )}

      <Card>
        <h3 style={{ marginBottom: 16 }}>الأمان والإشعارات</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--color-border)' }}>
          <div>
            <strong>تغيير كلمة المرور</strong>
          </div>
          <Button variant="outline" onClick={() => setIsPasswordOpen(true)}>تغيير</Button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--color-border)' }}>
          <div>
            <strong>إعدادات الإشعارات</strong>
            <div className="text-helper">{(user.notificationsEnabled ?? true) ? 'مُفعّلة' : 'مُعطّلة'}</div>
          </div>
          <Button variant="outline" onClick={() => setIsNotificationsOpen(true)}>إدارة</Button>
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
      <NotificationSettingsModal
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          user={user}
          onUpdated={(enabled) => setUser(u => ({ ...u, notificationsEnabled: enabled }))}
      />
      {user.role === 'CARRIER' && (
          <TruckDetailsModal
              isOpen={isTruckOpen}
              onClose={() => setIsTruckOpen(false)}
              user={user}
              onUpdated={(updated) => setUser(u => ({ ...u, ...updated }))}
          />
      )}
    </div>);
};
