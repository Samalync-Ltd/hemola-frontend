import React, { useEffect, useState } from 'react';
import { WalletPage as ShipperWallet } from '../shipper/Wallet';
import { CarrierWallet } from '../carrier/CarrierWallet';
import { authService } from '../../services/api';
import { Loader } from '../../components/common/Loader';
import { NotSignedIn } from './NotSignedIn';

export const WalletWrapper = () => {
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
        return <CarrierWallet />;
    }

    return <ShipperWallet />;
};
