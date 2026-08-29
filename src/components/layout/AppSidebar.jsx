import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Package, Truck, Wallet, User as UserIcon, Plus, X } from 'lucide-react';
import styles from './Layout.module.css';
import { Button } from '../common/Button';
import { authService } from '../../services/api';

export const AppSidebar = ({ isOpen = false, onClose }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        authService.getCurrentUser().then(u => setUser(u));
    }, []);

    const navItems = user?.role === 'CARRIER' 
      ? [
          { label: 'الرئيسية', path: '/app', icon: <Home size={20}/> },
          { label: 'الشحنات', path: '/app/shipments', icon: <Package size={20}/> },
          { label: 'الرحلات', path: '/app/trips', icon: <Truck size={20}/> },
          { label: 'المحفظة', path: '/app/wallet', icon: <Wallet size={20}/> },
          { label: 'الحساب', path: '/app/account', icon: <UserIcon size={20}/> },
        ]
      : [
          { label: 'الرئيسية', path: '/app', icon: <Home size={20}/> },
          { label: 'شحناتي', path: '/app/shipments', icon: <Package size={20}/> },
          { label: 'الرحلات', path: '/app/trips', icon: <Truck size={20}/> },
          { label: 'المحفظة', path: '/app/wallet', icon: <Wallet size={20}/> },
          { label: 'الحساب', path: '/app/account', icon: <UserIcon size={20}/> },
        ];

    return (<aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
      <div className={styles.brand}>
        <img src="/logos/1.png" alt="Hemola Logo" style={{ width: 48, height: 48, borderRadius: '5px', objectFit: 'contain', background: 'transparent' }} />
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <span style={{ fontSize: 24, fontWeight: 700, color: 'white', lineHeight: 1, marginBottom: 4 }}>حمولة</span>
          <span style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.7)' }}>منصة نقل البضائع</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={styles.menuButton}
          aria-label="إغلاق القائمة"
          style={{ color: 'white' }}
        >
          <X size={22} />
        </button>
      </div>

      {user?.role !== 'CARRIER' && (
        <div className={styles.ctaContainer}>
          <Button variant="secondary" style={{ width: '100%' }} onClick={() => navigate('/app/shipments/new')}>
            <Plus size={18} style={{ marginLeft: 8 }}/>
            إنشاء شحنة
          </Button>
        </div>
      )}

      <nav className={styles.nav}>
        {navItems.map((item) => (<NavLink key={item.path} to={item.path} end={item.path === '/app'} className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}>
            <span className="icon">{item.icon}</span>
            {item.label}
          </NavLink>))}
      </nav>
    </aside>);
};
