# STRUCTURA Material Calculators — Final Live SVG QA

All 36 calculators contain calculator-specific inline SVG diagrams in the right-hand panel. The small 3D rendered header icons remain in place.

## Automated checks
- 36 JavaScript files passed Node syntax checking.
- 36 SVG functions generated finite markup.
- 36 diagrams changed after a user input was changed.
- 36 diagrams include SVG title and description elements.
- 36 calculator right panels contain no static image.
- Live input/change hooks and print-compatible SVG CSS are present.

## Release control
This is suitable for internal beta review. Chromium browser execution was blocked by the current managed environment, so final visual interaction, mobile and A4 print preview should be reviewed in a normal browser before production release. Calculator formula, country defaults and product assumptions also require independent QS/engineering review.
