import React from 'react';
import { Card } from '../../components/common/Card';
export const AdminDashboard = () => {
    return (<div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h2 style={{ margin: 0 }}>لوحة تحكم الإدارة</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
        <Card>
          <div className="text-helper">مستخدمين نشطين</div>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: 'var(--color-primary)' }}>1,245</div>
        </Card>
        <Card>
          <div className="text-helper">شحنات جارية</div>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: 'var(--color-primary)' }}>84</div>
        </Card>
        <Card>
          <div className="text-helper">طلبات انضمام معلقة</div>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: 'var(--color-accent)' }}>12</div>
        </Card>
        <Card>
          <div className="text-helper">إجمالي الإيرادات (هذا الشهر)</div>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: 'var(--color-success)' }}>45,200 ر.س</div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <Card>
          <h3 style={{ marginBottom: 16 }}>النشاط الأخير</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[1, 2, 3].map(i => (<div key={i} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 16, borderBottom: i !== 3 ? '1px solid var(--color-border)' : 'none' }}>
                <div>
                  <strong>تم اكتمال الرحلة TRP-00{i}</strong>
                  <div className="text-helper" style={{ marginTop: 4 }}>الناقل: شركة النقل السريع</div>
                </div>
                <span className="text-helper">منذ {i * 2} ساعة</span>
              </div>))}
          </div>
        </Card>

        <Card>
          <h3 style={{ marginBottom: 16 }}>تنبيهات النظام</h3>
          <div style={{ padding: 12, backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 8, color: 'var(--color-error)' }}>
            <strong>انتباه</strong>
            <p style={{ margin: '4px 0 0', fontSize: 13 }}>يوجد تأخير في الشحنة SHP-109 (تجاوزت الوقت المتوقع).</p>
          </div>
        </Card>
      </div>
    </div>);
};
