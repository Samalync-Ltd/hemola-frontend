import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './Auth.module.css';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { authService } from '../../services/api';
export const Login = () => {
    const navigate = useNavigate();
    const [role, setRole] = useState('SHIPPER');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const handleLogin = async (e) => {
        e.preventDefault();
        
        let identifier = email.trim();
        let pass = password.trim();

        if (!identifier || !pass) {
            setError('الرجاء إدخال جميع البيانات المطلوبة');
            return;
        }

        if (identifier.includes('@')) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(identifier)) {
                setError('يرجى إدخال بريد إلكتروني صحيح');
                return;
            }
        } else {
            const phoneStr = identifier.replace(/\s+/g, '');
            if (!/^\d+$/.test(phoneStr) || phoneStr.length < 9) {
                setError('يرجى إدخال رقم جوال صحيح');
                return;
            }
            identifier = phoneStr;
        }

        setError('');
        setIsLoading(true);
        try {
            const user = await authService.login(identifier, pass, role);
            if (user.role === 'ADMIN')
                navigate('/admin');
            else
                navigate('/app'); 
        }
        catch (err) {
            setError(err.message || 'بيانات تسجيل الدخول غير صحيحة');
        }
        finally {
            setIsLoading(false);
        }
    };
    return (<div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logoArea}>
          <img src="/logos/2.png" alt="حمولة" style={{ height: 80, objectFit: 'contain' }} />
          <p className={styles.subtitle}>منصة الشحن اللوجستية المتكاملة</p>
        </div>

        <div className={styles.tabs}>
          <button type="button" className={`${styles.tab} ${role === 'SHIPPER' ? styles.tabActive : ''}`} onClick={() => setRole('SHIPPER')}>
            صاحب شحنة
          </button>
          <button type="button" className={`${styles.tab} ${role === 'CARRIER' ? styles.tabActive : ''}`} onClick={() => setRole('CARRIER')}>
            ناقل
          </button>
        </div>

        <form className={styles.form} onSubmit={handleLogin}>
          {error && <div style={{ color: 'var(--color-error)', marginBottom: 16, fontSize: 14, textAlign: 'center' }}>{error}</div>}
          
          <Input label="رقم الجوال أو البريد الإلكتروني" placeholder="أدخل البريد الإلكتروني (مثال: info@alnokhba.sa)" value={email} onChange={(e) => setEmail(e.target.value)} required/>
          
          <Input type="password" label="كلمة المرور" placeholder="أدخل كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)} required/>
          
          <Link to="#" className={styles.forgotPassword}>نسيت كلمة المرور؟</Link>
          
          <Button type="submit" style={{ width: '100%' }} size="lg" isLoading={isLoading}>
            تسجيل الدخول
          </Button>
          
          <div className={styles.registerLink}>
            ليس لديك حساب؟
            <Link to="/register">إنشاء حساب جديد</Link>
          </div>
        </form>
      </div>
    </div>);
};
