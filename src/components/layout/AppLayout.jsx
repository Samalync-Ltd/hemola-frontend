import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { Topbar } from './Topbar';
import styles from './Layout.module.css';
import { authService } from '../../services/api';

const AppLayout = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        authService.getCurrentUser().then(user => {
            if (!user) {
                navigate('/login');
            } else {
                setIsLoading(false);
            }
        });
    }, [navigate]);

    // Close the mobile drawer automatically whenever the route changes.
    useEffect(() => { setIsMenuOpen(false); }, [location.pathname]);

    if (isLoading) return <div>جاري التحميل...</div>;

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
