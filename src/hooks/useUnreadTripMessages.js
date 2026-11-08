import { useEffect, useMemo, useState } from 'react';
import { notificationService } from '../services/api';

// A message and its notification are written in the same backend call, but
// not at the exact same instant.
const CLOCK_SLACK_MS = 10_000;

/**
 * Which of a trip's quick messages the user hasn't seen yet, worked out from
 * the notifications that already exist: every quick message to me creates an
 * unread QUICK_MESSAGE notification for this trip (no backend change needed).
 *
 * Once the messages section has been on screen for a moment, those
 * notifications are marked read — but the "new" marks stay for the rest of
 * this visit so they don't vanish the instant they're seen.
 *
 * Returns { newMessageIds: Set, unreadCount }.
 */
export const useUnreadTripMessages = (trip, myUid, sectionRef) => {
    const [notifications, setNotifications] = useState([]);
    const [highlightSince, setHighlightSince] = useState(null);

    useEffect(() => notificationService.subscribe(setNotifications, () => {}), []);

    const unread = useMemo(() => (trip ? notifications.filter(n =>
        n.type === 'QUICK_MESSAGE' && n.tripId === trip.id && !n.isRead && n.timestamp) : []), [notifications, trip]);

    // Remember the earliest unread one the first time it's seen.
    useEffect(() => {
        if (unread.length === 0) return;
        const earliest = Math.min(...unread.map(n => new Date(n.timestamp).getTime()));
        setHighlightSince(prev => (prev == null ? earliest : Math.min(prev, earliest)));
    }, [unread]);

    // Mark them read once the messages are actually visible.
    useEffect(() => {
        const section = sectionRef.current;
        if (!section || unread.length === 0) return undefined;
        let timer = null;
        const observer = new IntersectionObserver(([entry]) => {
            clearTimeout(timer);
            if (entry.isIntersecting) {
                timer = setTimeout(() => {
                    unread.forEach(n => notificationService.markAsRead(n.id).catch(() => {}));
                }, 1500);
            }
        }, { threshold: 0.4 });
        observer.observe(section);
        return () => { clearTimeout(timer); observer.disconnect(); };
    }, [unread, sectionRef]);

    const newMessageIds = useMemo(() => {
        if (!trip || highlightSince == null) return new Set();
        return new Set((trip.messages || [])
            .filter(m => m.senderId !== myUid && new Date(m.timestamp).getTime() >= highlightSince - CLOCK_SLACK_MS)
            .map(m => m.id));
    }, [trip, myUid, highlightSince]);

    return { newMessageIds, unreadCount: newMessageIds.size };
};
