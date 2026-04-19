/**
 * Decorative, on-theme background for the booking flow.
 *
 * Layers (back → front):
 *   1. The base `.bg-hero-gradient` utility (static radial + linear blend).
 *   2. Three soft "aurora" blobs — teal + amber — slowly drifting.
 *   3. A muted dot-grid pattern evoking a delivery-route map.
 *   4. A few low-opacity skip silhouettes floating independently.
 *
 * The whole thing is `pointer-events: none` and `aria-hidden` so it
 * cannot trap focus or interfere with wizard interactions. Animation
 * uses `transform`/`opacity` only and is disabled via the
 * `prefers-reduced-motion` media query in `globals.css`.
 */
export function BackgroundMesh() {
    return (
        <div
            aria-hidden
            data-testid="background-mesh"
            className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-hero-gradient"
        >
            <div className="absolute inset-0">
                <div className="aurora-blob aurora-blob-1" />
                <div className="aurora-blob aurora-blob-2" />
                <div className="aurora-blob aurora-blob-3" />
            </div>

            <div className="absolute inset-0 bg-dotgrid" />

            <SkipSilhouette className="skip-shape skip-shape-1" />
            <SkipSilhouette className="skip-shape skip-shape-2" />
            <SkipSilhouette className="skip-shape skip-shape-3" />
        </div>
    );
}

/**
 * 2-D side-profile of an open-top skip — a flattened trapezoid with a
 * narrow top lip. Uses `currentColor` so the owning class decides the tint.
 */
function SkipSilhouette({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 140 80"
            className={className}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Body */}
            <path
                d="M12 22 L128 22 L116 70 L24 70 Z"
                fill="currentColor"
                fillOpacity="0.9"
            />
            {/* Top lip */}
            <path
                d="M8 18 L132 18 L128 26 L12 26 Z"
                fill="currentColor"
            />
            {/* Horizontal rib */}
            <path
                d="M16 44 L124 44"
                stroke="currentColor"
                strokeOpacity="0.4"
                strokeWidth="1.5"
            />
            {/* Skid rails */}
            <rect x="28" y="70" width="12" height="4" rx="1" fill="currentColor" />
            <rect x="100" y="70" width="12" height="4" rx="1" fill="currentColor" />
        </svg>
    );
}
