export type GraphPoint = {
  x: number;
  y: number;
};

export type BeamAnalysis = {
  spanM: number;
  reactionLeftKn: number;
  reactionRightKn: number;
  maxMomentKnM: number;
  maxShearKn: number;
  maxDeflectionMm: number;
  shear: GraphPoint[];
  moment: GraphPoint[];
  deflection: GraphPoint[];
};

export type ActionCombination = {
  ulsA: number;
  ulsB: number;
  uls: number;
  governing: "6.10a" | "6.10b";
  sls: number;
};

export type CheckResult = {
  label: string;
  demand: string;
  capacity: string;
  utilisation: number;
};

export type SteelSection = {
  name: string;
  areaCm2: number;
  iyCm4: number;
  welCm3: number;
  wplCm3: number;
};

/**
 * Compact MVP subset of SCI/BCSA UKB section properties. The production
 * calculator must replace this with a licensed, versioned section database.
 */
export const STEEL_SECTIONS: SteelSection[] = [
  { name: "152 × 89 × 16 UKB", areaCm2: 20.3, iyCm4: 834, welCm3: 109, wplCm3: 123 },
  { name: "178 × 102 × 19 UKB", areaCm2: 24.3, iyCm4: 1360, welCm3: 153, wplCm3: 171 },
  { name: "203 × 102 × 23 UKB", areaCm2: 29.4, iyCm4: 2110, welCm3: 207, wplCm3: 234 },
  { name: "254 × 146 × 31 UKB", areaCm2: 39.7, iyCm4: 4410, welCm3: 351, wplCm3: 393 },
  { name: "305 × 165 × 40 UKB", areaCm2: 51.3, iyCm4: 8500, welCm3: 560, wplCm3: 623 },
  { name: "356 × 171 × 45 UKB", areaCm2: 57.3, iyCm4: 12100, welCm3: 687, wplCm3: 775 },
];

export type TimberGrade = "C16" | "C24";

export const TIMBER_GRADES: Record<
  TimberGrade,
  { fmK: number; fvK: number; eMean: number }
> = {
  C16: { fmK: 16, fvK: 3.2, eMean: 8000 },
  C24: { fmK: 24, fvK: 4.0, eMean: 11000 },
};

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, Number.isFinite(value) ? value : minimum));

export function combineActions(gk: number, qk: number, psi0 = 0.7): ActionCombination {
  const permanent = Math.max(0, gk);
  const variable = Math.max(0, qk);
  const ulsA = 1.35 * permanent + 1.5 * psi0 * variable;
  const ulsB = 1.25 * permanent + 1.5 * variable;
  return {
    ulsA,
    ulsB,
    uls: Math.max(ulsA, ulsB),
    governing: ulsA >= ulsB ? "6.10a" : "6.10b",
    sls: permanent + variable,
  };
}

export function analyseSimplySupportedBeam({
  spanM,
  udlKnM,
  pointKn = 0,
  pointPositionM,
  elasticModulusNmm2 = 210000,
  secondMomentMm4 = 1,
}: {
  spanM: number;
  udlKnM: number;
  pointKn?: number;
  pointPositionM?: number;
  elasticModulusNmm2?: number;
  secondMomentMm4?: number;
}): BeamAnalysis {
  const lengthM = clamp(spanM, 0.1, 100);
  const pointAtM = clamp(pointPositionM ?? lengthM / 2, 0, lengthM);
  const udl = Math.max(0, udlKnM);
  const point = Math.max(0, pointKn);
  const reactionLeftKn = udl * lengthM / 2 + point * (lengthM - pointAtM) / lengthM;
  const reactionRightKn = udl * lengthM / 2 + point * pointAtM / lengthM;
  const lengthMm = lengthM * 1000;
  const pointAtMm = pointAtM * 1000;
  const udlNmm = udl;
  const pointN = point * 1000;
  const ei = Math.max(1, elasticModulusNmm2 * secondMomentMm4);
  const samples = 61;

  const shear: GraphPoint[] = [];
  const moment: GraphPoint[] = [];
  const deflection: GraphPoint[] = [];

  const deflectionAt = (xMm: number) => {
    const udlDeflection =
      udlNmm * xMm *
      (lengthMm ** 3 - 2 * lengthMm * xMm ** 2 + xMm ** 3) /
      (24 * ei);
    const a = pointAtMm;
    const b = lengthMm - a;
    const pointDeflection = xMm <= a
      ? pointN * b * xMm * (lengthMm ** 2 - b ** 2 - xMm ** 2) / (6 * lengthMm * ei)
      : pointN * a * (lengthMm - xMm) *
        (lengthMm ** 2 - a ** 2 - (lengthMm - xMm) ** 2) /
        (6 * lengthMm * ei);
    return Math.max(0, udlDeflection + pointDeflection);
  };

  for (let index = 0; index < samples; index += 1) {
    const xM = lengthM * index / (samples - 1);
    const xMm = xM * 1000;
    const pointApplied = xM >= pointAtM ? point : 0;
    const shearKn = reactionLeftKn - udl * xM - pointApplied;
    const momentKnM = reactionLeftKn * xM - udl * xM * xM / 2 - point * Math.max(0, xM - pointAtM);

    shear.push({ x: xM, y: shearKn });
    moment.push({ x: xM, y: Math.max(0, momentKnM) });
    deflection.push({ x: xM, y: deflectionAt(xMm) });
  }

  const momentAt = (xM: number) =>
    reactionLeftKn * xM - udl * xM * xM / 2 - point * Math.max(0, xM - pointAtM);
  const momentCandidates = [0, pointAtM, lengthM];
  if (udl > 0) {
    const beforePoint = reactionLeftKn / udl;
    const afterPoint = (reactionLeftKn - point) / udl;
    if (beforePoint >= 0 && beforePoint <= pointAtM) momentCandidates.push(beforePoint);
    if (afterPoint >= pointAtM && afterPoint <= lengthM) momentCandidates.push(afterPoint);
  }
  const exactMaxMomentKnM = Math.max(...momentCandidates.map(momentAt), 0);
  let sampledMaxDeflectionMm = 0;
  for (let index = 0; index <= 400; index += 1) {
    sampledMaxDeflectionMm = Math.max(sampledMaxDeflectionMm, deflectionAt(lengthMm * index / 400));
  }

  return {
    spanM: lengthM,
    reactionLeftKn,
    reactionRightKn,
    maxMomentKnM: exactMaxMomentKnM,
    maxShearKn: Math.max(reactionLeftKn, reactionRightKn),
    maxDeflectionMm: sampledMaxDeflectionMm,
    shear,
    moment,
    deflection,
  };
}

export function calculateLoadTakedown(input: {
  spanM: number;
  tributaryWidthM: number;
  deadAreaKnM2: number;
  imposedAreaKnM2: number;
  wallDeadKnM: number;
  pointDeadKn: number;
  pointImposedKn: number;
  pointPositionM: number;
  psi0?: number;
}) {
  const gkLine = Math.max(0, input.deadAreaKnM2) * Math.max(0, input.tributaryWidthM) + Math.max(0, input.wallDeadKnM);
  const qkLine = Math.max(0, input.imposedAreaKnM2) * Math.max(0, input.tributaryWidthM);
  const lineCombination = combineActions(gkLine, qkLine, input.psi0);
  const pointCombination = combineActions(input.pointDeadKn, input.pointImposedKn, input.psi0);
  const ulsA = analyseSimplySupportedBeam({
    spanM: input.spanM,
    udlKnM: lineCombination.ulsA,
    pointKn: combineActions(input.pointDeadKn, input.pointImposedKn, input.psi0).ulsA,
    pointPositionM: input.pointPositionM,
  });
  const ulsB = analyseSimplySupportedBeam({
    spanM: input.spanM,
    udlKnM: lineCombination.ulsB,
    pointKn: combineActions(input.pointDeadKn, input.pointImposedKn, input.psi0).ulsB,
    pointPositionM: input.pointPositionM,
  });
  const governing = ulsA.maxMomentKnM >= ulsB.maxMomentKnM ? ulsA : ulsB;
  const governingCombination = ulsA.maxMomentKnM >= ulsB.maxMomentKnM ? "6.10a" : "6.10b";
  const gkAnalysis = analyseSimplySupportedBeam({
    spanM: input.spanM,
    udlKnM: gkLine,
    pointKn: input.pointDeadKn,
    pointPositionM: input.pointPositionM,
  });
  const qkAnalysis = analyseSimplySupportedBeam({
    spanM: input.spanM,
    udlKnM: qkLine,
    pointKn: input.pointImposedKn,
    pointPositionM: input.pointPositionM,
  });

  return {
    gkLine,
    qkLine,
    lineCombination,
    pointCombination,
    governing,
    governingCombination,
    governingUdlKnM: governingCombination === "6.10a" ? lineCombination.ulsA : lineCombination.ulsB,
    governingPointKn: governingCombination === "6.10a" ? pointCombination.ulsA : pointCombination.ulsB,
    reactionGkLeftKn: gkAnalysis.reactionLeftKn,
    reactionQkLeftKn: qkAnalysis.reactionLeftKn,
    reactionGkRightKn: gkAnalysis.reactionRightKn,
    reactionQkRightKn: qkAnalysis.reactionRightKn,
  };
}

export function designSteelBeam(input: {
  spanM: number;
  gkLineKnM: number;
  qkLineKnM: number;
  gkPointKn: number;
  qkPointKn: number;
  pointPositionM: number;
  sectionName: string;
  steelGrade: 275 | 355;
  deflectionRatio: number;
  psi0?: number;
}) {
  const section = STEEL_SECTIONS.find((candidate) => candidate.name === input.sectionName) ?? STEEL_SECTIONS[2];
  const line = combineActions(input.gkLineKnM, input.qkLineKnM, input.psi0);
  const point = combineActions(input.gkPointKn, input.qkPointKn, input.psi0);
  const analyse = (udlKnM: number, pointKn: number) => analyseSimplySupportedBeam({
    spanM: input.spanM,
    udlKnM,
    pointKn,
    pointPositionM: input.pointPositionM,
    elasticModulusNmm2: 210000,
    secondMomentMm4: section.iyCm4 * 10000,
  });
  const ulsA = analyse(line.ulsA, point.ulsA);
  const ulsB = analyse(line.ulsB, point.ulsB);
  const governing = ulsA.maxMomentKnM >= ulsB.maxMomentKnM ? ulsA : ulsB;
  const governingCombination = ulsA.maxMomentKnM >= ulsB.maxMomentKnM ? "6.10a" : "6.10b";
  const sls = analyse(line.sls, point.sls);
  const momentResistanceKnM = section.wplCm3 * 1000 * input.steelGrade / 1_000_000;
  // Preliminary web shear proxy. Production must use exact Av from the licensed section dataset.
  const shearAreaMm2 = section.areaCm2 * 100 * 0.4;
  const shearResistanceKn = shearAreaMm2 * input.steelGrade / Math.sqrt(3) / 1000;
  const deflectionLimitMm = input.spanM * 1000 / Math.max(100, input.deflectionRatio);
  const checks: CheckResult[] = [
    {
      label: "Bending",
      demand: `${governing.maxMomentKnM.toFixed(1)} kNm`,
      capacity: `${momentResistanceKnM.toFixed(1)} kNm`,
      utilisation: governing.maxMomentKnM / Math.max(momentResistanceKnM, 0.001),
    },
    {
      label: "Shear",
      demand: `${governing.maxShearKn.toFixed(1)} kN`,
      capacity: `${shearResistanceKn.toFixed(1)} kN`,
      utilisation: governing.maxShearKn / Math.max(shearResistanceKn, 0.001),
    },
    {
      label: "Deflection",
      demand: `${sls.maxDeflectionMm.toFixed(1)} mm`,
      capacity: `${deflectionLimitMm.toFixed(1)} mm`,
      utilisation: sls.maxDeflectionMm / Math.max(deflectionLimitMm, 0.001),
    },
  ];

  return {
    section,
    line,
    point,
    governing,
    governingCombination,
    governingUdlKnM: governingCombination === "6.10a" ? line.ulsA : line.ulsB,
    governingPointKn: governingCombination === "6.10a" ? point.ulsA : point.ulsB,
    sls,
    checks,
    utilisation: Math.max(...checks.map((check) => check.utilisation)),
  };
}

export function calculateMasonryBearing(input: {
  reactionKn: number;
  wallThicknessMm: number;
  bearingLengthMm: number;
  masonryDesignStrengthNmm2: number;
  enhancementFactor: number;
}) {
  const areaMm2 = Math.max(1, input.wallThicknessMm * input.bearingLengthMm);
  const stressNmm2 = input.reactionKn * 1000 / areaMm2;
  const resistanceKn =
    areaMm2 * Math.max(0.1, input.masonryDesignStrengthNmm2) *
    clamp(input.enhancementFactor, 1, 1.5) / 1000;
  const utilisation = input.reactionKn / Math.max(resistanceKn, 0.001);
  const requiredLengthMm =
    input.reactionKn * 1000 /
    (Math.max(1, input.wallThicknessMm) * Math.max(0.1, input.masonryDesignStrengthNmm2) * clamp(input.enhancementFactor, 1, 1.5));
  const suggestedPadstoneLengthMm = Math.max(
    input.bearingLengthMm,
    Math.ceil(requiredLengthMm / 25) * 25,
  );

  return {
    areaMm2,
    stressNmm2,
    resistanceKn,
    utilisation,
    requiredLengthMm,
    suggestedPadstoneLengthMm,
  };
}

export function designTimberMember(input: {
  spanM: number;
  widthMm: number;
  depthMm: number;
  gkLineKnM: number;
  qkLineKnM: number;
  grade: TimberGrade;
  serviceClass: 1 | 2;
  systemFactor: number;
  deflectionRatio: number;
  psi0?: number;
  psi2?: number;
}) {
  const grade = TIMBER_GRADES[input.grade];
  const width = Math.max(25, input.widthMm);
  const depth = Math.max(50, input.depthMm);
  const inertiaMm4 = width * depth ** 3 / 12;
  const modulusMm3 = width * depth ** 2 / 6;
  const line = combineActions(input.gkLineKnM, input.qkLineKnM, input.psi0);
  const ulsA = analyseSimplySupportedBeam({ spanM: input.spanM, udlKnM: line.ulsA });
  const ulsB = analyseSimplySupportedBeam({ spanM: input.spanM, udlKnM: line.ulsB });
  const governing = ulsA.maxMomentKnM >= ulsB.maxMomentKnM ? ulsA : ulsB;
  const governingCombination = ulsA.maxMomentKnM >= ulsB.maxMomentKnM ? "6.10a" : "6.10b";
  const gk = analyseSimplySupportedBeam({
    spanM: input.spanM,
    udlKnM: input.gkLineKnM,
    elasticModulusNmm2: grade.eMean,
    secondMomentMm4: inertiaMm4,
  });
  const qk = analyseSimplySupportedBeam({
    spanM: input.spanM,
    udlKnM: input.qkLineKnM,
    elasticModulusNmm2: grade.eMean,
    secondMomentMm4: inertiaMm4,
  });
  const kmod = 0.8;
  const gammaM = 1.3;
  const bendingStrength = kmod * clamp(input.systemFactor, 1, 1.1) * grade.fmK / gammaM;
  const shearStrength = kmod * grade.fvK / gammaM;
  const bendingStress = governing.maxMomentKnM * 1_000_000 / modulusMm3;
  const shearStress = 1.5 * governing.maxShearKn * 1000 / (width * depth);
  const kdef = input.serviceClass === 1 ? 0.6 : 0.8;
  const psi2 = input.psi2 ?? 0.3;
  const finalDeflectionMm = gk.maxDeflectionMm * (1 + kdef) + qk.maxDeflectionMm * (1 + psi2 * kdef);
  const deflectionLimitMm = input.spanM * 1000 / Math.max(100, input.deflectionRatio);
  const displayAnalysis = analyseSimplySupportedBeam({
    spanM: input.spanM,
    udlKnM: line.uls,
    elasticModulusNmm2: grade.eMean,
    secondMomentMm4: inertiaMm4,
  });
  const checks: CheckResult[] = [
    {
      label: "Bending",
      demand: `${bendingStress.toFixed(1)} N/mm²`,
      capacity: `${bendingStrength.toFixed(1)} N/mm²`,
      utilisation: bendingStress / Math.max(bendingStrength, 0.001),
    },
    {
      label: "Shear",
      demand: `${shearStress.toFixed(2)} N/mm²`,
      capacity: `${shearStrength.toFixed(2)} N/mm²`,
      utilisation: shearStress / Math.max(shearStrength, 0.001),
    },
    {
      label: "Final deflection",
      demand: `${finalDeflectionMm.toFixed(1)} mm`,
      capacity: `${deflectionLimitMm.toFixed(1)} mm`,
      utilisation: finalDeflectionMm / Math.max(deflectionLimitMm, 0.001),
    },
  ];

  return {
    grade,
    line,
    governing,
    governingCombination,
    displayAnalysis,
    finalDeflectionMm,
    checks,
    utilisation: Math.max(...checks.map((check) => check.utilisation)),
  };
}
