import React, { useEffect, useState } from 'react';
import { WalletPage as ShipperWallet } from '../shipper/Wallet';
import { CarrierWallet } from '../carrier/CarrierWallet';
import { authService } from '../../services/api';

export const WalletWrapper = () => {
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
        return <CarrierWallet />;
    }

    return <ShipperWallet />;
};
