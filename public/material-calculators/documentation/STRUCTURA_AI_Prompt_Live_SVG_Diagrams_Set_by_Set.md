# STRUCTURA AI Master Prompt — Live SVG Diagrams for Material Calculators

## Role

Act as a senior construction quantity-surveying application developer, civil/structural engineering illustrator, SVG interaction engineer, accessibility specialist, and print/PDF report designer for **STRUCTURA — Digital Engineering Office**.

## Main objective

Review the existing STRUCTURA Construction Material Calculator package and replace the static image in the right-hand calculator panel with a calculator-specific, responsive, inline SVG technical diagram. The diagram must change immediately when the user changes relevant numerical or option inputs. Work in six controlled sets and complete each calculator individually within its set.

Do not replace the small 3D rendered icon in the page header. That icon remains a visual identifier. Replace only the large static right-hand “3D quantity model” image with an active SVG technical model.

## Mandatory workflow

1. Read the current calculator HTML and identify every input, unit, formula, assumption, result, route and print rule.
2. Define which inputs alter geometry and which inputs alter annotations, quantities, materials, allowances or construction conditions.
3. Design a calculator-specific SVG rather than reusing one generic diagram.
4. Insert the SVG directly into the HTML as an inline `<svg>` element.
5. Add one `updateDiagram()` function linked to all relevant inputs and selects.
6. Update the SVG before calculation validation so the diagram remains responsive while a value is being edited.
7. Preserve the existing calculation formulas unless a separate calculation error is found and documented.
8. Test the current calculator before continuing to the next calculator.
9. Finish all calculators in one set, package and report the set, then wait for approval before beginning the next set.
10. Never mark an SVG upgrade complete based only on file generation. Open and test it in a browser.

## Global SVG standard

Every live diagram must:

- Use a stable responsive `viewBox`, normally `0 0 760 430`.
- Fill the right-hand panel without excessive empty space.
- Use pure inline SVG, not Canvas, an external image, a screenshot or a base64 image pretending to be SVG.
- Show the construction object or assembly clearly in an isometric, sectional, elevation or plan view appropriate to the calculator.
- Change visible geometry when dimensions change.
- Update all dimension labels immediately.
- Use dimension lines with extension lines and arrowheads.
- Show units alongside values.
- Use sensible visual scaling and clamping so extremely small or large project values remain readable.
- Preserve proportional relationships wherever practical.
- Display an explicit note where visual scaling is diagrammatic rather than to scale.
- Use STRUCTURA colours: blue `#0071BC`, dark blue `#005A96`, neutral concrete greys, steel/rebar brown-red and natural construction-material tones.
- Remain understandable in colour and greyscale printing.
- Avoid overlapping labels, clipped text, hidden arrowheads and dimension text outside the viewBox.
- Include a `<title>` and `<desc>` for accessibility.
- Use readable SVG text rather than raster text.
- Include the SVG in browser print and Save-as-PDF output.
- Work without external JavaScript or CSS libraries.
- Avoid duplicate SVG IDs within a page.

## Interaction requirements

Attach the diagram to every relevant `input` and `select` element.

- Numerical inputs must use the `input` event.
- Select controls must use the `change` event.
- The diagram must change even when “Recalculate when an input changes” is disabled.
- Calculation results may remain manual when live recalculation is disabled, but the geometry must stay live.
- Reset must restore both the form values and the diagram.
- Print must use the latest diagram state.
- Invalid temporary values must not crash the diagram. Use safe fallbacks and clamping.
- Never display `NaN`, `undefined`, `Infinity` or a blank SVG.

## Visual information hierarchy

Each diagram should contain:

1. **Primary model:** the construction object or assembly.
2. **Primary dimensions:** length, width, height, depth, thickness, diameter, slope or spacing.
3. **Secondary components:** openings, pedestal, reinforcement, mortar, laps, formwork faces, layers, framing members or accessories.
4. **Live information callouts:** wastage, quantity, material ratio, formwork condition, allowance or selected option.
5. **Diagram caption:** a short statement identifying which inputs alter the diagram.

Do not put every calculated result into the diagram. Show only information that improves comprehension of the geometry, construction arrangement or material quantity basis.

## Print requirements

- The SVG panel must be visible under `@media print`.
- Give the SVG panel `break-inside: avoid`.
- Remove decorative gradients only when they reduce black-and-white clarity.
- Preserve dimension arrows, lines and labels.
- Use a minimum practical printed text size.
- Do not split the SVG across pages.
- Include a short caption below the diagram.

# Set sequence and calculator-specific SVG requirements

## SET 01 — Foundations

### 1. Foundation Excavation

Show a clear open trench with:

- Total trench length.
- Foundation/base width.
- Working space on both sides.
- Overall excavation width.
- Excavation depth.
- Vertical sides based on the current calculation assumption.
- A highlighted base/foundation zone on the trench floor.
- Bulking allowance and proportion removed from site as live callouts.

Geometry must respond to `length`, `width`, `working` and `depth`. Callouts must respond to `bulking` and `disposal`.

### 2. Random Rubble Foundation Wall

Show an isometric random-rubble masonry wall/foundation with:

- Wall length.
- Average height.
- Average thickness.
- Stone/masonry texture.
- A visible deduction/void when deduction volume is greater than zero.
- Mortar proportion and wastage callouts.

Geometry must respond to `length`, `height`, `thickness` and `openings`.

### 3. Strip Footing

Show a continuous concrete strip with:

- Total run length.
- Footing width.
- Footing thickness.
- Number of identical runs.
- Concrete wastage.
- Nominal mix ratio.

Geometry must respond to `length`, `width`, `thickness` and `qty`. Multiple runs may be shown as repeated outlines plus an exact quantity badge.

### 4. Pad Footing

Show a pad footing and central pedestal with:

- Pad length, width and thickness.
- Pedestal length, width and height.
- Number of identical footings.
- Reinforcement allowance.
- Concrete wastage.

The pedestal must sit visibly on the footing and must not appear detached or floating.

### 5. Ground Beam

Show an isometric reinforced-concrete ground beam with:

- Beam length, width and depth.
- Longitudinal reinforcement representation.
- Beam quantity.
- Reinforcement allowance.
- Formwork mode.

The selected formwork condition must alter the diagram:

- Two sides plus soffit: highlight both side faces and soffit.
- Two sides only: highlight the side faces only.
- Cast against ground: show a ground/blinding support zone and no highlighted soffit form.

### 6. Foundation Reinforcement

Show a reinforcement arrangement with:

- Bar length.
- Bar diameter and cross-section.
- Total bar count.
- Lap allowance zone.
- Bend/hook allowance.
- Cutting waste.
- Additional chairs/starter-bar weight where entered.
- Live unit mass using the calculator’s current formula.

## SET 02 — Masonry

### Brick Wall

Show a wall elevation and thickness/isometric return. Display overall wall length/height, opening deductions, brick/module arrangement, wall thickness, joint thickness and wastage. Openings must resize and remain within the wall.

### Concrete Block Wall

Show block coursing, wall length/height/thickness, opening deductions, block size, mortar joints and wastage. Course and block counts may be shown diagrammatically with exact values in callouts.

### Stone Masonry

Show a stone wall/foundation volume with length, height, thickness, deductions, mortar proportion and wastage. Use a stone texture distinct from brick and block diagrams.

### Masonry Mortar

Show a wall-joint schematic and a material-mix graphic. Display masonry area/volume basis, joint thickness, mortar wet volume, dry-volume factor and cement:sand ratio.

### Wall Ties

Show a cavity-wall section and elevation. Display leaf thicknesses, cavity, tie length, horizontal and vertical spacing, perimeter/opening tie zones and calculated tie count.

### Lintels

Show wall opening, clear span, end bearings, required lintel length, wall thickness, number of lintels/leaves and any selected lintel arrangement.

## SET 03 — Reinforced Concrete

### General Concrete

Show a general rectangular pour whose length, width and depth change. Include quantity, wastage, mix selection and volume callouts.

### Columns

Show an RC column with cross-section and elevation. Display width, depth, height, quantity, formwork faces and reinforcement allowance.

### Beams

Show an RC beam with length, width, depth, soffit and side formwork, longitudinal reinforcement representation and quantity.

### Slabs

Show a slab panel in plan/isometric view with length, width, thickness, quantity, edge formwork and reinforcement allowance.

### Stairs

Show a stair flight and landing. Update rise, going, number of risers, stair width, waist thickness and landing geometry.

### Reinforcement

Show bar schedule geometry, diameter, count, straight length, bends/hooks, laps, shapes and total weight basis.

## SET 04 — Finishes

### Internal Plaster

Show an internal wall elevation with gross dimensions, openings, plaster thickness, number of coats and net finished area.

### External Render

Show an external wall/elevation with openings, render thickness, coat build-up and net area.

### Floor Screed

Show a floor panel with plan dimensions and screed depth. Include falls where the calculator supports them.

### Floor Tiles

Show a tiled floor grid whose tile size, joint width, room dimensions, pattern/orientation and wastage alter the layout.

### Painting

Show a wall/room surface with openings and coat layers. Display gross area, deductions, number of coats, coverage and pack requirement.

### Waterproofing

Show a wet-area floor/wall or membrane sheet with overlap, upstand, number of coats/layers, opening deductions and total treated area.

## SET 05 — Roofing

### Roof Geometry and Pitch

Show a roof section and plan. Update span, run, rise, pitch angle, slope length, ridge and roof area dimensions.

### Timber Roof Frame

Show a truss/rafter framing diagram with span, pitch, spacing, member count and member lengths.

### Steel Roof Frame

Show a steel portal/truss roof frame with span, rise, bay spacing, frame count and member take-off basis.

### Roof Tiles

Show pitched roof planes with tile coursing, tile size, headlap, sidelap, ridge/hip/valley lengths and wastage.

### Metal Roofing Sheets

Show roof sheets with sheet width, cover width, length, side/end laps, purlin support lines and sheet count.

### Gutters and Downpipes

Show a roof edge, gutter run, outlets and downpipes. Update gutter length, outlet spacing, downpipe count and fitting quantities.

## SET 06 — Doors and Windows

### Timber Doors

Show frame and leaf elevation with opening width/height, frame sections, leaf thickness, quantity and timber take-off.

### Aluminium Doors

Show aluminium frame/leaf arrangement with dimensions, profiles, transoms/mullions where applicable, glazing/panel areas and quantity.

### Timber Windows

Show a timber window frame with opening dimensions, mullions, transoms, sash arrangement, section size and quantity.

### Aluminium Windows

Show aluminium window framing with opening dimensions, panel arrangement, mullion/transom lengths, glazing areas and quantity.

### Glass and Glazing

Show glass panels with width, height, thickness, number, edge deductions, pane area and total glass area.

### Ironmongery

Show a door/window schematic with hardware locations. Update hinges, handles, locks, closers, bolts or other selected sets and unit count.

# Testing for each calculator

Test at least:

- Default values.
- Changed valid values.
- Small dimensions.
- Large dimensions.
- Decimal dimensions.
- Zero and temporary invalid input.
- Reset.
- Select-option changes.
- Live diagram while automatic calculation is disabled.
- Mobile width.
- Print media.

Record:

- Whether the SVG exists.
- Whether SVG markup changes after input changes.
- Whether dimension text changes.
- Whether calculation results remain valid.
- Whether page errors occur.
- Whether the diagram fits the panel.
- Whether the diagram appears in print.

# Set deliverables

For every completed set, create:

1. A full working calculator package containing all existing calculators and the upgraded set.
2. A ZIP named `STRUCTURA_Material_Calculators_SVG_Set_XX_<Category>.zip`.
3. Runtime QA JSON.
4. A contact sheet showing the upgraded diagrams with changed test values.
5. A brief change register listing each updated calculator, dynamic fields and test outcome.
6. The six individual updated HTML files in a set-specific Drive folder.

# Acceptance criteria

A calculator passes only when:

- The right panel contains inline SVG instead of the large static 3D image.
- The model is relevant to the calculator.
- Every important geometric input changes geometry or its dimension label.
- Relevant non-geometric inputs update callouts or visible construction conditions.
- No labels overlap materially or leave the viewBox.
- The SVG does not crash for temporary invalid values.
- Results continue to calculate.
- The diagram appears in print/PDF.
- No JavaScript page error occurs.

Begin with **Set 01 — Foundations**, complete the six calculators one by one, package the set and stop for review before Set 02.
