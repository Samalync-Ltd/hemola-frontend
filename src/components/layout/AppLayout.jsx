import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { Topbar } from './Topbar';
import styles from './Layout.module.css';
import { authService } from '../../services/api';
import { Loader } from '../common/Loader';

const AppLayout = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [accountStatus, setAccountStatus] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        authService.getCurrentUser().then(user => {
            if (!user) {
                navigate('/login');
            } else {
                // A logged-in session (persisted by Firebase Auth) can outlive
                // the login-time check — a direct URL/refresh must not let an
                // UNDER_REVIEW or REJECTED account reach the app either. See
                // hemooltak-backend/INTEGRATION.md §6.
                setAccountStatus(user.accountStatus ?? 'VERIFIED');
                setIsLoading(false);
            }
        });
    }, [navigate]);

    // Close the mobile drawer automatically whenever the route changes.
    useEffect(() => { setIsMenuOpen(false); }, [location.pathname]);

    if (isLoading) return <Loader variant="screen" label="جاري تحميل حسابك" />;

    if (accountStatus === 'UNDER_REVIEW') {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24, textAlign: 'center' }}>
                <div>
                    <h2>حسابك قيد المراجعة</h2>
                    <p className="text-helper">بانتظار موافقة الإدارة لتفعيل الحساب.</p>
                </div>
            </div>
        );
    }
    if (accountStatus === 'REJECTED') {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24, textAlign: 'center' }}>
                <div>
                    <h2>تم رفض الحساب</h2>
                    <p className="text-helper">يرجى التواصل مع دعم المنصة لمزيد من التفاصيل.</p>
                </div>
            </div>
        );
    }

    return (<div className={styles.layout}>
      <AppSidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      {isMenuOpen && <div className={styles.sidebarBackdrop} onClick={() => setIsMenuOpen(false)} />}
      <div className={styles.main}>
        <Topbar onMenuClick={() => setIsMenuOpen(v => !v)} />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>);
};
export default AppLayout;
