import React, { useState } from 'react';
import { useT, usePageTitle } from '../../i18n';
import { LanguageSwitch } from '../../components/common/LanguageSwitch';
import { useNavigate, Link } from 'react-router-dom';
import styles from './Auth.module.css';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { authService } from '../../services/api';
import { toUserMessage } from '../../utils/errors';
import { ForgotPasswordModal } from '../../components/auth/ForgotPasswordModal';

export const Login = () => {
    const navigate = useNavigate();
    const { t } = useT();
    usePageTitle('auth.login.pageTitle');
    const [role, setRole] = useState('SHIPPER');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isForgotOpen, setIsForgotOpen] = useState(false);

    const handleRoleChange = (newRole) => {
        setRole(newRole);
        setError('');
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        let identifier = email.trim();
        let pass = password.trim();

        if (!identifier || !pass) {
            setError(t('auth.login.missingFields'));
            return;
        }

        if (identifier.includes('@')) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(identifier)) {
                setError(t('auth.invalidEmail'));
                return;
            }
        } else {
            const phoneStr = identifier.replace(/\s+/g, '');
            if (!/^[+\d]+$/.test(phoneStr) || phoneStr.length < 9) {
                setError(t('auth.login.invalidPhone'));
                return;
            }
            identifier = phoneStr;
        }

        setError('');
        setIsLoading(true);
        try {
            const user = await authService.login(identifier, pass, role);
            if (user.role === 'ADMIN') {
              setError(t('auth.login.adminPortal'));
            } else if (user.accountStatus === 'UNDER_REVIEW') {
              // accountStatus (document review) and isSuspended (the operating
              // ban) are unrelated — this only ever gates on the former, per
              // hemooltak-backend/INTEGRATION.md §6.
              setError(t('auth.login.underReview'));
            } else if (user.accountStatus === 'REJECTED') {
              setError(user.rejectReason ? t('auth.login.rejectedWithReason', { reason: user.rejectReason }) : t('auth.login.rejected'));
            } else {
              navigate('/app');
            }
        }
        catch (err) {
            // Never show Firebase's raw English ("Firebase: Error (auth/…)").
            setError(toUserMessage(err, t('auth.login.failed')));
        }
        finally {
            setIsLoading(false);
        }
    };

    return (<div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.langRow}><LanguageSwitch /></div>
        <div className={styles.logoArea}>
          <img src="/logos/2.png" alt={t('brand.name')} style={{ height: 80, objectFit: 'contain' }} />
          <p className={styles.subtitle}>{t('brand.loginTagline')}</p>
        </div>

        <div className={styles.tabs}>
          <button type="button" className={`${styles.tab} ${role === 'SHIPPER' ? styles.tabActive : ''}`} onClick={() => handleRoleChange('SHIPPER')}>
            {t('auth.roleShipper')}
          </button>
          <button type="button" className={`${styles.tab} ${role === 'CARRIER' ? styles.tabActive : ''}`} onClick={() => handleRoleChange('CARRIER')}>
            {t('auth.roleCarrier')}
          </button>
        </div>

        <form className={styles.form} onSubmit={handleLogin}>
          {error && <div style={{ color: 'var(--color-error)', marginBottom: 16, fontSize: 14, textAlign: 'center' }}>{error}</div>}

          <Input label={t('auth.login.identifier')} placeholder={t('auth.login.identifierPlaceholder')} value={email} onChange={(e) => setEmail(e.target.value)} required/>

          <Input type="password" label={t('auth.password')} placeholder={t('auth.login.passwordPlaceholder')} value={password} onChange={(e) => setPassword(e.target.value)} required/>

          <button
            type="button"
            className={styles.forgotPassword}
            onClick={() => setIsForgotOpen(true)}
            style={{ width: '100%', background: 'none', border: 'none', padding: 0, fontFamily: 'inherit', color: 'var(--color-primary)', cursor: 'pointer' }}
          >
            {t('auth.login.forgot')}
          </button>

          <Button type="submit" style={{ width: '100%' }} size="lg" isLoading={isLoading}>
            {t('auth.signIn')}
          </Button>

          <div className={styles.registerLink}>
            {t('auth.login.noAccount')}
            <Link to="/register">{t('auth.login.createAccount')}</Link>
          </div>
        </form>
      </div>
      <ForgotPasswordModal isOpen={isForgotOpen} onClose={() => setIsForgotOpen(false)} initialEmail={email} />
    </div>);
};
