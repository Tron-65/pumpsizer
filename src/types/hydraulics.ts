export type UnitSystem = 'metric' | 'imperial';

export interface FluidProperties {
  id: string;
  name: string;
  category: 'water' | 'glycol' | 'fuel' | 'slurry' | 'custom';
  temperatureC: number; // always stored in base metric
  density: number; // kg/m³
  viscosity: number; // cSt (kinematic)
  vaporPressureKPa: number; // kPa absolute
  specificGravity: number;
}

export interface PipeMaterial {
  id: string;
  name: string;
  roughnessMm: number; // mm
  hazenWilliamsC: number;
  description: string;
}

export interface FittingItem {
  id: string;
  type: string;
  name: string;
  kFactor: number;
  count: number;
  category: 'valve' | 'elbow' | 'tee' | 'reducer' | 'entrance_exit' | 'other';
}

export interface PipeSegment {
  id: 'suction' | 'discharge';
  name: string;
  lengthM: number; // meters
  diameterMm: number; // internal diameter in mm
  materialId: string;
  roughnessMm: number;
  staticElevationM: number; // elevation relative to pump centerline (negative for suction lift, positive for flooded)
  terminalPressureKPa: number; // gauge pressure at reservoir or outlet (kPa gauge)
  fittings: FittingItem[];
}

export interface PumpPoint {
  flow: number; // m³/h
  head: number; // m
  efficiency?: number; // %
  npshr?: number; // m
  powerKw?: number; // kW
}

export interface PumpModel {
  id: string;
  manufacturer: string;
  model: string;
  type: 'centrifugal_end_suction' | 'multistage_booster' | 'submersible_wastewater' | 'submersible_borehole' | 'split_case';
  rpm: number;
  impellerDiameterMm: number;
  bepFlow: number; // Best Efficiency Point flow m³/h
  bepHead: number; // m
  bepEfficiency: number; // %
  shutoffHead: number; // m at zero flow
  maxFlow: number; // m³/h
  curvePoints: PumpPoint[];
  // Quadratic fit coefficients for H(Q) = a0 + a1*Q + a2*Q^2
  a0: number;
  a1: number;
  a2: number;
  motorRatingKw: number;
  stages?: number; // for multistage borehole pumps
  casingDiameterInches?: number;
}

export interface BoreholeSizingInput {
  targetFlowM3h: number;
  targetHeadM: number;
  useDetailedWellHeadCalc: boolean;

  // Well Geometry (optional detailed calculation)
  wellDepthM: number;
  staticWaterLevelM: number; // Depth to resting water table
  drawdownM: number; // Water level drop at target flow
  pumpSettingDepthM: number; // Installation depth below wellhead
  surfaceElevationLiftM: number; // Vertical rise from wellhead to storage tank
  surfacePipeLengthM: number;
  surfacePipeDiameterMm: number;
  casingDiameterInches: number; // e.g. 4", 5", 6", 8"
  riserPipeDiameterMm: number; // drop pipe internal diameter
  residualPressureBar: number; // e.g. 2.5 bar for pressure tank or 0 for gravity tank

  // Electrical Cable
  supplyVoltage: 230 | 400; // 1-phase 230V or 3-phase 400V
  cableLengthM: number;
  cableSizeMm2: number;
}

export interface BoreholeSizingResult {
  targetFlowM3h: number;
  calculatedTdhM: number;
  dynamicWaterLevelM: number;
  staticWaterHeadM: number;
  riserFrictionLossM: number;
  surfaceFrictionLossM: number;
  residualPressureHeadM: number;

  // Sized Pump
  recommendedModel: string;
  pumpFamily: string;
  numberOfStages: number;
  headPerStageM: number;
  shutoffHeadM: number;
  efficiencyAtDuty: number;
  shaftPowerKw: number;
  motorRatingKw: number;
  motorRatingHp: number;

  // Diagnostics & Cooling
  motorCoolingVelocityMs: number;
  isCoolingSleeveRequired: boolean;
  cableVoltageDropPercent: number;
  isCableAdequate: boolean;
  casingClearanceMm: number;
}

export interface HydraulicCalculationResults {
  designFlowM3h: number;
  designFlowLps: number;
  designFlowGpm: number;

  // Velocities
  suctionVelocityMs: number;
  dischargeVelocityMs: number;
  suctionReynolds: number;
  dischargeReynolds: number;
  suctionRegime: 'laminar' | 'transition' | 'turbulent';
  dischargeRegime: 'laminar' | 'transition' | 'turbulent';

  // Friction factors
  suctionFrictionFactor: number;
  dischargeFrictionFactor: number;

  // Head loss breakdown
  suctionPipeFrictionM: number;
  suctionMinorLossM: number;
  suctionTotalLossM: number;

  dischargePipeFrictionM: number;
  dischargeMinorLossM: number;
  dischargeTotalLossM: number;

  staticHeadM: number; // discharge elevation - suction elevation
  pressureHeadM: number; // (P_discharge - P_suction) / (rho * g)
  velocityHeadDiffM: number; // (Vd^2 - Vs^2) / (2g)
  totalDynamicHeadM: number; // TDH in meters

  // NPSH
  atmosphericPressureKPa: number;
  vaporPressureHeadM: number;
  npshAvailableM: number;
  npshRequiredM: number;
  npshMarginM: number;
  isCavitationRisk: boolean;

  // Power
  hydraulicPowerKw: number;
  pumpEfficiencyAtDuty: number;
  shaftBrakePowerKw: number;
  motorRecommendedKw: number;
  motorEfficiencyEst: number;
  electricalPowerKw: number;
  annualOperatingCostUsd: number;
  annualEnergyKwh: number;
  annualCo2Tons: number;

  // System curve points for plotting
  systemCurvePoints: { flow: number; head: number; frictionHead: number; staticHead: number }[];

  // Operating Point (Intersection of Pump and System)
  operatingPoint?: {
    flowM3h: number;
    headM: number;
    efficiency: number;
    powerKw: number;
    npshrM: number;
    npshaM: number;
    flowMismatchPercent: number;
  };

  // Validation Warnings
  warnings: EngineeringWarning[];
}

export interface EngineeringWarning {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  recommendation: string;
}

export interface ProjectData {
  id: string;
  name: string;
  clientName: string;
  projectNumber: string;
  engineerName: string;
  date: string;
  revision: string;
  notes: string;
  unitSystem: UnitSystem;

  // Design Target
  designFlowM3h: number;
  operatingHoursPerDay: number;
  electricityCostPerKwh: number;
  calculationMethod: 'darcy_weisbach' | 'hazen_williams';

  // Site & Fluid
  altitudeM: number;
  fluid: FluidProperties;

  // Piping
  suction: PipeSegment;
  discharge: PipeSegment;

  // Pump & Speed Control
  selectedPumpId: string;
  customPump?: PumpModel;
  vfdSpeedRatio: number; // 0.5 to 1.2 (1.0 = 100% rated speed)
  pumpConfiguration: 'single' | 'parallel_2' | 'parallel_3' | 'series_2';
}
