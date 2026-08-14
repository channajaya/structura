# STRUCTURA UK Structural Calculators — staged AI build prompt

## Role

Act as a coordinated team consisting of a UK Chartered Structural Engineer, a calculation-software architect, a numerical verification engineer, a UX designer specialising in graphical engineering software, and a Next.js/TypeScript product engineer.

## Product objective

Build a professional UK small-practice calculator package for domestic extensions, loft conversions, wall removals, structural alterations and small commercial work. The interface must make the load path visually obvious: engineers should see geometry, loads, reactions, force diagrams, deflection and governing utilisation together in one workspace.

The product is not a collection of disconnected forms. Use this shared workflow:

`Load builder → structural analysis → member design → support reaction → masonry bearing/padstone → lower-level support/foundation`

## Non-negotiable engineering controls

1. Maintain a versioned standards register for Eurocodes, UK National Annexes, Approved Document A and relevant UK guidance. Never silently change an equation, coefficient or material property.
2. Every result must carry its assumptions, units, load combination, governing check, data-source version and validation status.
3. Separate characteristic actions, design combinations, analysis results and resistance checks in the calculation model.
4. Implement equations as pure typed functions. UI components must never contain authoritative design equations.
5. Validate every engine against independently prepared hand calculations and, where licensing permits, an established commercial package. Include normal cases, boundary cases, deliberately failing cases and regression tests.
6. Treat the first release as preliminary until a competent UK engineer signs the validation matrix. Display this limitation in the interface and exported reports.
7. Never infer missing safety-critical inputs. Require them, provide a documented default, or block the result with a clear warning.

## Stage 1 — platform foundation

- Define typed units and conversion rules.
- Build a UK National Annex/load-combination service.
- Build a reusable simply-supported beam analysis engine supporting UDLs and point loads.
- Define versioned steel, timber, masonry and soil data interfaces.
- Create a common check result: demand, resistance, utilisation, pass/fail, clause, warning and evidence reference.
- Create a shared visual layer for geometry, dimensions, loads, reactions, shear, moment, deflection and utilisation.
- Create project handoff objects so one calculator can pass actions/reactions to the next without retyping.

Exit gate: unit tests pass; calculation objects are serialisable; no design equations remain in UI code.

## Stage 2 — common graphical workspace

- Use a three-part workbench: inputs, live engineering viewport, results/checks.
- Keep the model visible while inputs change.
- Colour-code permanent actions, variable actions, reactions, pass, warning and fail consistently.
- Provide keyboard-accessible fields, touch targets, unit labels and a clear focus order.
- Add an assumptions panel and calculation-trace panel.
- Add “send to next calculator” actions for the integrated workflow.

Exit gate: responsive at mobile, tablet and desktop widths; all controls have accessible names; reduced-motion preference is respected.

## Stage 3 — Calculator 01: load takedown and tributary loads

- Inputs: beam span, tributary width, permanent/imposed area actions, wall line action, point actions and point position.
- Implement the UK EN 1990 fundamental ULS 6.10a/6.10b envelope with configurable ψ factors and characteristic SLS.
- Outputs: converted line actions, design combinations, reactions, maximum shear and maximum bending moment.
- Visuals: plan tributary strip, elevation, UDL/point arrows, support reactions, SFD and BMD.
- Handoff: pass separated characteristic line and point actions to Calculator 02.

## Stage 4 — Calculator 02: steel beam visual design

- Start with simply supported, laterally restrained UKB members.
- Inputs: characteristic permanent/variable UDLs and point actions, span, point position, steel grade, section and deflection limit.
- Use a licensed/versioned UK section database in production.
- Checks: section classification, bending, shear, high-shear interaction, web bearing/buckling, deflection and lateral torsional buckling where restraint is not proven.
- Visuals: member geometry, supports, loads, reactions, SFD, BMD, deflected shape and utilisation dashboard.
- Handoff: pass separated support reactions and bearing geometry to Calculator 03.

Exit gate: the UI must block a professional “pass” if LTB, bearing or classification checks are outside the implemented scope.

## Stage 5 — Calculator 03: masonry bearing and padstone

- Inputs: design reaction, wall thickness, bearing length/eccentricity, masonry type/strength, wall geometry and spreader type.
- Checks: local concentrated-load resistance, effective bearing area, interaction between nearby loads, wall stability below the load and padstone/steel-spreader design.
- Visuals: beam end, reaction arrow, bearing footprint, stress distribution, masonry courses and proposed spreader dimensions.
- Never apply an enhancement factor without displaying its eligibility assumptions.

## Stage 6 — Calculator 04: timber floor joist/beam

- Inputs: span, spacing, section, C16/C24 or product grade, permanent/imposed area actions, service class, duration, restraint and openings/notches.
- Checks: bending, shear, bearing, lateral stability, instantaneous/final deflection, vibration, notches and holes.
- Visuals: floor plan tributary strip, joist elevation, loads, reactions, SFD, BMD, deflection and serviceability warning zones.

## Stage 7 — Calculator 05: timber roof member

- Modes: common rafter, purlin and structural ridge beam.
- Inputs: roof pitch, member/support span, plan tributary width, permanent roof action, snow/imposed action, wind action, service class and restraint.
- Checks: major/minor-axis bending where relevant, shear, axial component, combined stress, bearing, stability and final deflection.
- Visuals: live roof section, tributary zone, vertical/horizontal reactions, force diagrams and deflected shape.

## Stage 8 — validation and release

- Prepare a calculation validation matrix with source, hand calculation, expected value, software value, tolerance, reviewer and status.
- Add automated regression tests for every validated case.
- Perform dimensional-analysis tests and property-based tests for monotonic behaviour.
- Add an audit trail and calculation version to saved projects and PDF reports.
- Require independent UK engineer review before removing “preliminary beta”.

## Roadmap after the first five

06 foundations; 07 foundations near trees/shrinkable clay; 08 flitch beam; 09 masonry wall panel; 10 steel column/post; 11 windpost; 12 retaining wall; 13 LVL/glulam beam; 14 lintel/load over opening; 15 timber stud; 16 base plate/anchors; 17 simple steel connections; 18 timber racking; 19 steel beam torsion; 20 RC beam; 21 RC slab; 22 RC column; 23 ground beam; 24 piles; 25 pile cap; 26 raft; 27 beam splice; 28 timber connections; 29 small portal frame; 30 RC stair.

## Required response after every implementation stage

Report: files changed, equations/checks implemented, scope intentionally excluded, tests run, validation evidence, remaining safety limitations, and the next stage. Do not claim code compliance until the validation gate and professional review are complete.
