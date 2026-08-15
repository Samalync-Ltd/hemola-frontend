import React, { useEffect, useState } from 'react';
import { TripTrack as ShipperTripTrack } from '../shipper/TripTrack';
import { CarrierTripTrack } from '../carrier/CarrierTripTrack';
import { authService } from '../../services/api';

export const TripTrackWrapper = () => {
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
        return <CarrierTripTrack />;
    }

    return <ShipperTripTrack />;
};
