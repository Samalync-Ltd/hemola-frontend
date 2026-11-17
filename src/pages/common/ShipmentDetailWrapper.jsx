import React, { useEffect, useState } from 'react';
import { ShipmentDetail as ShipperShipmentDetail } from '../shipper/ShipmentDetail';
import { CarrierShipmentDetail } from '../carrier/CarrierShipmentDetail';
import { authService } from '../../services/api';
import { Loader } from '../../components/common/Loader';
import { NotSignedIn } from './NotSignedIn';

export const ShipmentDetailWrapper = () => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        authService.getCurrentUser()
            .then(u => setUser(u))
            .finally(() => setIsLoading(false));
    }, []);

    if (isLoading) return <Loader />;
    if (!user) return <NotSignedIn />;

    if (user.role === 'CARRIER') {
        return <CarrierShipmentDetail user={user} />;
    }

    return <ShipperShipmentDetail />;
};
