# Arcway — Johnson Residence

A React 19 + React Three Fiber / Three.js prototype: a photoreal 3D kitchen with the Arcway shell (Paper: "Minimal nav — Option 2 · Floating dock") for reviewing the decisions made on a home.

## Run

```sh
npm install
npm run dev
```

Vite prints the URL (it moves past 5173 if that port is busy). `npm run build` checks TypeScript and produces the production build.

## Decisions

- **Hover a decision card** — the camera eases to that part of the kitchen (worktops, cabinets, pendants) and holds until the pointer leaves the card, then returns to wherever you were. Hovering also marks the decision read: its green dot collapses and the "new" counts update.
- **Hover the previous choice** (the muted chip, e.g. White Quartz) — the 3D kitchen previews it and the chip gets a soft outer stroke. Variants: White Quartz / Calacatta Quartz, Sage Shaker / Natural Oak, Hudson / Arteriors Volt.
- **Replace** (late Arteriors Volt pendant) — the Decisions panel is replaced in place by: alternatives (selecting one previews it in 3D) → optional "Help me decide" (3 questions, answers persist) → recommendation. Applying a pendant resolves the deadline warning, updates the pendant card and price, and recalculates the home estimate. Back returns to Decisions at the same scroll position.

Keyboard focus mirrors hover. Escape steps back out of Replace / My things. Reduced-motion preferences snap the camera instead of easing.

## My things

"+" in the dock: paste any HTTP(S) product link → mocked recognition (2.1 s, nothing is fetched) → an approximate HAY CPH 30 table (2.0 × 0.8 × 0.74 m) arrives and the camera reframes the dining area. My things never affect the home estimate.

## Tune

- `src/decisions.ts`: decision log data, finish variants per option, estimate maths.
- `src/replacements.ts`: replacement pendants, questionnaire, and the scoring behind the recommendation.
- `src/main.tsx`: app state — panels, read state, hover focus, previews, replacement and My things flows.
- `src/ui/`: `Shell.tsx` (header with progressive blur, floating dock with hover labels), `DecisionsPanel.tsx`, `ReplacePanel.tsx`, `MyThingsPanel.tsx`, `icons.tsx` (paths from Paper).
- `src/styles.css`: shell styles, values from the Paper design. Fonts: Aktiv Grotesk Corp and Inter load from the local machine (fall back to system-ui elsewhere); Space Grotesk is bundled.
- `src/Kitchen.tsx`: canvas, daylight rig, PCSS soft shadows, post stack, camera rig (focus views, horizontal lens shift that re-centres the room beside the panel).
- `src/kitchen/finishes.ts`: context carrying the finishes the scene renders.
- `src/kitchen/pendants.ts`: pendant models shared by the scene and `productShots.ts` (offscreen studio renders used as product imagery).
- `src/kitchen/textures.ts`, `materials.ts`, `parts.tsx`: procedural PBR maps, material library, primitives (cabinet fronts switch between oak slab and sage shaker).
- `src/kitchen/Architecture.tsx`, `Cabinetry.tsx`, `Island.tsx`, `Accessories.tsx`: room, cabinetry, island with stools and pendants, styling.
- `src/personalItems.ts`, `src/PersonalTable.tsx`: the mock personal item.
