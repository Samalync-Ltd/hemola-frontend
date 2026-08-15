import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../../services/api';

export const NotificationCenter = () => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const fetchNotifications = () => {
        notificationService.getNotifications().then(setNotifications);
    };

    useEffect(() => {
        fetchNotifications();
        
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const unreadCount = notifications.filter(n => !n.isRead).length;

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
            fetchNotifications();
        }
        setIsOpen(false);
        if (notif.linkTo) {
            navigate(notif.linkTo);
        }
    };

    return (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                style={{ 
                    color: 'var(--color-text-muted)', 
                    cursor: 'pointer', 
                    background: 'none', 
                    border: 'none', 
                    position: 'relative',
                    padding: 4
                }}
            >
                <Bell size={24} />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        backgroundColor: 'var(--color-accent)',
                        color: 'white',
                        fontSize: 10,
                        fontWeight: 'bold',
                        borderRadius: '50%',
                        width: 16,
                        height: 16,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0, // Align right relative to bell
                    width: 320,
                    backgroundColor: 'white',
                    borderRadius: 8,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    zIndex: 1000,
                    overflow: 'hidden',
                    marginTop: 8,
                    border: '1px solid var(--color-border)'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '16px',
                        borderBottom: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-background)'
                    }}>
                        <h3 style={{ margin: 0, fontSize: 16 }}>الإشعارات</h3>
                        {unreadCount > 0 && (
                            <button 
                                onClick={handleMarkAllAsRead}
                                style={{ 
                                    background: 'none', 
                                    border: 'none', 
                                    color: 'var(--color-accent)', 
                                    fontSize: 12, 
                                    cursor: 'pointer' 
                                }}
                            >
                                تعليم الكل كمقروء
                            </button>
                        )}
                    </div>

                    <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                            <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                لا توجد إشعارات
                            </div>
                        ) : (
                            notifications.map(notif => (
                                <div 
                                    key={notif.id}
                                    onClick={() => handleNotificationClick(notif)}
                                    style={{
                                        padding: 16,
                                        borderBottom: '1px solid var(--color-border)',
                                        backgroundColor: notif.isRead ? 'white' : 'rgba(255, 122, 41, 0.05)',
                                        cursor: 'pointer',
                                        transition: 'background-color 0.2s',
                                        display: 'flex',
                                        gap: 12
                                    }}
                                >
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: notif.isRead ? 'normal' : 'bold', marginBottom: 4, fontSize: 14 }}>
                                            {notif.title}
                                        </div>
                                        <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 8 }}>
                                            {notif.message}
                                        </div>
                                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                                            {new Date(notif.timestamp).toLocaleString('ar-SA')}
                                        </div>
                                    </div>
                                    {!notif.isRead && (
                                        <button 
                                            onClick={(e) => handleMarkAsRead(notif.id, e)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: 'var(--color-text-muted)',
                                                cursor: 'pointer',
                                                padding: 4,
                                                height: 'fit-content'
                                            }}
                                            title="تعليم كمقروء"
                                        >
                                            <Check size={16} />
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    <div style={{ borderTop: '1px solid var(--color-border)' }}>
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                navigate('/app/notifications');
                            }}
                            style={{
                                width: '100%',
                                padding: 12,
                                background: 'none',
                                border: 'none',
                                color: 'var(--color-text-primary)',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                textAlign: 'center'
                            }}
                        >
                            عرض كل الإشعارات
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
