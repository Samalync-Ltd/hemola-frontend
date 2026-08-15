import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { Topbar } from './Topbar';
import styles from './Layout.module.css';
import { authService } from '../../services/api';

const AppLayout = () => {
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        authService.getCurrentUser().then(user => {
            if (!user) {
                navigate('/login');
            } else {
                setIsLoading(false);
            }
        });
    }, [navigate]);

    if (isLoading) return <div>جاري التحميل...</div>;

    return (<div className={styles.layout}>
      <AppSidebar />
      <div className={styles.main}>
        <Topbar />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>);
};
export default AppLayout;
