import React, { useEffect, useState } from 'react';
import { MyShipments as ShipperShipments } from '../shipper/MyShipments';
import { CarrierShipments } from '../carrier/CarrierShipments';
import { authService } from '../../services/api';

export const ShipmentsWrapper = () => {
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
        return <CarrierShipments />;
    }

    return <ShipperShipments />;
};
