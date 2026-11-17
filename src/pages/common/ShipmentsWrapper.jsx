import React, { useEffect, useState } from 'react';
import { MyShipments as ShipperShipments } from '../shipper/MyShipments';
import { CarrierShipments } from '../carrier/CarrierShipments';
import { authService } from '../../services/api';
import { Loader } from '../../components/common/Loader';
import { NotSignedIn } from './NotSignedIn';

export const ShipmentsWrapper = () => {
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
        return <CarrierShipments />;
    }

    return <ShipperShipments />;
};
