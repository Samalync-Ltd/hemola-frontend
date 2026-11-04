import React, { useEffect, useState } from 'react';
import { Dashboard as ShipperDashboard } from '../shipper/Dashboard';
import { CarrierDashboard } from '../carrier/CarrierDashboard';
import { authService } from '../../services/api';
import { Loader } from '../../components/common/Loader';

export const DashboardWrapper = () => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        authService.getCurrentUser()
            .then(u => setUser(u))
            .finally(() => setIsLoading(false));
    }, []);

    if (isLoading) return <Loader />;
    if (!user) return <div>لم يتم تسجيل الدخول</div>;

    if (user.role === 'CARRIER') {
        return <CarrierDashboard />;
    }

    return <ShipperDashboard />;
};
