import {
  ProjectData,
  HydraulicCalculationResults,
  EngineeringWarning,
  PumpModel,
  PipeSegment,
} from '../types/hydraulics';
import { PUMP_CATALOG } from '../data/defaultCatalog';

export const G = 9.80665; // m/s²

// Standard IEC motor sizes in kW
export const STANDARD_MOTOR_RATINGS_KW = [
  0.37, 0.55, 0.75, 1.1, 1.5, 2.2, 3.0, 4.0, 5.5, 7.5, 11, 15, 18.5, 22, 30, 37,
  45, 55, 75, 90, 110, 132, 160, 200, 250, 315, 355, 400,
];

/**
 * Atmospheric pressure in kPa based on altitude in meters (US Standard Atmosphere)
 */
export function getAtmosphericPressureKPa(altitudeM: number): number {
  const alt = Math.max(-500, Math.min(10000, altitudeM));
  // Barometric formula
  const pAtm = 101.325 * Math.pow(1 - 2.25577e-5 * alt, 5.25588);
  return Math.max(10, Math.round(pAtm * 100) / 100);
}

/**
 * Calculates flow velocity (m/s) in a circular pipe
 */
export function calculateVelocity(flowM3h: number, diameterMm: number): number {
  if (diameterMm <= 0 || flowM3h <= 0) return 0;
  const flowM3s = flowM3h / 3600;
  const diameterM = diameterMm / 1000;
  const areaM2 = (Math.PI * Math.pow(diameterM, 2)) / 4;
  return flowM3s / areaM2;
}

/**
 * Calculates Reynolds number: Re = (V * D) / nu
 * @param velocityMs m/s
 * @param diameterMm mm
 * @param kinematicViscosityCSt cSt (1 cSt = 1e-6 m²/s)
 */
export function calculateReynolds(
  velocityMs: number,
  diameterMm: number,
  kinematicViscosityCSt: number
): number {
  if (kinematicViscosityCSt <= 0 || diameterMm <= 0 || velocityMs <= 0) return 0;
  const diameterM = diameterMm / 1000;
  const nuM2s = Math.max(0.1, kinematicViscosityCSt) * 1e-6;
  return (velocityMs * diameterM) / nuM2s;
}

/**
 * Solves the Colebrook-White friction factor using Newton-Raphson
 */
export function calculateFrictionFactor(
  reynolds: number,
  roughnessMm: number,
  diameterMm: number
): number {
  if (reynolds <= 0 || diameterMm <= 0) return 0.02;

  // Laminar flow
  if (reynolds < 2300) {
    return Math.min(0.2, 64 / reynolds);
  }

  const epsOverD = Math.max(1e-7, (roughnessMm / 1000) / (diameterMm / 1000));

  // Initial estimate via Swamee-Jain formula
  let f = 0.25 / Math.pow(Math.log10(epsOverD / 3.7 + 5.74 / Math.pow(reynolds, 0.9)), 2);

  // 3 iterations of Newton-Raphson on Colebrook-White:
  // F(f) = 1/sqrt(f) + 2 * log10(eps/(3.7*D) + 2.51 / (Re * sqrt(f))) = 0
  for (let i = 0; i < 4; i++) {
    const sqrtF = Math.sqrt(f);
    const term = epsOverD / 3.7 + 2.51 / (reynolds * sqrtF);
    if (term <= 0) break;
    const logTerm = Math.log10(term);
    const F = 1 / sqrtF + 2 * logTerm;

    // Derivative F'(f)
    const dterm_df = -1.255 / (reynolds * Math.pow(f, 1.5));
    const dF_df = -0.5 * Math.pow(f, -1.5) + (2 / Math.LN10) * (1 / term) * dterm_df;

    const fNext = f - F / dF_df;
    if (Math.abs(fNext - f) < 1e-6 || fNext <= 0) {
      f = Math.max(0.005, fNext);
      break;
    }
    f = Math.max(0.005, fNext);
  }

  return Math.min(0.15, Math.max(0.008, f));
}

/**
 * Calculates pipe friction loss (Darcy-Weisbach or Hazen-Williams) in meters
 */
export function calculatePipeFrictionM(
  method: 'darcy_weisbach' | 'hazen_williams',
  lengthM: number,
  diameterMm: number,
  velocityMs: number,
  frictionFactor: number,
  hazenWilliamsC: number,
  flowM3h: number
): number {
  if (lengthM <= 0 || diameterMm <= 0 || velocityMs <= 0) return 0;
  const diameterM = diameterMm / 1000;

  if (method === 'hazen_williams') {
    // Hazen-Williams equation: hf = 10.67 * L * Q^1.852 / (C^1.852 * D^4.87)
    // where Q is in m³/s and D is in meters
    const qM3s = flowM3h / 3600;
    const c = Math.max(40, hazenWilliamsC || 120);
    const hf = 10.67 * lengthM * Math.pow(qM3s, 1.852) / (Math.pow(c, 1.852) * Math.pow(diameterM, 4.87));
    return Math.max(0, hf);
  }

  // Darcy-Weisbach: hf = f * (L / D) * (V² / 2g)
  const hf = frictionFactor * (lengthM / diameterM) * (Math.pow(velocityMs, 2) / (2 * G));
  return Math.max(0, hf);
}

/**
 * Calculates minor losses sum: hm = sum(K) * V² / (2g) in meters
 */
export function calculateMinorLossesM(segment: PipeSegment, velocityMs: number): { minorLossM: number; totalK: number } {
  if (velocityMs <= 0 || !segment.fittings || segment.fittings.length === 0) {
    return { minorLossM: 0, totalK: 0 };
  }

  const totalK = segment.fittings.reduce((sum, item) => sum + (item.kFactor * (item.count || 0)), 0);
  const minorLossM = totalK * (Math.pow(velocityMs, 2) / (2 * G));
  return { minorLossM, totalK };
}

/**
 * Finds recommended standard motor size with safety margin
 */
export function findRecommendedMotorKw(shaftPowerKw: number): number {
  if (shaftPowerKw <= 0) return 0.75;
  // Apply 15% safety factor for pump motor sizing (Hydraulic Institute standard)
  const requiredWithMargin = shaftPowerKw * 1.15;
  for (const rating of STANDARD_MOTOR_RATINGS_KW) {
    if (rating >= requiredWithMargin) {
      return rating;
    }
  }
  return Math.ceil(requiredWithMargin / 10) * 10;
}

/**
 * Evaluates pump curve polynomial head at given flow with VFD and multi-pump scaling
 */
export function evaluatePumpHead(
  pump: PumpModel,
  flowM3h: number,
  vfdRatio: number = 1.0,
  config: 'single' | 'parallel_2' | 'parallel_3' | 'series_2' = 'single'
): number {
  const speed = Math.max(0.3, Math.min(1.5, vfdRatio));
  let qEffective = flowM3h;
  let headMultiplier = 1;

  if (config === 'parallel_2') {
    qEffective = flowM3h / 2;
  } else if (config === 'parallel_3') {
    qEffective = flowM3h / 3;
  } else if (config === 'series_2') {
    headMultiplier = 2;
  }

  // Affinity laws: Q0 = Q / speed; H(Q) = speed^2 * H0(Q0)
  const qBase = qEffective / speed;
  const baseHead = pump.a0 + pump.a1 * qBase + pump.a2 * Math.pow(qBase, 2);

  const scaledHead = Math.max(0, baseHead * Math.pow(speed, 2) * headMultiplier);
  return scaledHead;
}

/**
 * Evaluates pump efficiency % at given flow
 */
export function evaluatePumpEfficiency(pump: PumpModel, flowM3h: number, vfdRatio: number = 1.0): number {
  const speed = Math.max(0.3, Math.min(1.5, vfdRatio));
  const qBase = flowM3h / speed;
  if (qBase <= 0) return 0;

  // Parabolic efficiency curve centered at BEP
  const bep = pump.bepFlow;
  const maxEff = pump.bepEfficiency;
  const delta = (qBase - bep) / bep;
  const eff = maxEff * (1 - 1.2 * Math.pow(delta, 2));
  return Math.max(5, Math.min(maxEff, eff));
}

/**
 * Evaluates NPSHr at given flow
 */
export function evaluatePumpNpshr(pump: PumpModel, flowM3h: number, vfdRatio: number = 1.0): number {
  const speed = Math.max(0.3, Math.min(1.5, vfdRatio));
  const qBase = flowM3h / speed;
  // NPSHr increases quadratically with flow
  const baseNpshr = 1.8 + 3.5 * Math.pow(Math.max(0, qBase) / pump.maxFlow, 2);
  // With affinity law, NPSHr varies approximately as speed^2
  return Math.max(1.0, baseNpshr * Math.pow(speed, 1.8));
}

/**
 * Master Hydraulic Calculation Function
 */
export function runHydraulicCalculations(project: ProjectData): HydraulicCalculationResults {
  const {
    designFlowM3h,
    altitudeM,
    fluid,
    calculationMethod,
    suction,
    discharge,
    operatingHoursPerDay,
    electricityCostPerKwh,
    vfdSpeedRatio,
    pumpConfiguration,
  } = project;

  const flow = Math.max(0.01, designFlowM3h);
  const flowLps = flow / 3.6;
  const flowGpm = flow * 4.40287;
  const rho = Math.max(500, fluid.density);
  const kinematicVisc = Math.max(0.2, fluid.viscosity);

  // 1. Velocities & Reynolds
  const Vs = calculateVelocity(flow, suction.diameterMm);
  const Vd = calculateVelocity(flow, discharge.diameterMm);

  const Res = calculateReynolds(Vs, suction.diameterMm, kinematicVisc);
  const Red = calculateReynolds(Vd, discharge.diameterMm, kinematicVisc);

  const regimeS: 'laminar' | 'transition' | 'turbulent' =
    Res < 2300 ? 'laminar' : Res <= 4000 ? 'transition' : 'turbulent';
  const regimeD: 'laminar' | 'transition' | 'turbulent' =
    Red < 2300 ? 'laminar' : Red <= 4000 ? 'transition' : 'turbulent';

  // 2. Friction factors
  const fs = calculateFrictionFactor(Res, suction.roughnessMm, suction.diameterMm);
  const fd = calculateFrictionFactor(Red, discharge.roughnessMm, discharge.diameterMm);

  // 3. Suction Losses
  const hf_s = calculatePipeFrictionM(
    calculationMethod,
    suction.lengthM,
    suction.diameterMm,
    Vs,
    fs,
    120,
    flow
  );
  const { minorLossM: hm_s } = calculateMinorLossesM(suction, Vs);
  const hTotal_s = hf_s + hm_s;

  // 4. Discharge Losses
  const hf_d = calculatePipeFrictionM(
    calculationMethod,
    discharge.lengthM,
    discharge.diameterMm,
    Vd,
    fd,
    120,
    flow
  );
  const { minorLossM: hm_d } = calculateMinorLossesM(discharge, Vd);
  const hTotal_d = hf_d + hm_d;

  // 5. Static Head & Pressure Head
  // Static head = discharge elevation - suction elevation relative to pump centerline
  const staticHeadM = discharge.staticElevationM - suction.staticElevationM;

  // Pressure head difference = (P_discharge - P_suction) / (rho * g)
  // Both given in kPa gauge: 1 kPa = 1000 Pa
  const deltaPressureKPa = discharge.terminalPressureKPa - suction.terminalPressureKPa;
  const pressureHeadM = (deltaPressureKPa * 1000) / (rho * G);

  // Velocity head difference = (Vd² - Vs²) / (2g)
  const velocityHeadDiffM = (Math.pow(Vd, 2) - Math.pow(Vs, 2)) / (2 * G);

  // Total Dynamic Head (TDH)
  const tdhM = Math.max(0.1, staticHeadM + pressureHeadM + hTotal_s + hTotal_d + velocityHeadDiffM);

  // 6. NPSH Analysis
  const pAtmKPa = getAtmosphericPressureKPa(altitudeM);
  const pAtmHeadM = (pAtmKPa * 1000) / (rho * G);
  const pVaporHeadM = (fluid.vaporPressureKPa * 1000) / (rho * G);
  const pSuctionGaugeHeadM = (suction.terminalPressureKPa * 1000) / (rho * G);

  // NPSHa = (P_atm + P_suction_gauge - P_vapor)/(rho*g) + Z_suction - hTotal_s
  const npshaM = Math.max(0, pAtmHeadM + pSuctionGaugeHeadM - pVaporHeadM + suction.staticElevationM - hTotal_s);

  // Get active pump
  const pump: PumpModel =
    project.customPump ||
    PUMP_CATALOG.find((p) => p.id === project.selectedPumpId) ||
    PUMP_CATALOG[0];

  const npshrM = evaluatePumpNpshr(pump, flow, vfdSpeedRatio);
  const npshMarginM = npshaM - npshrM;
  const isCavitationRisk = npshMarginM < 1.0 || npshaM < npshrM * 1.2;

  // 7. Power & Energy Calculations
  // Hydraulic Power (kW) = (rho * g * Q_m3s * TDH) / 1000
  const qM3s = flow / 3600;
  const hydraulicPowerKw = (rho * G * qM3s * tdhM) / 1000;

  const pumpEff = evaluatePumpEfficiency(pump, flow, vfdSpeedRatio);
  const shaftBrakePowerKw = hydraulicPowerKw / (pumpEff / 100);

  const motorRecommendedKw = findRecommendedMotorKw(shaftBrakePowerKw);
  // Typical motor efficiency: 90% - 95% for premium efficiency (IE3)
  const motorEfficiencyEst = shaftBrakePowerKw > 30 ? 94 : shaftBrakePowerKw > 7.5 ? 91 : 87;
  const electricalPowerKw = shaftBrakePowerKw / (motorEfficiencyEst / 100);

  const hoursPerYear = (operatingHoursPerDay || 16) * 365;
  const annualEnergyKwh = electricalPowerKw * hoursPerYear;
  const annualOperatingCostUsd = annualEnergyKwh * (electricityCostPerKwh || 0.12);
  // Average grid carbon intensity approx 0.42 kg CO2 / kWh
  const annualCo2Tons = (annualEnergyKwh * 0.42) / 1000;

  // 8. Generate System Curve Points: H_sys(Q) = H_static + k * Q²
  const staticTotal = staticHeadM + pressureHeadM;
  const kSystem = (hTotal_s + hTotal_d + velocityHeadDiffM) / Math.pow(flow, 2);

  const maxPlotFlow = Math.max(pump.maxFlow * 1.25, flow * 1.5);
  const stepCount = 40;
  const systemCurvePoints: { flow: number; head: number; frictionHead: number; staticHead: number }[] = [];

  for (let i = 0; i <= stepCount; i++) {
    const qStep = (maxPlotFlow * i) / stepCount;
    const frictionStep = kSystem * Math.pow(qStep, 2);
    const headStep = Math.max(0, staticTotal + frictionStep);
    systemCurvePoints.push({
      flow: Math.round(qStep * 10) / 10,
      head: Math.round(headStep * 100) / 100,
      frictionHead: Math.round(frictionStep * 100) / 100,
      staticHead: Math.round(staticTotal * 100) / 100,
    });
  }

  // 9. Operating Point Solver (Intersection of Pump H(Q) and System H_sys(Q))
  let opPoint: HydraulicCalculationResults['operatingPoint'] | undefined;
  {
    let bestQ = flow;
    let minDiff = Infinity;
    // Bisection / scan search across range
    for (let q = 1; q <= maxPlotFlow; q += 0.5) {
      const hPump = evaluatePumpHead(pump, q, vfdSpeedRatio, pumpConfiguration);
      const hSys = staticTotal + kSystem * Math.pow(q, 2);
      const diff = Math.abs(hPump - hSys);
      if (diff < minDiff) {
        minDiff = diff;
        bestQ = q;
      }
    }

    const opHead = evaluatePumpHead(pump, bestQ, vfdSpeedRatio, pumpConfiguration);
    const opEff = evaluatePumpEfficiency(pump, bestQ, vfdSpeedRatio);
    const opPower = ((rho * G * (bestQ / 3600) * opHead) / 1000) / (opEff / 100);
    const opNpshr = evaluatePumpNpshr(pump, bestQ, vfdSpeedRatio);
    // NPSHa at operating point
    const opLosses = (hTotal_s / Math.pow(flow, 2)) * Math.pow(bestQ, 2);
    const opNpsha = Math.max(0, pAtmHeadM + pSuctionGaugeHeadM - pVaporHeadM + suction.staticElevationM - opLosses);

    opPoint = {
      flowM3h: Math.round(bestQ * 10) / 10,
      headM: Math.round(opHead * 100) / 100,
      efficiency: Math.round(opEff * 10) / 10,
      powerKw: Math.round(opPower * 10) / 10,
      npshrM: Math.round(opNpshr * 100) / 100,
      npshaM: Math.round(opNpsha * 100) / 100,
      flowMismatchPercent: Math.round(((bestQ - flow) / flow) * 1000) / 10,
    };
  }

  // 10. Real-time Engineering Validation Warnings
  const warnings: EngineeringWarning[] = [];

  // Cavitation check
  if (isCavitationRisk) {
    const isCriticalMargin = npshaM < npshrM;
    const isBelowHalfMeter = npshMarginM < 0.5;
    warnings.push({
      id: 'warn_cavitation',
      severity: isCriticalMargin ? 'critical' : 'warning',
      title: isCriticalMargin
        ? 'Critical: Cavitation Inevitable (NPSHa < NPSHr)'
        : isBelowHalfMeter
        ? 'Acute Cavitation Hazard: NPSH Safety Margin < 0.5 m'
        : 'Low NPSH Margin (< 1.0 m)',
      message: isBelowHalfMeter
        ? `NPSH safety margin has dropped to ${npshMarginM.toFixed(2)} m (below 0.5 m critical safety limit). Available NPSHa is ${npshaM.toFixed(2)} m vs NPSHr of ${npshrM.toFixed(2)} m. Imminent risk of vapor bubble formation and destructive impeller pitting cavitation.`
        : `Available NPSHa is ${npshaM.toFixed(2)} m while pump requires ${npshrM.toFixed(2)} m (Margin: ${npshMarginM.toFixed(2)} m). Minimum recommended safety margin is 1.0 m or 20%.`,
      recommendation:
        'Increase suction pipe diameter, reduce suction pipe length/fittings, raise suction tank liquid level, or select a pump with lower NPSHr.',
    });
  }

  // Velocity checks
  if (Vs > 2.2) {
    warnings.push({
      id: 'warn_suction_velocity',
      severity: 'warning',
      title: 'High Suction Velocity',
      message: `Suction line velocity is ${Vs.toFixed(2)} m/s (${(Vs * 3.28084).toFixed(1)} ft/s). Good engineering practice restricts suction velocity to ≤ 1.5 - 2.0 m/s to prevent turbulence and pump inlet starvation.`,
      recommendation: `Upsize suction pipe to next nominal diameter (e.g. from ${suction.diameterMm.toFixed(0)} mm to a larger standard diameter).`,
    });
  }

  if (Vd > 3.0) {
    warnings.push({
      id: 'warn_discharge_velocity_high',
      severity: 'warning',
      title: 'High Discharge Velocity (Erosion Risk)',
      message: `Discharge line velocity is ${Vd.toFixed(2)} m/s (${(Vd * 3.28084).toFixed(1)} ft/s), exceeding standard 2.5 - 3.0 m/s threshold. This causes high friction head loss, water hammer risk, and pipe wall wear.`,
      recommendation: 'Increase discharge pipe diameter to reduce operational pumping head and energy consumption.',
    });
  } else if (Vd < 0.6 && fluid.category === 'slurry') {
    warnings.push({
      id: 'warn_discharge_velocity_low',
      severity: 'warning',
      title: 'Low Discharge Velocity (Sedimentation Risk)',
      message: `Velocity of ${Vd.toFixed(2)} m/s is below 0.6 m/s self-cleansing settling threshold for wastewater/slurry lines.`,
      recommendation: 'Reduce discharge pipe diameter to maintain minimum cleansing scouring velocity.',
    });
  }

  // Best Efficiency Point (BEP) Deviation
  const bepRatio = flow / pump.bepFlow;
  if (bepRatio < 0.7 || bepRatio > 1.2) {
    warnings.push({
      id: 'warn_bep_deviation',
      severity: 'info',
      title: 'Operating Outside Preferred Operating Region (POR)',
      message: `Operating at ${(bepRatio * 100).toFixed(0)}% of pump BEP (${pump.bepFlow} m³/h). The Hydraulic Institute recommends operating between 70% and 120% of BEP to avoid recirculation, radial thrust, and shaft deflection.`,
      recommendation: 'Consider trimming impeller, modulating VFD speed, or selecting a pump model closer to your duty flow.',
    });
  }

  // Suction lift check
  if (suction.staticElevationM < -5.0) {
    warnings.push({
      id: 'warn_high_suction_lift',
      severity: 'warning',
      title: 'Severe Static Suction Lift',
      message: `Static suction lift is ${Math.abs(suction.staticElevationM).toFixed(1)} m. Suction lifts greater than 5-6m are prone to priming failure and severe vapor flashing.`,
      recommendation: 'Position the pump lower, consider a submersible pump, or add a priming booster.',
    });
  }

  return {
    designFlowM3h: flow,
    designFlowLps: Math.round(flowLps * 100) / 100,
    designFlowGpm: Math.round(flowGpm * 10) / 10,

    suctionVelocityMs: Math.round(Vs * 100) / 100,
    dischargeVelocityMs: Math.round(Vd * 100) / 100,
    suctionReynolds: Math.round(Res),
    dischargeReynolds: Math.round(Red),
    suctionRegime: regimeS,
    dischargeRegime: regimeD,

    suctionFrictionFactor: Math.round(fs * 10000) / 10000,
    dischargeFrictionFactor: Math.round(fd * 10000) / 10000,

    suctionPipeFrictionM: Math.round(hf_s * 100) / 100,
    suctionMinorLossM: Math.round(hm_s * 100) / 100,
    suctionTotalLossM: Math.round(hTotal_s * 100) / 100,

    dischargePipeFrictionM: Math.round(hf_d * 100) / 100,
    dischargeMinorLossM: Math.round(hm_d * 100) / 100,
    dischargeTotalLossM: Math.round(hTotal_d * 100) / 100,

    staticHeadM: Math.round(staticHeadM * 100) / 100,
    pressureHeadM: Math.round(pressureHeadM * 100) / 100,
    velocityHeadDiffM: Math.round(velocityHeadDiffM * 100) / 100,
    totalDynamicHeadM: Math.round(tdhM * 100) / 100,

    atmosphericPressureKPa: pAtmKPa,
    vaporPressureHeadM: Math.round(pVaporHeadM * 100) / 100,
    npshAvailableM: Math.round(npshaM * 100) / 100,
    npshRequiredM: Math.round(npshrM * 100) / 100,
    npshMarginM: Math.round(npshMarginM * 100) / 100,
    isCavitationRisk,

    hydraulicPowerKw: Math.round(hydraulicPowerKw * 100) / 100,
    pumpEfficiencyAtDuty: Math.round(pumpEff * 10) / 10,
    shaftBrakePowerKw: Math.round(shaftBrakePowerKw * 100) / 100,
    motorRecommendedKw,
    motorEfficiencyEst,
    electricalPowerKw: Math.round(electricalPowerKw * 100) / 100,
    annualOperatingCostUsd: Math.round(annualOperatingCostUsd),
    annualEnergyKwh: Math.round(annualEnergyKwh),
    annualCo2Tons: Math.round(annualCo2Tons * 10) / 10,

    systemCurvePoints,
    operatingPoint: opPoint,
    warnings,
  };
}
