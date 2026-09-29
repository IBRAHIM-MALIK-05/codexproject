# Stratum Studio

An open-source architectural concept editor with a shared 2D/3D model, a furnished starter residence, and a calm desktop workspace. MIT licensed.

## Run

On Windows, run `powershell -NoProfile -File .\Start-Stratum.ps1` in this directory, then open **http://localhost:4173**. Keep the server window open. This option requires no additional runtime.

Alternatively, with Node.js 20 or newer, run `npm start` (or `node server.mjs`). No dependency installation or build step is needed: Three.js 0.170.0 and OrbitControls are vendored locally.

Any static HTTP server also works. ES modules require HTTP; opening index.html directly with file:// is unsupported. Google Fonts is optional; system fonts are used offline. Models remain in your browser unless you download or open a project file.

## Features

- Interactive WebGL 3D model, orbit/pan/zoom, shaded and wireframe views, and cutaway walls.
- Floor plan and blueprint views generated from the same model.
- Wall drawing with 0.25 m grid snapping and exact numeric editing.
- Door and window placement with parent-wall validation and actual 3D wall openings.
- Parametric furniture library, position, rotation, dimension, and material editing.
- Layer visibility, dimensions, point-to-point measurement, and session camera bookmarks.
- 80-step undo/redo, browser autosave, and validated `.stratum` JSON import/export.
- Layered 2D DXF export in meters, vector SVG drawings, PNG model snapshots, and CSV element quantities.
- Command palette and keyboard shortcuts (see the help button).

## Tests

`npm test` runs 14 pure model and export regression checks, including opening constraints, undo/redo, quantities, import validation, CSV escaping, and DXF geometry output. With the server running, `/browser-tests.html` exercises the UI against the bundled starter project. Use a fresh browser profile for this test. It restores the previous local project afterward.

## Scope and known limitations

This v0.1 is an architectural concept editor, not a complete AutoCAD replacement or certified construction/BIM system. It supports a single ground floor and straight wall segments. It does not implement DWG, IFC, structural calculations, building-code validation, collaboration, wall joins, curved geometry, terrain, or construction documentation standards. DXF exports 2D wall outlines with opening gaps, window/door centerlines, slab boundaries, and furniture footprints; it does not include 3D solids or associative dimensions. SVG is a vector sheet without a guaranteed printed scale. Quantity estimates exclude intersection corrections, finishes, and construction allowances. Resizing the slab does not reposition walls. Named room labels belong to the default 12 × 12 m concept. Objects can be repositioned numerically, not by direct dragging. Saved camera views are session-only.

Professional review is required before using any model, measurement, quantity, or drawing for construction.

## Architecture

Plain JavaScript ES modules and CSS, with Three.js for rendering. `model.js` owns the project schema, validation, history, and quantities. `scene.js` builds the WebGL scene. `plan.js` generates SVG drawings. `exports.js` serializes interoperable outputs. `app.js` connects model changes and UI. `server.mjs` provides a local-only development server. Data units are meters; plan Y corresponds to scene Z.

Three.js and OrbitControls: [official project](https://threejs.org/) / MIT license (see `vendor/LICENSE`). Camera interaction follows the [OrbitControls documentation](https://threejs.org/docs/pages/OrbitControls.html).
