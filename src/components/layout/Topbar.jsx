import React, { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import styles from './Layout.module.css';
import { StatusBadge } from '../common/StatusBadge';
import { authService } from '../../services/api';
import { NotificationCenter } from '../common/NotificationCenter';
import { LanguageSwitch } from '../common/LanguageSwitch';
import { PROFILE_UPDATED_EVENT } from '../../constants/config';
import { useT } from '../../i18n';

export const Topbar = ({ onMenuClick }) => {
    const { t } = useT();
    const [user, setUser] = useState(null);
    useEffect(() => {
        authService.getCurrentUser().then(u => setUser(u));
        // The account page saves profile edits — pick them up without a reload.
        const onProfileUpdated = (e) => setUser(e.detail);
        window.addEventListener(PROFILE_UPDATED_EVENT, onProfileUpdated);
        return () => window.removeEventListener(PROFILE_UPDATED_EVENT, onProfileUpdated);
    }, []);
    return (<header className={styles.topbar}>
      <div className={styles.topbarLeft}>
        <button type="button" className={styles.menuButton} onClick={onMenuClick} aria-label={t('nav.openMenu')}>
          <Menu size={22} />
        </button>
      </div>

      <div className={styles.topbarRight}>
        <LanguageSwitch />
        {user && (<>
            <div className={styles.userInfo}>
              <div className={styles.avatar}>
                {user.companyName ? user.companyName.substring(0, 1) : user.name.substring(0, 1)}
              </div>
              <div className={styles.userText}>
                <span className={styles.userName}>{user.companyName || user.name}</span>
                <span className={styles.userRole}>
                  {t(`enums.accountType.${user.accountType === 'COMPANY' ? 'COMPANY' : 'INDIVIDUAL'}`)}
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
