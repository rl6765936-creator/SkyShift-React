# Catalog identification and specification sources

The authoritative catalog lives in the backend (`VehicleCatalogItems`, 22 rows). The full
image-to-model mapping, the source files and the specification sources are in the backend's
`CATALOG-MANIFEST.md`. The earlier list in this file named the wrong models for most images and
has been replaced.

- Every image is an edited picture with added propellers. No road car shown here can fly.
- Identification (`Identified` / `VisualInspiration`) is separate from specification accuracy.
- Seats and maximum road speed are labelled per value:
  - **Manufacturer specification** (`Verified`): official manufacturer documents.
  - **Illustrative** (`Illustrative`): SkyShift sample data, not a manufacturer specification.

| Id | Image | Model | Seats | Road speed |
|---|---|---|---|---|
| 1 | car-01.webp | Audi Q3 (2nd generation) | 5 Illustrative | 210 Illustrative |
| 2 | car-02.webp | Geely Geometry E (uncertain, visual inspiration) | 5 Illustrative | 150 Illustrative |
| 3 | car-03.webp | Koenigsegg Regera | 2 Illustrative | 400 Illustrative |
| 4 | car-04.webp | Bugatti Chiron Super Sport | 2 Illustrative | 440 Verified |
| 5 | car-05.webp | Tesla Model X | 5 Illustrative | 250 Illustrative |
| 6 | car-06.webp | BMW i Vision Circular (concept) | 4 Verified | 180 Illustrative |
| 7 | car-07.webp | Mercedes-Benz CLE Coupé prototype (uncertain, visual inspiration) | 4 Illustrative | 250 Illustrative |
| 8 | car-08.webp | Mercedes-Benz Concept CLA Class (concept) | 5 Illustrative | 210 Illustrative |
| 9 | car-09.webp | Nissan N7 | 5 Illustrative | 170 Illustrative |
| 10 | car-10.webp | BMW Vision Neue Klasse (concept) | 5 Illustrative | 200 Illustrative |
| 11 | car-11.webp | BMW 5 Series (G30, art livery) | 5 Illustrative | 250 Illustrative |
| 12 | car-12.webp | Lancia Pu+Ra HPE (concept) | 4 Illustrative | 180 Illustrative |
| 13 | car-13.webp | Bestune Xiaoma (uncertain, visual inspiration) | 4 Illustrative | 100 Illustrative |
| 14 | car-14.webp | Toyota Prius Plug-in Hybrid (5th generation) | 5 Illustrative | 175 Illustrative |
| 15 | car-15.webp | Škoda Kodiaq (2nd generation, prototype) | 5 Illustrative | 200 Illustrative |
| 16 | car-16.webp | Maserati GranCabrio (prototype) | 4 Illustrative | 300 Illustrative |
| 17 | car-17.webp | Unidentified hypercar (visual inspiration) | 2 Illustrative | 350 Illustrative |
| 18 | car-18.webp | Mercedes-Benz EQB | 5 Illustrative | 160 Illustrative |
| 19 | car-19.webp | MINI Countryman (3rd generation, prototype) | 5 Verified | 210 Illustrative |
| 20 | car-20.webp | Chery QQ Ice Cream | 4 Illustrative | 100 Illustrative |
| 21 | car-21.webp | MINI Cooper E (3-door) | 4 Verified | 160 Verified |
| 22 | car-22.webp | Peugeot E-3008 | 5 Illustrative | 170 Illustrative |

Verified sources:
- Bugatti Chiron Super Sport, 440 km/h (electronically limited): https://newsroom.bugatti.com/press-releases/bugatti-chiron-super-sport-customers-experience-the-new-hyper-sports-car-for-the-first-time
- BMW i Vision Circular, four seats: https://www.press.bmwgroup.com/usa/article/detail/T0341640EN_US/the-bmw-i-vision-circular
- MINI Countryman C, five seats: https://www.press.bmwgroup.com/slovenia/article/attachment/T0448255SL/628502
- MINI Cooper E, four seats and 160 km/h: https://www.press.bmwgroup.com/global/article/attachment/T0448246EN/628481
