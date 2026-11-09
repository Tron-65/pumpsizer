import {
  BoreholeSizingInput,
  BoreholeSizingResult,
  PumpModel,
  PumpPoint,
} from '../types/hydraulics';
import { G, calculateVelocity, calculateReynolds, calculateFrictionFactor, calculatePipeFrictionM } from './engineering';

export interface BoreholePumpFamily {
  id: string;
  name: string;
  nominalSizeInches: 4 | 6 | 8;
  pumpOuterDiameterMm: number;
  motorDiameterMm: number;
  bepFlowM3h: number;
  flowRangeMinM3h: number;
  flowRangeMaxM3h: number;
  headPerStageBepM: number;
  shutoffHeadPerStageM: number;
  bepEfficiency: number;
  stageCurvatureA2: number; // H_stage(Q) = shutoff - a2 * Q^2
  rpm: number;
}

export const BOREHOLE_FAMILIES: BoreholePumpFamily[] = [
  {
    id: 'sp_3',
    name: '4" 4SP3 Submersible Borehole Series',
    nominalSizeInches: 4,
    pumpOuterDiameterMm: 98,
    motorDiameterMm: 95,
    bepFlowM3h: 3.0,
    flowRangeMinM3h: 0.8,
    flowRangeMaxM3h: 4.4,
    headPerStageBepM: 5.6,
    shutoffHeadPerStageM: 6.8,
    bepEfficiency: 68,
    stageCurvatureA2: 0.133,
    rpm: 2900,
  },
  {
    id: 'sp_5',
    name: '4" 4SP5 Submersible Borehole Series',
    nominalSizeInches: 4,
    pumpOuterDiameterMm: 98,
    motorDiameterMm: 95,
    bepFlowM3h: 5.0,
    flowRangeMinM3h: 2.0,
    flowRangeMaxM3h: 7.0,
    headPerStageBepM: 5.2,
    shutoffHeadPerStageM: 6.5,
    bepEfficiency: 71,
    stageCurvatureA2: 0.052,
    rpm: 2900,
  },
  {
    id: 'sp_8',
    name: '4" 4SP8 Submersible Borehole Series',
    nominalSizeInches: 4,
    pumpOuterDiameterMm: 98,
    motorDiameterMm: 95,
    bepFlowM3h: 8.0,
    flowRangeMinM3h: 3.5,
    flowRangeMaxM3h: 11.0,
    headPerStageBepM: 5.0,
    shutoffHeadPerStageM: 6.4,
    bepEfficiency: 74,
    stageCurvatureA2: 0.0218,
    rpm: 2900,
  },
  {
    id: 'sp_14',
    name: '4" 4SP14 Submersible Borehole Series',
    nominalSizeInches: 4,
    pumpOuterDiameterMm: 98,
    motorDiameterMm: 95,
    bepFlowM3h: 14.0,
    flowRangeMinM3h: 6.0,
    flowRangeMaxM3h: 18.0,
    headPerStageBepM: 4.8,
    shutoffHeadPerStageM: 6.2,
    bepEfficiency: 76,
    stageCurvatureA2: 0.00714,
    rpm: 2900,
  },
  {
    id: 'sp_30',
    name: '6" 6SP30 Submersible Borehole Series',
    nominalSizeInches: 6,
    pumpOuterDiameterMm: 142,
    motorDiameterMm: 138,
    bepFlowM3h: 30.0,
    flowRangeMinM3h: 14.0,
    flowRangeMaxM3h: 38.0,
    headPerStageBepM: 6.5,
    shutoffHeadPerStageM: 8.4,
    bepEfficiency: 78,
    stageCurvatureA2: 0.00211,
    rpm: 2900,
  },
  {
    id: 'sp_46',
    name: '6" 6SP46 Submersible Borehole Series',
    nominalSizeInches: 6,
    pumpOuterDiameterMm: 142,
    motorDiameterMm: 138,
    bepFlowM3h: 46.0,
    flowRangeMinM3h: 22.0,
    flowRangeMaxM3h: 60.0,
    headPerStageBepM: 6.2,
    shutoffHeadPerStageM: 8.0,
    bepEfficiency: 80,
    stageCurvatureA2: 0.00085,
    rpm: 2900,
  },
  {
    id: 'sp_60',
    name: '6" 6SP60 Submersible Borehole Series',
    nominalSizeInches: 6,
    pumpOuterDiameterMm: 142,
    motorDiameterMm: 138,
    bepFlowM3h: 60.0,
    flowRangeMinM3h: 30.0,
    flowRangeMaxM3h: 78.0,
    headPerStageBepM: 5.9,
    shutoffHeadPerStageM: 7.7,
    bepEfficiency: 81,
    stageCurvatureA2: 0.0005,
    rpm: 2900,
  },
];

// Standard submersible motor sizes (kW)
export const SUBMERSIBLE_MOTOR_SIZES_KW = [
  0.37, 0.55, 0.75, 1.1, 1.5, 2.2, 3.0, 3.7, 4.0, 5.5, 7.5, 9.2, 11, 13, 15,
  18.5, 22, 26, 30, 37, 45, 55, 75, 90, 110,
];

/**
 * Sizes a submersible borehole pump given known Q and H, or detailed well inputs
 */
export function sizeBoreholePump(input: BoreholeSizingInput): {
  result: BoreholeSizingResult;
  generatedPump: PumpModel;
} {
  const targetQ = Math.max(0.1, input.targetFlowM3h);

  let targetH = input.targetHeadM;
  let dynamicWaterLevelM = input.staticWaterLevelM + input.drawdownM;
  let riserLossM = 0;
  let surfaceLossM = 0;
  let residualHeadM = 0;
  let staticWaterHeadM = 0;

  if (input.useDetailedWellHeadCalc) {
    // Dynamic Water Level = Static Water Level + Well Drawdown
    dynamicWaterLevelM = Math.max(0, input.staticWaterLevelM + input.drawdownM);

    // Static lift = Dynamic water level (depth) + Surface elevation lift
    staticWaterHeadM = dynamicWaterLevelM + Math.max(0, input.surfaceElevationLiftM);

    // Riser column friction
    const riserV = calculateVelocity(targetQ, input.riserPipeDiameterMm || 50);
    const riserRe = calculateReynolds(riserV, input.riserPipeDiameterMm || 50, 1.0);
    const riserF = calculateFrictionFactor(riserRe, 0.007, input.riserPipeDiameterMm || 50);
    riserLossM = calculatePipeFrictionM(
      'darcy_weisbach',
      input.pumpSettingDepthM || dynamicWaterLevelM + 10,
      input.riserPipeDiameterMm || 50,
      riserV,
      riserF,
      140,
      targetQ
    );

    // Add check valve loss in riser column (K=2.5)
    riserLossM += 2.5 * (Math.pow(riserV, 2) / (2 * G));

    // Surface pipe friction
    if (input.surfacePipeLengthM > 0 && input.surfacePipeDiameterMm > 0) {
      const surfV = calculateVelocity(targetQ, input.surfacePipeDiameterMm);
      const surfRe = calculateReynolds(surfV, input.surfacePipeDiameterMm, 1.0);
      const surfF = calculateFrictionFactor(surfRe, 0.007, input.surfacePipeDiameterMm);
      surfaceLossM = calculatePipeFrictionM(
        'darcy_weisbach',
        input.surfacePipeLengthM,
        input.surfacePipeDiameterMm,
        surfV,
        surfF,
        140,
        targetQ
      );
    }

    // Residual pressure head (1 bar ≈ 10.197 m head)
    residualHeadM = (input.residualPressureBar || 0) * 10.197;

    // Total TDH
    targetH = staticWaterHeadM + riserLossM + surfaceLossM + residualHeadM;
  }

  // 1. Select best matching borehole pump family based on target Q
  let bestFamily = BOREHOLE_FAMILIES[0];
  let minDiff = Infinity;
  for (const family of BOREHOLE_FAMILIES) {
    const diff = Math.abs(family.bepFlowM3h - targetQ);
    if (diff < minDiff) {
      minDiff = diff;
      bestFamily = family;
    }
  }

  // 2. Head per single stage at target Q
  // H_stage(Q) = shutoff - a2 * Q^2
  const singleStageHeadAtQ = Math.max(
    1.5,
    bestFamily.shutoffHeadPerStageM - bestFamily.stageCurvatureA2 * Math.pow(targetQ, 2)
  );

  // 3. Compute required number of stages N
  const numberOfStages = Math.max(1, Math.ceil(targetH / singleStageHeadAtQ));

  // 4. Multistage Pump curve formulation:
  // H(Q) = N * (H0 - a2 * Q^2) = (N * H0) - (N * a2) * Q^2
  const a0 = numberOfStages * bestFamily.shutoffHeadPerStageM;
  const a1 = 0;
  const a2 = -(numberOfStages * bestFamily.stageCurvatureA2);

  const shutoffHeadM = a0;
  const actualHeadAtTargetQ = a0 + a2 * Math.pow(targetQ, 2);

  // 5. Efficiency at target Q
  const bepDelta = (targetQ - bestFamily.bepFlowM3h) / bestFamily.bepFlowM3h;
  const effAtQ = Math.max(
    30,
    Math.min(bestFamily.bepEfficiency, bestFamily.bepEfficiency * (1 - 1.2 * Math.pow(bepDelta, 2)))
  );

  // 6. Hydraulic & Shaft Power
  const hydPowerKw = (1000 * G * (targetQ / 3600) * actualHeadAtTargetQ) / 1000;
  const shaftPowerKw = hydPowerKw / (effAtQ / 100);

  // 7. Submersible motor size with 15% safety margin
  const requiredMotorKw = shaftPowerKw * 1.15;
  let motorRatingKw = SUBMERSIBLE_MOTOR_SIZES_KW[SUBMERSIBLE_MOTOR_SIZES_KW.length - 1];
  for (const rating of SUBMERSIBLE_MOTOR_SIZES_KW) {
    if (rating >= requiredMotorKw) {
      motorRatingKw = rating;
      break;
    }
  }
  const motorRatingHp = motorRatingKw * 1.34102;

  // 8. Motor cooling velocity check
  // Borehole casing internal diameter (mm): 4" ≈ 102mm, 5" ≈ 127mm, 6" ≈ 152mm, 8" ≈ 203mm
  const casingDiaMm = (input.casingDiameterInches || 6) * 25.4;
  const motorDiaMm = bestFamily.motorDiameterMm;
  const casingAreaM2 = (Math.PI / 4) * Math.pow(casingDiaMm / 1000, 2);
  const motorAreaM2 = (Math.PI / 4) * Math.pow(motorDiaMm / 1000, 2);
  const flowAnnulusAreaM2 = Math.max(0.001, casingAreaM2 - motorAreaM2);
  const coolingVelocityMs = (targetQ / 3600) / flowAnnulusAreaM2;

  // Minimum recommended cooling velocity for submersible motors is 0.15 m/s (0.5 ft/s)
  const isCoolingSleeveRequired = coolingVelocityMs < 0.15;
  const casingClearanceMm = (casingDiaMm - bestFamily.pumpOuterDiameterMm) / 2;

  // 9. Drop Cable Voltage Drop calculation
  // Copper resistivity: 0.0175 ohm*mm²/m
  const cableLen = input.cableLengthM || input.pumpSettingDepthM || 60;
  const cableSize = input.cableSizeMm2 || 4.0;
  const supplyV = input.supplyVoltage || 400;
  // Estimated motor current I (Amps) ≈ (P_kw * 1000) / (sqrt(3) * V * cosPhi * eff) or 1-phase
  const motorEff = 0.82;
  const cosPhi = 0.84;
  let currentAmps = 0;
  let deltaV = 0;

  if (supplyV === 400) {
    // 3-phase 400V
    currentAmps = (motorRatingKw * 1000) / (Math.sqrt(3) * 400 * cosPhi * motorEff);
    deltaV = Math.sqrt(3) * currentAmps * ((0.0175 * cableLen) / cableSize);
  } else {
    // 1-phase 230V
    currentAmps = (motorRatingKw * 1000) / (230 * cosPhi * motorEff);
    deltaV = 2 * currentAmps * ((0.0175 * cableLen) / cableSize);
  }
  const voltageDropPercent = (deltaV / supplyV) * 100;
  const isCableAdequate = voltageDropPercent <= 4.0;

  // Generate Pump Curve Points
  const curvePoints: PumpPoint[] = [];
  const maxQ = bestFamily.flowRangeMaxM3h * 1.1;
  const numPts = 6;
  for (let i = 0; i <= numPts; i++) {
    const q = (maxQ * i) / numPts;
    const h = Math.max(0, a0 + a2 * Math.pow(q, 2));
    const delta = (q - bestFamily.bepFlowM3h) / bestFamily.bepFlowM3h;
    const eff = Math.max(5, bestFamily.bepEfficiency * (1 - 1.2 * Math.pow(delta, 2)));
    const pKw = ((1000 * G * (q / 3600) * h) / 1000) / (eff / 100);
    const npsh = 1.2 + 2.5 * Math.pow(q / maxQ, 2);
    curvePoints.push({
      flow: Math.round(q * 10) / 10,
      head: Math.round(h * 10) / 10,
      efficiency: Math.round(eff),
      powerKw: Math.round(pKw * 10) / 10,
      npshr: Math.round(npsh * 10) / 10,
    });
  }

  const modelDesignation = `${bestFamily.name.split(' ')[1]}-${numberOfStages} (${motorRatingKw}kW / ${motorRatingHp.toFixed(1)}HP)`;

  const generatedPump: PumpModel = {
    id: `borehole_${bestFamily.id}_${numberOfStages}_${Date.now()}`,
    manufacturer: 'HydroSub Pro DeepWell',
    model: modelDesignation,
    type: 'submersible_borehole',
    rpm: bestFamily.rpm,
    impellerDiameterMm: bestFamily.pumpOuterDiameterMm,
    bepFlow: bestFamily.bepFlowM3h,
    bepHead: Math.round(numberOfStages * bestFamily.headPerStageBepM * 10) / 10,
    bepEfficiency: bestFamily.bepEfficiency,
    shutoffHead: Math.round(shutoffHeadM * 10) / 10,
    maxFlow: Math.round(maxQ * 10) / 10,
    curvePoints,
    a0: Math.round(a0 * 100) / 100,
    a1: 0,
    a2: Math.round(a2 * 10000) / 10000,
    motorRatingKw,
    stages: numberOfStages,
    casingDiameterInches: input.casingDiameterInches || 6,
  };

  const result: BoreholeSizingResult = {
    targetFlowM3h: Math.round(targetQ * 10) / 10,
    calculatedTdhM: Math.round(targetH * 10) / 10,
    dynamicWaterLevelM: Math.round(dynamicWaterLevelM * 10) / 10,
    staticWaterHeadM: Math.round(staticWaterHeadM * 10) / 10,
    riserFrictionLossM: Math.round(riserLossM * 100) / 100,
    surfaceFrictionLossM: Math.round(surfaceLossM * 100) / 100,
    residualPressureHeadM: Math.round(residualHeadM * 10) / 10,

    recommendedModel: modelDesignation,
    pumpFamily: bestFamily.name,
    numberOfStages,
    headPerStageM: Math.round(singleStageHeadAtQ * 10) / 10,
    shutoffHeadM: Math.round(shutoffHeadM * 10) / 10,
    efficiencyAtDuty: Math.round(effAtQ * 10) / 10,
    shaftPowerKw: Math.round(shaftPowerKw * 100) / 100,
    motorRatingKw,
    motorRatingHp: Math.round(motorRatingHp * 10) / 10,

    motorCoolingVelocityMs: Math.round(coolingVelocityMs * 100) / 100,
    isCoolingSleeveRequired,
    cableVoltageDropPercent: Math.round(voltageDropPercent * 10) / 10,
    isCableAdequate,
    casingClearanceMm: Math.round(casingClearanceMm * 10) / 10,
  };

  return { result, generatedPump };
}
