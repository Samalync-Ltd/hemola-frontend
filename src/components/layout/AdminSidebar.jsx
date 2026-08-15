import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, CheckSquare, BarChart } from 'lucide-react';
import styles from './Layout.module.css';
export const AdminSidebar = () => {
    const navItems = [
        { label: 'لوحة التحكم', path: '/admin', icon: <Home size={20}/> },
        { label: 'طلبات الانضمام', path: '/admin/approvals', icon: <CheckSquare size={20}/> },
        { label: 'المستخدمين', path: '/admin/users', icon: <Users size={20}/> },
        { label: 'التقارير', path: '/admin/reports', icon: <BarChart size={20}/> },
    ];
    return (<aside className={styles.sidebar} style={{ backgroundColor: '#0A192F' }}>
      <div className={styles.brand}>
        <img src="/logos/2.png" alt="Hemola Logo" style={{ width: 48, height: 48, objectFit: 'contain', background: 'transparent' }} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 24, fontWeight: 700, color: 'white', lineHeight: 1, marginBottom: 4 }}>حمولة</span>
          <span style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.7)' }}>منصة نقل البضائع</span>
        </div>
      </div>

      <nav className={styles.nav} style={{ marginTop: 24 }}>
        {navItems.map((item) => (<NavLink key={item.path} to={item.path} end={item.path === '/admin'} className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}>
            <span className="icon">{item.icon}</span>
            {item.label}
          </NavLink>))}
      </nav>
    </aside>);
};
