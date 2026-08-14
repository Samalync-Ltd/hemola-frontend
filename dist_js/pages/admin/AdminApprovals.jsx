import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
export const AdminApprovals = () => {
    const [approvals, setApprovals] = useState([
        { id: 'REQ-001', name: 'مؤسسة النقل السريع', type: 'شركة', role: 'ناقل', status: 'PENDING', date: '2023-10-25' },
        { id: 'REQ-002', name: 'أحمد محمد', type: 'فرد', role: 'صاحب شحنة', status: 'PENDING', date: '2023-10-26' }
    ]);
    const handleApprove = (id) => {
        setApprovals(approvals.filter(a => a.id !== id));
        alert(`تمت الموافقة على الطلب ${id}`);
    };
    const handleReject = (id) => {
        setApprovals(approvals.filter(a => a.id !== id));
        alert(`تم رفض الطلب ${id}`);
    };
    const columns = [
        { key: 'id', header: 'رقم الطلب', render: (a) => <strong>{a.id}</strong> },
        { key: 'name', header: 'الاسم', render: (a) => a.name },
        { key: 'type', header: 'النوع', render: (a) => a.type },
        { key: 'role', header: 'الدور', render: (a) => a.role },
        { key: 'date', header: 'تاريخ الطلب', render: (a) => a.date },
        { key: 'status', header: 'الحالة', render: (a) => <StatusBadge status={a.status}/> },
        {
            key: 'actions',
            header: 'الإجراء',
            render: (a) => (<div style={{ display: 'flex', gap: 8 }}>
          <Button size="sm" onClick={() => handleApprove(a.id)}>قبول</Button>
          <Button size="sm" variant="danger" onClick={() => handleReject(a.id)}>رفض</Button>
        </div>)
        }
    ];
    return (<div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h2 style={{ margin: 0 }}>طلبات الانضمام</h2>
      
      <Card>
        <DataTable data={approvals} columns={columns} keyExtractor={a => a.id} emptyMessage="لا توجد طلبات معلقة"/>
      </Card>
    </div>);
};
