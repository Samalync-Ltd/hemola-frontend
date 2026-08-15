import React, { useEffect, useState } from 'react';
import { ShipmentDetail as ShipperShipmentDetail } from '../shipper/ShipmentDetail';
import { CarrierShipmentDetail } from '../carrier/CarrierShipmentDetail';
import { authService } from '../../services/api';

export const ShipmentDetailWrapper = () => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        authService.getCurrentUser()
            .then(u => setUser(u))
            .finally(() => setIsLoading(false));
    }, []);

    if (isLoading) return <div>جاري التحميل...</div>;
    if (!user) return <div>لم يتم تسجيل الدخول</div>;

    if (user.role === 'CARRIER') {
        return <CarrierShipmentDetail user={user} />;
    }

    return <ShipperShipmentDetail />;
};
