import React, { useEffect, useState } from 'react';
import { Negotiation } from '../shipper/Negotiation';
import { authService } from '../../services/api';
import { Loader } from '../../components/common/Loader';
import { NotSignedIn } from './NotSignedIn';

// The negotiation thread itself is one shared component (see Negotiation.jsx)
// — only the viewer's role differs, same pattern as DashboardWrapper etc.
export const NegotiationWrapper = () => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        authService.getCurrentUser()
            .then(u => setUser(u))
            .finally(() => setIsLoading(false));
    }, []);

    if (isLoading) return <Loader />;
    if (!user) return <NotSignedIn />;

    return <Negotiation role={user.role} />;
};
