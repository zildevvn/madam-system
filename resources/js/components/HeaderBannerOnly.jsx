import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import HeaderBanner from './Header/HeaderBanner';
import { useNotificationSystem } from '../hooks/useNotificationSystem';
import { BANNER_PAGES } from '../config/navigation';
import { matchAnyRoute } from '../shared/utils/routeUtils';

/**
 * HeaderBannerOnly Component
 * [WHY] Isolated component focused solely on rendering the notification banner (e.g. for kitchen/billing full screen screens).
 * Avoids mixing multiple layout responsibilities inside the main Header component.
 */
export default function HeaderBannerOnly() {
    const location = useLocation();
    const { user } = useAppSelector(state => state.auth);

    // Business Logic - Offloaded to Custom Hook
    const {
        hasNewNotification,
        latestMessage,
        socketSequence
    } = useNotificationSystem(user);

    const showBanner = matchAnyRoute(location.pathname, BANNER_PAGES) && hasNewNotification && latestMessage;

    // Side effect: manage layout data attribute on document element
    useEffect(() => {
        document.documentElement.dataset.hasBanner = showBanner ? 'true' : 'false';
        return () => {
            document.documentElement.removeAttribute('data-has-banner');
        };
    }, [showBanner]);

    return (
        <div className="fixed top-0 left-0 right-0 z-[100] font-primary">
            {showBanner && <HeaderBanner key={`banner-${latestMessage?.id}-${socketSequence}`} />}
        </div>
    );
}
