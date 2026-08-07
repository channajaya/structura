# STRUCTURA AI Work Prompt — Live SVG Diagrams for Remaining Calculator Sets

## Role
Act as a senior construction quantity-surveying calculator developer, civil/structural SVG illustrator, responsive web engineer, accessibility reviewer and STRUCTURA print/PDF designer.

## Source control
Use the approved Set 01 Foundations package as the source. Preserve its calculations, header icons, results, validation, local/offline operation and print styles. Do not overwrite the source package. Produce versioned cumulative packages.

## Mandatory sequence
- Set 02 — Masonry
- Set 03 — Reinforced Concrete
- Set 04 — Finishes
- Set 05 — Roofing
- Set 06 — Doors and Windows

Complete, test, package and register each set before proceeding to the next.

## Required right-panel behaviour
Replace the large static image only. Keep the small 3D header icon. The replacement must be an inline responsive SVG with a stable viewBox. The SVG must update on every numerical `input` event and every select `change` event, even when automatic recalculation is disabled. It must show all input values either through geometry, dimension lines, component count, material layer, spacing grid, callout or note.

Every SVG shall include `<title>` and `<desc>`, dimension arrowheads, engineering units, readable labels, bounded visual scaling, colour and monochrome legibility, mobile responsiveness and A4 print compatibility. No canvas, external image, external runtime library or missing dependency is permitted.

## Calculator-specific diagrams

### 02 Masonry
- **brickWall** — Geometry updates: wall length, height, openings, leaf thickness, brick size, joints, waste and mortar mix.
- **blockWall** — Geometry updates: wall and opening dimensions, block size and thickness, joints, waste and mortar mix.
- **stoneMasonry** — Geometry updates: wall length, height, thickness, opening volume, mortar proportion and waste.
- **mortar** — Batch illustration updates: wet volume, dry factor, mix proportions, bag mass, water ratio and wastage.
- **wallTies** — Tie layout updates: wall size, openings, tie grid, enhanced opening ties, perimeter and spare allowance.
- **lintels** — Geometry updates: clear opening, bearings, lintel material and section, quantity and allowance.

### 03 Reinforced Concrete
- **generalConcrete** — Geometry updates: length, width, depth, quantity, deductions, mix, waste and dry-volume factor.
- **columns** — Geometry updates: column width, depth and height, quantity, concrete waste and reinforcement allowance.
- **beams** — Geometry updates: beam length, width, depth, slab overlap, quantity, waste and reinforcement allowance.
- **slabs** — Geometry updates: slab length, width, thickness, opening area, quantity, waste and reinforcement allowance.
- **stairs** — Geometry updates: stair width, risers, going, rise, waist, landing, waste and reinforcement allowance.
- **reinforcement** — Bar display updates: diameter, length, quantity, lap, bend, cutting waste and optional price.

### 04 Finishes
- **internalPlaster** — Surface updates: wall dimensions, openings, faces, thickness, wastage and plaster mix.
- **externalRender** — Surface updates: external wall dimensions, openings, coats, thickness, wastage and render mix.
- **floorScreed** — Geometry updates: floor length, width, deductions, screed thickness, wastage and mortar mix.
- **floorTiles** — Layout updates: floor dimensions, deductions, tile module, boxes, adhesive and grout assumptions.
- **painting** — Surface updates: dimensions, deductions, faces, coats, coverage, wastage and pack size.
- **waterproofing** — Wet-area model updates: floor, perimeter, upstand, walls, coats, rate, overlap, waste and pack size.

### 05 Roofing
- **roofGeometry** — Roof geometry updates: building dimensions, pitch, eaves and gable overhangs.
- **timberRoof** — Frame updates: building dimensions, pitch, overhang, rafter and batten spacing, section and waste.
- **steelRoof** — Frame updates: building dimensions, pitch, eaves height, frame and purlin spacing, masses and allowance.
- **roofTiles** — Tile layout updates: dimensions, pitch, overhang, tile module, waste, pack and ridge cover.
- **roofSheets** — Sheet layout updates: dimensions, pitch, overhang, cover width, sheet length, end lap and waste.
- **gutters** — Drainage layout updates: eaves length, runs, stock length, downpipe and bracket spacing, height and waste.

### 06 Doors and Windows
- **timberDoors** — Door model updates: dimensions, leaf and frame section, threshold, hinges, quantity and waste.
- **aluminiumDoors** — Door model updates: dimensions, mullions, transoms, profile mass, glazing deduction and waste.
- **timberWindows** — Window model updates: dimensions, mullions, transoms, timber section, quantity, frame area and waste.
- **aluminiumWindows** — Window model updates: dimensions, members, sash factor, profile mass, glazing deduction and waste.
- **glazing** — Pane model updates: dimensions, quantity, deductions, thickness, density, sealant sides and waste.
- **ironmongery** — Hardware schedule updates: door/window counts, hinges, locks, handles, stays, screws and spare allowance.

## Functional acceptance tests
For every calculator test defaults, changed dimensions, decimal input, minimum/maximum visual scaling, temporary zero/invalid values, reset, select changes, automatic calculation on/off, mobile viewport and print media. Confirm the SVG markup and at least one dimension/callout change after input changes; calculated results must remain finite; no browser page error is allowed.

## Deliverables per set
1. Cumulative ZIP package.
2. Six updated standalone HTML calculators.
3. Contact-sheet preview.
4. Runtime test JSON.
5. Build/route test JSON.
6. Change register.
7. Updated SHA-256 checksums.

## Final deliverable
After Set 06, create one cumulative complete package containing all 36 calculators with responsive SVG diagrams and a final QA summary.
