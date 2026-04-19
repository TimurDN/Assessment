import { Leaf, Package, Recycle, Truck } from "lucide-react";

/**
 * Decorative, on-theme background for the booking flow.
 *
 * Layers (back → front):
 *   1. The base `.bg-hero-gradient` utility (static radial + linear blend).
 *   2. Three soft "aurora" blobs — teal + amber — slowly drifting.
 *   3. A muted dot-grid pattern evoking a delivery-route map, masked
 *      down so it fades out at the viewport edges.
 *   4. Thematic floaters: skip silhouettes (custom SVG), trucks,
 *      packages, a recycle glyph, and a leaf — all at low opacity on
 *      independent drift animations so the page feels alive without
 *      competing with the wizard card.
 *
 * The whole thing is `pointer-events: none` and `aria-hidden` so it
 * cannot trap focus or interfere with wizard interactions. All motion
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

            <div className="float-shape float-shape--skip-1">
                <SkipIcon />
            </div>
            <div className="float-shape float-shape--skip-2">
                <SkipIcon />
            </div>
            <div className="float-shape float-shape--truck-1">
                <Truck width={48} height={48} strokeWidth={1.5} />
            </div>
            <div className="float-shape float-shape--truck-2">
                <Truck width={40} height={40} strokeWidth={1.5} />
            </div>
            <div className="float-shape float-shape--box-1">
                <Package width={36} height={36} strokeWidth={1.5} />
            </div>
            <div className="float-shape float-shape--box-2">
                <Package width={28} height={28} strokeWidth={1.5} />
            </div>
            <div className="float-shape float-shape--recycle-1">
                <Recycle width={44} height={44} strokeWidth={1.5} />
            </div>
            <div className="float-shape float-shape--leaf-1">
                <Leaf width={32} height={32} strokeWidth={1.5} />
            </div>
        </div>
    );
}

/**
 * 2-D side-profile of an open-top skip. Explicit `width`/`height`
 * attributes on the `<svg>` give it an intrinsic size so it cannot
 * balloon beyond what CSS specifies (lesson from the first pass where
 * the browser defaulted to 300×150 before CSS applied).
 */
function SkipIcon() {
    return (
        <svg
            width="60"
            height="34"
            viewBox="0 0 140 80"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M12 22 L128 22 L116 70 L24 70 Z" fillOpacity="0.9" />
            <path d="M8 18 L132 18 L128 26 L12 26 Z" />
            <path
                d="M16 44 L124 44"
                stroke="currentColor"
                strokeOpacity="0.5"
                strokeWidth="1.5"
            />
            <rect x="28" y="70" width="12" height="4" rx="1" />
            <rect x="100" y="70" width="12" height="4" rx="1" />
        </svg>
    );
}
