import React from 'react';
import { Truck } from 'lucide-react';

// Small inline drawings for the public pages: no image requests, they scale
// crisply and they take the brand colors from CSS. All are decorative
// (aria-hidden); the text next to them carries the meaning.

/** Store logos (Simple Icons, CC0). */
export const AppleLogo = (props) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...props}>
        <path fill="currentColor" d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
);

export const GooglePlayLogo = (props) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...props}>
        <path fill="currentColor" d="M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 0 1 0 2.594zM1.337.924a1.486 1.486 0 0 0-.112.568v21.017c0 .217.045.419.124.6l11.155-11.087L1.337.924zm12.207 10.065l3.258-3.238L3.45.195a1.466 1.466 0 0 0-.946-.179l11.04 10.973zm0 2.067l-11 10.933c.298.036.612-.016.906-.183l13.324-7.54-3.23-3.21z" />
    </svg>
);

/**
 * A dashed route between two points — the same dashed line the platform's
 * trip map draws between pickup and delivery. Used as a background motif.
 */
export const RouteLine = ({ className }) => (
    <svg className={className} viewBox="0 0 600 300" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path d="M-20 250 C 120 250, 160 90, 300 120 S 480 40, 620 60" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="2 10" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
);

/**
 * The "Live tracking" card's drawing: pickup, a truck on the way, delivery.
 * Pin colors match the platform's map (navy pickup, green delivery, amber truck).
 */
export const TrackingArt = ({ className }) => (
    <svg className={className} viewBox="0 0 320 150" aria-hidden="true" focusable="false">
        <defs>
            <pattern id="trackGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M20 0H0V20" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
            </pattern>
        </defs>
        <rect width="320" height="150" rx="14" fill="url(#trackGrid)" />
        <path d="M44 112 C 110 112, 120 44, 180 56 S 250 40, 276 38" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="3" strokeDasharray="1 9" strokeLinecap="round" />
        {/* pickup */}
        <g transform="translate(44 112)">
            <circle r="13" fill="#fff" />
            <circle r="7" fill="#0F2440" />
        </g>
        {/* delivery */}
        <g transform="translate(276 38)">
            <circle r="13" fill="#fff" />
            <circle r="7" fill="#10B981" />
        </g>
        {/* truck, with the live pulse */}
        <g transform="translate(160 64)">
            <circle className="trackPulse" r="18" fill="rgba(255,122,41,0.35)" />
            <circle r="15" fill="#FF7A29" stroke="#fff" strokeWidth="3" />
            <Truck x={-8} y={-8} width={16} height={16} color="#fff" strokeWidth={2.2} />
        </g>
    </svg>
);
