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
        if (!email || !password) {
            setError('الرجاء إدخال جميع البيانات المطلوبة');
            return;
        }
        setError('');
        setIsLoading(true);
        try {
            const user = await authService.login(email, password);
            // Demo logic: navigate based on role
            if (user.role === 'ADMIN')
                navigate('/admin');
            else
                navigate('/app'); // shipper or carrier goes to app
        }
        catch (err) {
            setError(err.message || 'حدث خطأ أثناء تسجيل الدخول');
        }
        finally {
            setIsLoading(false);
        }
    };
    return (<div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logoArea}>
          <img src="/logos/1.png" alt="حمولة" style={{ height: 80, objectFit: 'contain' }} />
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
          
          <Input label="رقم الجوال أو البريد الإلكتروني" placeholder="أدخل البريد الإلكتروني (مثال: info@alnokhba.sa)" value={email} onChange={(e) => setEmail(e.target.value)}/>
          
          <Input type="password" label="كلمة المرور" placeholder="أدخل كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)}/>
          
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
