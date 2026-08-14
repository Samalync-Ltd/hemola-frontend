import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { Topbar } from './Topbar';
import styles from './Layout.module.css';
const AppLayout = () => {
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
