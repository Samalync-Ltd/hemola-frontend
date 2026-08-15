import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import styles from './Layout.module.css';
import { StatusBadge } from '../common/StatusBadge';
import { authService } from '../../services/api';
import { NotificationCenter } from '../common/NotificationCenter';
export const Topbar = () => {
    const [user, setUser] = useState(null);
    useEffect(() => {
        // Demo: fetch current user
        authService.getCurrentUser().then(u => setUser(u));
    }, []);
    return (<header className={styles.topbar}>
      <div className={styles.topbarLeft}>
        <h2 style={{ margin: 0 }}>{/* Dynamic Page Title could go here */}</h2>
      </div>
      
      <div className={styles.topbarRight}>
        {user && (<>
            <div className={styles.userInfo}>
              <div className={styles.avatar}>
                {user.companyName ? user.companyName.substring(0, 1) : user.name.substring(0, 1)}
              </div>
              <div className={styles.userText}>
                <span className={styles.userName}>{user.companyName || user.name}</span>
                <span className={styles.userRole}>
                  {user.accountType === 'COMPANY' ? 'شركة / منشأة' : 'فرد'}
                </span>
              </div>
            </div>
            
            <StatusBadge status={user.accountStatus}/>
            
            <div style={{ width: 1, height: 24, backgroundColor: 'var(--color-border)', margin: '0 8px' }}></div>
            
            <NotificationCenter />
          </>)}
      </div>
    </header>);
};
