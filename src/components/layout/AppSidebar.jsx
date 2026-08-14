import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Package, Truck, Wallet, User as UserIcon, Plus } from 'lucide-react';
import styles from './Layout.module.css';
import { Button } from '../common/Button';
export const AppSidebar = () => {
    const navigate = useNavigate();
    const navItems = [
        { label: 'الرئيسية', path: '/app', icon: <Home size={20}/> },
        { label: 'شحناتي', path: '/app/shipments', icon: <Package size={20}/> },
        { label: 'الرحلات', path: '/app/trips', icon: <Truck size={20}/> },
        { label: 'المحفظة', path: '/app/wallet', icon: <Wallet size={20}/> },
        { label: 'الحساب', path: '/app/account', icon: <UserIcon size={20}/> },
    ];
    return (<aside className={styles.sidebar}>
      <div className={styles.brand}>
        {/* Mock Logo */}
        <div style={{ width: 32, height: 32, backgroundColor: '#FF7A29', borderRadius: 8 }}></div>
        <h2 className={styles.logoText}>حمولة</h2>
      </div>

      <div className={styles.ctaContainer}>
        <Button variant="secondary" style={{ width: '100%' }} onClick={() => navigate('/app/shipments/new')}>
          <Plus size={18} style={{ marginLeft: 8 }}/>
          إنشاء شحنة
        </Button>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => (<NavLink key={item.path} to={item.path} end={item.path === '/app'} className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}>
            <span className="icon">{item.icon}</span>
            {item.label}
          </NavLink>))}
      </nav>
    </aside>);
};
