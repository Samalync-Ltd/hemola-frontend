import { useEffect, useRef, useState } from 'react';

/**
 * True for a moment whenever `ids` gains an id it didn't have before — so
 * the bell shakes when something new arrives, but not on the first load or
 * when an item is merely read/handled. Pass null until the first data.
 */
export const useShakeOnNew = (ids, durationMs = 800) => {
    const seen = useRef(null);
    const [isShaking, setIsShaking] = useState(false);
    const key = ids ? ids.join('|') : null;

    useEffect(() => {
        if (key === null) return undefined;
        const current = key ? key.split('|') : [];
        if (seen.current === null) {
            seen.current = new Set(current);
            return undefined;
        }
        const hasNew = current.some((id) => !seen.current.has(id));
        current.forEach((id) => seen.current.add(id));
        if (!hasNew) return undefined;
        setIsShaking(true);
        const timer = setTimeout(() => setIsShaking(false), durationMs);
        return () => clearTimeout(timer);
    }, [key, durationMs]);

    return isShaking;
};
