# The Alder — My things

A React 19 + HeroUI 3 + React Three Fiber / Three.js product-design prototype exploring whether a buyer's own furniture fits in a future home.

## Run

```sh
npm install
npm run dev
```

Open http://127.0.0.1:5173. `npm run build` checks TypeScript and produces the production build.

## First milestone

My things → Paste a product link → Add to my home → recognition sequence → table arrival.

Any valid-looking HTTP(S) product URL uses the same mock HAY CPH 30 oak dining table. Recognition lasts 2.1 seconds. Nothing is fetched from the URL; there are no APIs, backend, accounts, or persistence. Photo upload and manual dimensions are disabled future entry points.

The geometry measures 2.0 × 0.8 × 0.74 metres and is an approximation, not an official product model. It arrives subtly while the camera reframes the foreground dining area. A world-positioned label identifies the object. Personal items are separate from the home configuration, and the home price remains $624,000.

The previous layout, upgrade-pricing, and comparison flows have been removed. The kitchen environment, lighting, bounded orbit/zoom, and collapsible blurred cards are preserved.

Measurements, fit assessment, dragging, dynamic clearance, and final placement confirmation are intentionally deferred.

## Tune

- `src/personalItems.ts`: mock product, metre dimensions, URL validation, separate home configuration.
- `src/PersonalTable.tsx`: replaceable table geometry, placement, entrance and world-space label.
- `src/Kitchen.tsx`: existing environment and camera compositions.
- `src/main.tsx`: flow states, cancellable recognition timers and HeroUI controls.
- `src/styles.css`: compact translucent UI.

Reduced-motion preferences are respected. Reset cancels pending transitions and clears the personal item. Escape closes the My things surface without deleting the object.
