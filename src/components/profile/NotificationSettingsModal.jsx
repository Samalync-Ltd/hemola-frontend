import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { authService } from '../../services/api';

/** One switch — receive notifications, or don't. Deliberately not a per-category settings screen. */
export const NotificationSettingsModal = ({ isOpen, onClose, user, onUpdated }) => {
    const [enabled, setEnabled] = useState(user?.notificationsEnabled ?? true);
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const handleToggle = async () => {
        const next = !enabled;
        setEnabled(next);
        setIsSaving(true);
        try {
            await authService.setNotificationsEnabled(user.id, next);
            onUpdated?.(next);
        } finally {
            setIsSaving(false);
        }
    };

    return createPortal(
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div style={{ width: 400, maxWidth: '90%' }}>
                <Card>
                    <h3 style={{ marginBottom: 16 }}>إعدادات الإشعارات</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                        <div>
                            <strong>تلقي الإشعارات</strong>
                            <div className="text-helper" style={{ marginTop: 4 }}>
                                {enabled ? 'ستصلك إشعارات العروض وتحديثات الرحلات' : 'لن تصلك أي إشعارات حتى يتم تفعيلها مجدداً'}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleToggle}
                            disabled={isSaving}
                            aria-pressed={enabled}
                            style={{
                                width: 48, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer',
                                backgroundColor: enabled ? 'var(--color-primary)' : 'var(--color-border)',
                                position: 'relative', flexShrink: 0, transition: 'background-color 0.2s',
                            }}
                        >
                            <span style={{
                                position: 'absolute', top: 3, width: 22, height: 22, borderRadius: '50%',
                                backgroundColor: 'white', transition: 'right 0.2s',
                                right: enabled ? 3 : 23,
                            }} />
                        </button>
                    </div>
                    <div style={{ display: 'flex', marginTop: 24 }}>
                        <Button style={{ flex: 1 }} onClick={onClose}>تم</Button>
                    </div>
                </Card>
            </div>
        </div>,
        document.body
    );
};
