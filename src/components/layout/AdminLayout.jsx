import React from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { Topbar } from './Topbar';
import styles from './Layout.module.css';
const AdminLayout = () => {
    return (<div className={styles.layout}>
      <AdminSidebar />
      <div className={styles.main}>
        <Topbar />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>);
};
export default AdminLayout;
