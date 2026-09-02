import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { TripMap } from './TripMap';
import { Button } from '../common/Button';

/**
 * Pairs a static-looking map thumbnail (no pan/zoom gestures) with a
 * full-screen, fully interactive map opened on click. Keeps a live embedded
 * interactive map out of every scrolling list/card, which is unnecessary and
 * costly, while still letting the user zoom in when they actually want to.
 *
 * `pickup`/`delivery` are the same for both the thumbnail and the expanded
 * view — callers decide what data is safe to pass (e.g. city-level-only
 * pre-acceptance vs. the real pin post-assignment); this component never
 * upgrades the data just because the user zoomed in.
 */
export const MapThumbnail = ({ pickup, delivery, height = 160, title = 'الخريطة' }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <>
            <div
                onClick={() => setExpanded(true)}
                style={{ position: 'relative', cursor: 'pointer' }}
                role="button"
                aria-label="اضغط لتكبير الخريطة"
            >
                {/* pointerEvents: 'none' keeps the thumbnail's own Leaflet gesture
                    layer from swallowing the click meant for the wrapper above. */}
                <div style={{ pointerEvents: 'none' }}>
                    <TripMap pickup={pickup} delivery={delivery} height={height} interactive={false} />
                </div>
                <div style={{
                    position: 'absolute', bottom: 8, insetInlineEnd: 8,
                    backgroundColor: 'rgba(15,36,64,0.82)', color: 'white',
                    borderRadius: 999, padding: '3px 8px', fontSize: 11, fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: 4,
                }}>
                    🔍 اضغط للتكبير
                </div>
            </div>

            {expanded && createPortal(
                <div
                    style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
                    onClick={() => setExpanded(false)}
                >
                    <div
                        style={{ width: '90vw', maxWidth: 700, height: '80vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-surface, #fff)', borderRadius: 12, overflow: 'hidden' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong>{title}</strong>
                            <Button variant="outline" size="sm" onClick={() => setExpanded(false)}>إغلاق</Button>
                        </div>
                        <div style={{ flex: 1 }}>
                            <TripMap pickup={pickup} delivery={delivery} height="100%" interactive />
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};
