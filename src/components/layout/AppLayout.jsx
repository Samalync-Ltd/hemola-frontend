import React, { useEffect, useState } from 'react';
import { useT, usePageTitle } from '../../i18n';
import { LanguageSwitch } from '../common/LanguageSwitch';
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
    const { t } = useT();
    usePageTitle('brand.pageTitle');

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

    if (isLoading) return <Loader variant="screen" label={t('layout.loadingAccount')} />;

    if (accountStatus === 'UNDER_REVIEW') {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, minHeight: '100vh', padding: 24, textAlign: 'center' }}>
                <LanguageSwitch />
                <div>
                    <h2>{t('layout.underReviewTitle')}</h2>
                    <p className="text-helper">{t('layout.underReviewText')}</p>
                </div>
            </div>
        );
    }
    if (accountStatus === 'REJECTED') {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, minHeight: '100vh', padding: 24, textAlign: 'center' }}>
                <LanguageSwitch />
                <div>
                    <h2>{t('layout.rejectedTitle')}</h2>
                    <p className="text-helper">{t('layout.rejectedText')}</p>
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
