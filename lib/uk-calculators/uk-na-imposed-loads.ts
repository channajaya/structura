export type UkNaImposedRule = "fixed" | "room-minimum" | "storage-height" | "roof-pitch";

export type UkNaImposedLoad = {
  code: string;
  group: string;
  label: string;
  description: string;
  rule: UkNaImposedRule;
  qkKnM2?: number;
  concentratedKn?: number;
  minimumQkKnM2?: number;
  perHeightKnM3?: number;
  note?: string;
};

const fixed = (
  code: string,
  group: string,
  label: string,
  description: string,
  qkKnM2: number,
  concentratedKn?: number,
  note?: string,
): UkNaImposedLoad => ({ code, group, label, description, rule: "fixed", qkKnM2, concentratedKn, note });

export const UK_NA_IMPOSED_LOADS: UkNaImposedLoad[] = [
  fixed("A1", "A - Domestic and residential", "Self-contained dwelling", "All uses within a self-contained family dwelling or qualifying modular student unit.", 1.5, 2),
  fixed("A2", "A - Domestic and residential", "Bedrooms and dormitories", "Bedrooms and dormitories outside self-contained family dwellings, hotels and motels.", 1.5, 2),
  fixed("A3", "A - Domestic and residential", "Hotel bedrooms, wards and toilets", "Hotel or motel bedrooms, hospital wards and toilet areas.", 2, 2),
  fixed("A4", "A - Domestic and residential", "Billiard or snooker room", "Rooms used for billiards or snooker.", 2, 2.7),
  fixed("A5", "A - Domestic and residential", "Dwelling balcony / limited-use flats communal", "Single-family dwelling balconies and qualifying limited-use communal areas in blocks of flats.", 2.5, 2),
  { code: "A6", group: "A - Domestic and residential", label: "Hostel / guest house balcony", description: "Balconies in hostels, guest houses and residential clubs, plus communal flat areas outside A5.", rule: "room-minimum", minimumQkKnM2: 3, concentratedKn: 2, note: "Use the room qk where higher; concentrated action acts at the outer edge." },
  { code: "A7", group: "A - Domestic and residential", label: "Hotel or motel balcony", description: "Balconies serving hotels and motels.", rule: "room-minimum", minimumQkKnM2: 4, concentratedKn: 2, note: "Use the room qk where higher; concentrated action acts at the outer edge." },

  fixed("B1", "B - Offices", "General office floor", "General office use other than areas covered by B2.", 2.5, 2.7),
  fixed("B2", "B - Offices", "Office at or below ground floor", "Office areas at or below ground-floor level.", 3, 2.7),

  fixed("C11", "C1 - Areas with tables", "Dining, lounge, cafe or restaurant", "Public, institutional and communal dining rooms or lounges, cafes and restaurants.", 2, 3, "Use C4 or C5 where physical activity or overcrowding is possible."),
  fixed("C12", "C1 - Areas with tables", "Reading room without book storage", "Reading rooms where books are not stored.", 2.5, 4),
  fixed("C13", "C1 - Areas with tables", "Classroom", "Teaching rooms used as classrooms.", 3, 3),
  fixed("C21", "C2 - Fixed seating", "Assembly area with fixed seats", "Assembly areas where removal of the fixed seating is improbable.", 4, 3.6),
  fixed("C22", "C2 - Fixed seating", "Place of worship", "Places of worship not otherwise classified for large crowds.", 3, 2.7),
  fixed("C31", "C3 - Moving people", "Non-crowded institutional corridor", "Institutional corridors, hostels and similar communal circulation not exposed to crowds or wheeled vehicles.", 3, 4.5),
  fixed("C32", "C3 - Moving people", "Non-crowded institutional stair", "Institutional stairs and landings, hostels and similar circulation not exposed to crowds or wheeled vehicles.", 3, 4),
  fixed("C33", "C3 - Moving people", "Crowded corridor or hallway", "Corridors, hallways and aisles exposed to crowds and not covered by C31 or C32.", 4, 4.5),
  fixed("C34", "C3 - Moving people", "Corridor with wheeled traffic", "Corridors, hallways and aisles exposed to wheeled vehicles such as trolleys.", 5, 4.5),
  fixed("C35", "C3 - Moving people", "Crowded stair or landing", "Stairs and landings exposed to crowds and not covered by C31 or C32.", 4, 4),
  fixed("C36", "C3 - Moving people", "Light-duty walkway", "Single-person access walkway, approximately 600 mm wide.", 3, 2),
  fixed("C37", "C3 - Moving people", "General-duty walkway", "Walkway with regular two-way pedestrian traffic.", 5, 3.6),
  fixed("C38", "C3 - Moving people", "Heavy-duty / escape walkway", "Walkway with high-density pedestrian traffic, including escape routes.", 7.5, 4.5),
  fixed("C39", "C3 - Moving people", "Museum or art gallery floor", "Museum floors and art galleries used for exhibition.", 4, 4.5),
  fixed("C41", "C4 - Physical activities", "Dance hall, gymnasium or stage", "Dance halls, studios, gymnasia and stages.", 5, 3.6, "Check dynamic response and resonance where applicable."),
  fixed("C42", "C4 - Physical activities", "Drill hall or drill room", "Drill halls and drill rooms.", 5, 7, "Check dynamic response and resonance where applicable."),
  fixed("C51", "C5 - Large crowds", "Assembly without fixed seating", "Concert halls, bars, assembly areas and places of worship susceptible to large crowds.", 5, 3.6, "The relevant certifying authority may impose additional requirements."),
  fixed("C52", "C5 - Large crowds", "Public assembly stage", "Stages in public assembly areas.", 7.5, 4.5, "Check dynamic response and resonance where applicable."),

  fixed("D1", "D - Shopping", "General retail shop", "Areas in general retail shops.", 4, 3.6),
  fixed("D2", "D - Shopping", "Department store", "Areas in department stores.", 4, 3.6),

  fixed("E11", "E1 - Storage", "Static equipment in public building", "General areas for static equipment in institutional and public buildings.", 2, 1.8),
  fixed("E12", "E1 - Storage", "Reading room with book storage", "Reading rooms that include book storage, such as libraries.", 4, 4.5),
  { code: "E13", group: "E1 - Storage", label: "General storage", description: "General storage not covered by a more specific subcategory.", rule: "storage-height", perHeightKnM3: 2.4, concentratedKn: 7, note: "Confirm a more specific value with the client where possible." },
  fixed("E14", "E1 - Storage", "Office file room", "File rooms and filing or storage spaces in offices.", 5, 4.5),
  { code: "E15", group: "E1 - Storage", label: "Book stack room", description: "Rooms containing fixed book stacks.", rule: "storage-height", perHeightKnM3: 2.4, minimumQkKnM2: 6.5, concentratedKn: 7 },
  { code: "E16", group: "E1 - Storage", label: "Paper or stationery storage", description: "Paper storage for printing plants and stationery stores.", rule: "storage-height", perHeightKnM3: 4, concentratedKn: 9 },
  { code: "E17", group: "E1 - Storage", label: "Dense mobile book stacking - public", description: "Dense mobile book stacking on trolleys in public and institutional buildings.", rule: "storage-height", perHeightKnM3: 4.8, minimumQkKnM2: 9.6, concentratedKn: 7 },
  { code: "E18", group: "E1 - Storage", label: "Dense mobile book stacking - warehouse", description: "Dense mobile book stacking on trucks in warehouses.", rule: "storage-height", perHeightKnM3: 4.8, minimumQkKnM2: 15, concentratedKn: 7 },
  { code: "E19", group: "E1 - Storage", label: "Cold storage", description: "Cold-storage floor areas.", rule: "storage-height", perHeightKnM3: 5, minimumQkKnM2: 15, concentratedKn: 9 },

  fixed("F", "F/G - Vehicle areas", "Light-vehicle traffic area", "Traffic areas for vehicles with gross vehicle weight not exceeding 30 kN.", 2.5, 10, "The UDL qk and concentrated Qk are not applied simultaneously."),
  fixed("G", "F/G - Vehicle areas", "Medium-vehicle traffic area", "Traffic areas for vehicles above 30 kN and not exceeding 160 kN gross weight.", 5, undefined, "Concentrated action is determined for the specific use; qk and Qk are not applied simultaneously."),

  { code: "H", group: "H - Roofs", label: "Maintenance-only roof", description: "Roof not accessible except for normal maintenance and repair.", rule: "roof-pitch", concentratedKn: 0.9, note: "Roof loads act vertically. Snow, wind, thermal actions and plant are separate." },
];

export const UK_NA_IMPOSED_GROUPS = Array.from(new Set(UK_NA_IMPOSED_LOADS.map((item) => item.group)));
export const UK_NA_IMPOSED_LOAD_COUNT = UK_NA_IMPOSED_LOADS.length;

if (UK_NA_IMPOSED_LOAD_COUNT !== 41) {
  throw new Error(`UK NA imposed-load selector must contain 41 options; found ${UK_NA_IMPOSED_LOAD_COUNT}.`);
}

export function getUkNaImposedLoad(code: string) {
  return UK_NA_IMPOSED_LOADS.find((item) => item.code === code);
}

export function resolveUkNaImposedLoad(
  load: UkNaImposedLoad,
  inputs: { roomQkKnM2?: number; storageHeightM?: number; roofPitchDeg?: number } = {},
) {
  let qkKnM2 = load.qkKnM2 ?? 0;
  let formula = `${qkKnM2.toFixed(2)} kN/m2`;

  if (load.rule === "room-minimum") {
    const roomQk = Math.max(0, inputs.roomQkKnM2 ?? 1.5);
    const minimum = load.minimumQkKnM2 ?? 0;
    qkKnM2 = Math.max(roomQk, minimum);
    formula = `max(room qk ${roomQk.toFixed(2)}, minimum ${minimum.toFixed(2)})`;
  } else if (load.rule === "storage-height") {
    const height = Math.max(0, inputs.storageHeightM ?? 2.4);
    const rate = load.perHeightKnM3 ?? 0;
    const minimum = load.minimumQkKnM2 ?? 0;
    qkKnM2 = Math.max(rate * height, minimum);
    formula = minimum > 0
      ? `max(${rate.toFixed(2)} x ${height.toFixed(2)} m, ${minimum.toFixed(2)})`
      : `${rate.toFixed(2)} x ${height.toFixed(2)} m`;
  } else if (load.rule === "roof-pitch") {
    const pitch = Math.max(0, Math.min(90, inputs.roofPitchDeg ?? 0));
    qkKnM2 = pitch < 30 ? 0.6 : pitch < 60 ? 0.6 * (60 - pitch) / 30 : 0;
    formula = pitch < 30
      ? "0.60 (pitch < 30 deg)"
      : pitch < 60
        ? `0.60 x (60 - ${pitch.toFixed(1)}) / 30`
        : "0.00 (pitch >= 60 deg)";
  }

  return { qkKnM2, concentratedKn: load.concentratedKn, formula };
}
