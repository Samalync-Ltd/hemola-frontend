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
import { toUserMessage } from '../../utils/errors';
import { useT } from '../../i18n';
import { Loader } from '../../components/common/Loader';
import { formatWeight } from '../../utils/format';
import { useNames } from '../../i18n/catalog';
export const Profile = () => {
    const { t, lang } = useT();
    const { truckName } = useNames();
    const [user, setUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isPasswordOpen, setIsPasswordOpen] = useState(false);
    const [isTruckOpen, setIsTruckOpen] = useState(false);
    const [selectedTruck, setSelectedTruck] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [saveMessage, setSaveMessage] = useState('');
    const [emailVerified, setEmailVerified] = useState(null); // null until known
    const [verificationNotice, setVerificationNotice] = useState('');
    const [isResending, setIsResending] = useState(false);
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
        authService.isEmailVerified().then(setEmailVerified).catch(() => {});
    }, []);

    const resendVerification = async () => {
        setVerificationNotice('');
        setIsResending(true);
        try {
            await authService.resendEmailVerification();
            setVerificationNotice(t('account.verificationSent'));
        } catch (err) {
            setVerificationNotice(toUserMessage(err, t('account.verificationFailed')));
        } finally {
            setIsResending(false);
        }
    };
    if (isLoading)
        return <Loader label={t('account.loading')} />;
    if (!user)
        return <div>{t('account.error')}</div>;
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
        if (!formData.name.trim()) { setSaveError(t('account.nameRequired')); return; }
        if (user.accountType === 'COMPANY' && !formData.companyName.trim()) { setSaveError(t('account.companyRequired')); return; }
        if (!isValidSaudiPhone(formData.phone)) { setSaveError(t('errors.app.phoneInvalid')); return; }

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
            setSaveMessage(t('account.saved'));
            window.dispatchEvent(new CustomEvent(PROFILE_UPDATED_EVENT, { detail: updated }));
        } catch (err) {
            setSaveError(toUserMessage(err, t('account.saveFailed')));
        } finally {
            setIsSaving(false);
        }
    };
    return (<div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 800, margin: '0 auto' }}>
      <h2 style={{ margin: 0 }}>{t('account.title')}</h2>
      
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
                      <span className="text-helper">{t('account.rating')} </span>
                      <strong style={{ color: 'var(--color-accent)' }}>⭐ {user.rating}</strong>
                      <span className="text-helper" style={{ margin: '0 8px' }}>|</span>
                      <span className="text-helper">{t('account.completedTrips')} </span>
                      <strong>{user.completedTrips}</strong>
                  </div>
              )}
            </div>
          </div>
          <Button variant={isEditing ? "outline" : "primary"} onClick={isEditing ? cancelEditing : startEditing} disabled={isSaving}>
            {isEditing ? t('account.cancelEdit') : t('account.edit')}
          </Button>
        </div>

        <div className="responsive-two-col-even">
          {user.accountType === 'COMPANY' && (<Input label={t('account.companyName')} value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} disabled={!isEditing}/>)}
          <Input label={t('auth.register.contactName')} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} disabled={!isEditing}/>
          <Input label={t('auth.mobile')} numeric="phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} disabled={!isEditing} dir="ltr" style={{ textAlign: lang === 'ar' ? 'right' : 'left' }}/>
          <div>
            {/* The email is the Firebase Auth login and there is no backend
                path for a user to change it, so it is shown, not edited. */}
            <Input label={t('auth.email')} value={formData.email} disabled dir="ltr" style={{ textAlign: lang === 'ar' ? 'right' : 'left' }}/>
            {isEditing && <div className="text-helper" style={{ marginTop: -8, fontSize: 12 }}>{t('account.emailLocked')}</div>}
            {!isEditing && emailVerified === true && (
              <div style={{ marginTop: -8, fontSize: 12, color: 'var(--color-success)', fontWeight: 600 }}>✓ {t('account.emailVerified')}</div>
            )}
            {!isEditing && emailVerified === false && (
              <div style={{ marginTop: -8, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ color: '#B45309', fontWeight: 600 }}>{t('account.emailNotVerified')}</span>
                <button type="button" onClick={resendVerification} disabled={isResending} style={{ background: 'none', border: 'none', padding: 0, fontFamily: 'inherit', fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', cursor: 'pointer', textDecoration: 'underline' }}>
                  {isResending ? t('wallet.withdrawModal.sending') : t('account.resendVerification')}
                </button>
                {verificationNotice && <span className="text-helper" style={{ fontSize: 12 }}>{verificationNotice}</span>}
              </div>
            )}
          </div>
        </div>

        {saveError && <div role="alert" style={{ marginTop: 16, color: 'var(--color-error)', fontSize: 14 }}>{saveError}</div>}
        {saveMessage && !isEditing && <div role="status" style={{ marginTop: 16, color: 'var(--color-success)', fontSize: 14 }}>{saveMessage}</div>}

        {isEditing && (<div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={handleSave} isLoading={isSaving} disabled={isSaving}>{t('account.saveChanges')}</Button>
          </div>)}
      </Card>

      {user.role === 'CARRIER' && (
          <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ margin: 0 }}>{t('account.myVehicles')}</h3>
                  <Button size="sm" onClick={() => { setSelectedTruck(null); setIsTruckOpen(true); }}>{t('account.truck.add')}</Button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {(user.trucks || []).length === 0 && (
                      <p className="text-helper">{t('account.noTrucks')}</p>
                  )}
                  {(user.trucks || []).map(truck => (
                      <button
                          key={truck.id}
                          type="button"
                          onClick={() => { setSelectedTruck(truck); setIsTruckOpen(true); }}
                          style={{ padding: 16, border: '1px solid var(--color-border)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', cursor: 'pointer', width: '100%', textAlign: 'start', font: 'inherit', color: 'inherit' }}
                      >
                          <div>
                              <strong style={{ display: 'block', marginBottom: 4 }}>{truck.type ? truckName(truck.type, truck.customType) : t('account.truck.noType')} {truck.brand ? `— ${truck.brand} ${truck.model}` : ''}</strong>
                              <span className="text-helper">{t('account.truck.summary', { plate: truck.plateNumber || '—', capacity: formatWeight(truck.capacityTons ?? '—') })}</span>
                          </div>
                          <StatusBadge status={truck.operatingCard?.status} />
                      </button>
                  ))}
              </div>
          </Card>
      )}

      <Card>
        <h3 style={{ marginBottom: 16 }}>{t('account.security')}</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--color-border)' }}>
          <div>
            <strong>{t('account.password.title')}</strong>
          </div>
          <Button variant="outline" onClick={() => setIsPasswordOpen(true)}>{t('account.change')}</Button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' }}>
          <div>
            <strong style={{ color: 'var(--color-error)' }}>{t('account.signOut')}</strong>
            <div className="text-helper">{t('account.signOutHint')}</div>
          </div>
          <Button variant="danger" onClick={async () => {
              await authService.logout();
              window.location.href = '/login';
          }}>{t('account.signOutButton')}</Button>
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
