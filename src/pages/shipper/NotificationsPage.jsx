import React, { useEffect, useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { notificationService } from '../../services/api';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    const fetchNotifications = () => {
        notificationService.getNotifications().then(data => {
            setNotifications(data);
            setIsLoading(false);
        });
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleMarkAsRead = async (id, e) => {
        e.stopPropagation();
        await notificationService.markAsRead(id);
        fetchNotifications();
    };

    const handleMarkAllAsRead = async () => {
        await notificationService.markAllAsRead();
        fetchNotifications();
    };

    const handleNotificationClick = async (notif) => {
        if (!notif.isRead) {
            await notificationService.markAsRead(notif.id);
        }
        if (notif.linkTo) {
            navigate(notif.linkTo);
        }
    };

    if (isLoading) return <div>جاري التحميل...</div>;

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0 }}>الإشعارات</h2>
                {unreadCount > 0 && (
                    <Button variant="outline" onClick={handleMarkAllAsRead}>
                        تعليم الكل كمقروء
                    </Button>
                )}
            </div>

            <Card style={{ padding: 0 }}>
                {notifications.length === 0 ? (
                    <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        لا توجد إشعارات حالياً
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {notifications.map((notif, idx) => (
                            <div 
                                key={notif.id}
                                onClick={() => handleNotificationClick(notif)}
                                style={{
                                    padding: 24,
                                    borderBottom: idx < notifications.length - 1 ? '1px solid var(--color-border)' : 'none',
                                    backgroundColor: notif.isRead ? 'transparent' : 'rgba(255, 122, 41, 0.05)',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s',
                                    display: 'flex',
                                    gap: 16,
                                    alignItems: 'flex-start'
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: notif.isRead ? 'normal' : 'bold' }}>
                                        {notif.title}
                                    </h3>
                                    <p style={{ margin: '0 0 12px 0', color: 'var(--color-text-muted)' }}>
                                        {notif.message}
                                    </p>
                                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                                        {new Date(notif.timestamp).toLocaleString('ar-SA')}
                                    </div>
                                </div>
                                {!notif.isRead && (
                                    <Button 
                                        variant="outline" 
                                        onClick={(e) => handleMarkAsRead(notif.id, e)}
                                        style={{ padding: '8px 12px' }}
                                    >
                                        <Check size={16} style={{ marginLeft: 4 }} /> تعليم
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
};
