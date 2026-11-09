import { FluidProperties, FittingItem, PipeMaterial, PumpModel, ProjectData } from '../types/hydraulics';

export const PIPE_MATERIALS: PipeMaterial[] = [
  {
    id: 'pvc_hdpe',
    name: 'PVC / HDPE / PE100 (Smooth Plastic)',
    roughnessMm: 0.0015,
    hazenWilliamsC: 150,
    description: 'Ultra-low friction, corrosion resistant. Standard for domestic and irrigation lines.',
  },
  {
    id: 'stainless_steel',
    name: 'Stainless Steel (AISI 304 / 316)',
    roughnessMm: 0.015,
    hazenWilliamsC: 140,
    description: 'Sanitary, chemical, food, and high-purity industrial piping.',
  },
  {
    id: 'carbon_steel',
    name: 'Commercial Carbon Steel (New Schedule 40)',
    roughnessMm: 0.045,
    hazenWilliamsC: 120,
    description: 'General industrial, chilled water, hydronic HVAC, and fire fighting systems.',
  },
  {
    id: 'ductile_iron_lined',
    name: 'Ductile Iron (Cement Mortar Lined)',
    roughnessMm: 0.025,
    hazenWilliamsC: 140,
    description: 'Municipal water distribution, transmission mains, and booster stations.',
  },
  {
    id: 'ductile_iron_unlined',
    name: 'Ductile / Cast Iron (Unlined / Aged)',
    roughnessMm: 0.25,
    hazenWilliamsC: 100,
    description: 'Heavy duty, wastewater, raw sewage, or older municipal infrastructure.',
  },
  {
    id: 'copper',
    name: 'Copper / Brass Tube',
    roughnessMm: 0.0015,
    hazenWilliamsC: 140,
    description: 'Small diameter domestic water, medical gas, and plumbing runs.',
  },
];

export const NOMINAL_DIAMETERS = [
  { nominal: 'DN25 (1")', mm: 27.3, inches: 1.07 },
  { nominal: 'DN32 (1-1/4")', mm: 36.0, inches: 1.42 },
  { nominal: 'DN40 (1-1/2")', mm: 41.9, inches: 1.65 },
  { nominal: 'DN50 (2")', mm: 53.1, inches: 2.09 },
  { nominal: 'DN65 (2-1/2")', mm: 68.8, inches: 2.71 },
  { nominal: 'DN80 (3")', mm: 80.9, inches: 3.19 },
  { nominal: 'DN100 (4")', mm: 102.3, inches: 4.03 },
  { nominal: 'DN125 (5")', mm: 128.2, inches: 5.05 },
  { nominal: 'DN150 (6")', mm: 154.1, inches: 6.07 },
  { nominal: 'DN200 (8")', mm: 202.7, inches: 7.98 },
  { nominal: 'DN250 (10")', mm: 254.5, inches: 10.02 },
  { nominal: 'DN300 (12")', mm: 304.8, inches: 12.0 },
  { nominal: 'DN350 (14")', mm: 336.5, inches: 13.25 },
  { nominal: 'DN400 (16")', mm: 387.4, inches: 15.25 },
  { nominal: 'DN500 (20")', mm: 489.0, inches: 19.25 },
];

export const FITTING_CATALOG: Omit<FittingItem, 'count'>[] = [
  { id: 'elbow_90_std', type: 'elbow_90_std', name: '90° Standard Elbow (R/D=1.0)', kFactor: 0.75, category: 'elbow' },
  { id: 'elbow_90_long', type: 'elbow_90_long', name: '90° Long Radius Elbow (R/D=1.5)', kFactor: 0.45, category: 'elbow' },
  { id: 'elbow_45_std', type: 'elbow_45_std', name: '45° Standard Elbow', kFactor: 0.35, category: 'elbow' },
  { id: 'tee_straight', type: 'tee_straight', name: 'Tee - Through Run / Straight', kFactor: 0.40, category: 'tee' },
  { id: 'tee_branch', type: 'tee_branch', name: 'Tee - Through Branch', kFactor: 1.50, category: 'tee' },
  { id: 'valve_gate_open', type: 'valve_gate_open', name: 'Gate Valve (Fully Open)', kFactor: 0.17, category: 'valve' },
  { id: 'valve_ball_open', type: 'valve_ball_open', name: 'Ball Valve (Full Port Open)', kFactor: 0.05, category: 'valve' },
  { id: 'valve_butterfly_open', type: 'valve_butterfly_open', name: 'Butterfly Valve (Open)', kFactor: 0.60, category: 'valve' },
  { id: 'valve_check_swing', type: 'valve_check_swing', name: 'Swing Check Valve (Non-Return)', kFactor: 2.00, category: 'valve' },
  { id: 'valve_check_silent', type: 'valve_check_silent', name: 'Silent / Spring Check Valve', kFactor: 2.50, category: 'valve' },
  { id: 'valve_foot_strainer', type: 'valve_foot_strainer', name: 'Foot Valve with Strainer', kFactor: 2.50, category: 'valve' },
  { id: 'strainer_y', type: 'strainer_y', name: 'Y-Strainer (Clean)', kFactor: 2.00, category: 'other' },
  { id: 'entrance_sharp', type: 'entrance_sharp', name: 'Pipe Entrance - Sharp Flush (r=0)', kFactor: 0.50, category: 'entrance_exit' },
  { id: 'entrance_rounded', type: 'entrance_rounded', name: 'Pipe Entrance - Bellmouth / Rounded', kFactor: 0.05, category: 'entrance_exit' },
  { id: 'entrance_projecting', type: 'entrance_projecting', name: 'Pipe Entrance - Inward Projecting (Borda)', kFactor: 0.80, category: 'entrance_exit' },
  { id: 'pipe_exit', type: 'pipe_exit', name: 'Pipe Discharge Exit into Tank', kFactor: 1.00, category: 'entrance_exit' },
  { id: 'reducer_concentric', type: 'reducer_concentric', name: 'Concentric Reducer / Expander', kFactor: 0.25, category: 'reducer' },
];

// Fluid generator for water based on temperature
export function getWaterProperties(tempC: number): FluidProperties {
  // Density approximation: rho = 1000 * (1 - (T + 288.9414) / (508929.2 * (T + 68.12963)) * (T - 3.9863)^2)
  const T = Math.max(0, Math.min(100, tempC));
  const density = 1000 * (1 - ((T + 288.9414) / (508929.2 * (T + 68.12963))) * Math.pow(T - 3.9863, 2));

  // Dynamic Viscosity (Pa*s) Vogel equation: mu = A * exp(B / (T_K - C))
  // approx kinematic viscosity in cSt (mm²/s):
  const tempK = T + 273.15;
  const mu_mPas = 0.02414 * Math.pow(10, 247.8 / (tempK - 140)); // mPa*s or cP
  const viscosity = mu_mPas / (density / 1000); // cSt

  // Vapor pressure Antoine equation (kPa): log10(P_bar) = A - B/(T + C)
  // For water 1-100C: A=5.20389, B=1733.926, C=-39.485 (in Kelvin or Celsius)
  // P_sat in kPa:
  const vaporPressureKPa = 0.61078 * Math.exp((17.27 * T) / (T + 237.3));

  return {
    id: `water_${Math.round(T)}c`,
    name: `Pure Water @ ${Math.round(T)}°C`,
    category: 'water',
    temperatureC: T,
    density: Math.round(density * 10) / 10,
    viscosity: Math.round(viscosity * 1000) / 1000,
    vaporPressureKPa: Math.round(vaporPressureKPa * 100) / 100,
    specificGravity: Math.round((density / 1000) * 1000) / 1000,
  };
}

export const PRESET_FLUIDS: FluidProperties[] = [
  getWaterProperties(20), // Standard water 20C
  getWaterProperties(60), // Hot water 60C
  getWaterProperties(85), // Boiler feed 85C
  {
    id: 'sea_water_20c',
    name: 'Seawater (Salinity 3.5%) @ 20°C',
    category: 'water',
    temperatureC: 20,
    density: 1025.0,
    viscosity: 1.08,
    vaporPressureKPa: 2.30,
    specificGravity: 1.025,
  },
  {
    id: 'glycol_30',
    name: 'Ethylene Glycol 30% Solution @ 20°C',
    category: 'glycol',
    temperatureC: 20,
    density: 1042.0,
    viscosity: 2.65,
    vaporPressureKPa: 2.10,
    specificGravity: 1.042,
  },
  {
    id: 'glycol_50',
    name: 'Ethylene Glycol 50% Solution @ 20°C',
    category: 'glycol',
    temperatureC: 20,
    density: 1075.0,
    viscosity: 5.20,
    vaporPressureKPa: 1.80,
    specificGravity: 1.075,
  },
  {
    id: 'diesel_fuel',
    name: 'Diesel Fuel #2 @ 20°C',
    category: 'fuel',
    temperatureC: 20,
    density: 845.0,
    viscosity: 3.20,
    vaporPressureKPa: 0.15,
    specificGravity: 0.845,
  },
  {
    id: 'raw_sewage',
    name: 'Municipal Wastewater / Raw Sewage',
    category: 'slurry',
    temperatureC: 20,
    density: 1020.0,
    viscosity: 1.25,
    vaporPressureKPa: 2.34,
    specificGravity: 1.02,
  },
];

// Pump models catalog
export const PUMP_CATALOG: PumpModel[] = [
  {
    id: 'hydro_es_100_250',
    manufacturer: 'HydroPro Engineering',
    model: 'HP-ES 100-250 (End Suction Centrifugal)',
    type: 'centrifugal_end_suction',
    rpm: 2950,
    impellerDiameterMm: 250,
    bepFlow: 120, // m³/h
    bepHead: 65, // m
    bepEfficiency: 79, // %
    shutoffHead: 82,
    maxFlow: 175,
    motorRatingKw: 37,
    a0: 82,
    a1: -0.045,
    a2: -0.0008,
    curvePoints: [
      { flow: 0, head: 82, efficiency: 0, npshr: 2.1, powerKw: 14.5 },
      { flow: 40, head: 79.5, efficiency: 52, npshr: 2.4, powerKw: 17.5 },
      { flow: 80, head: 74, efficiency: 71, npshr: 2.9, powerKw: 22.8 },
      { flow: 120, head: 65, efficiency: 79, npshr: 3.6, powerKw: 28.5 },
      { flow: 150, head: 54, efficiency: 74, npshr: 4.8, powerKw: 31.8 },
      { flow: 175, head: 41, efficiency: 62, npshr: 6.2, powerKw: 33.5 },
    ],
  },
  {
    id: 'hydro_multi_65_8',
    manufacturer: 'HydroPro MultiStage',
    model: 'HP-CR 65-8 (Vertical Multistage High Head)',
    type: 'multistage_booster',
    rpm: 2900,
    impellerDiameterMm: 160,
    bepFlow: 65,
    bepHead: 140,
    bepEfficiency: 76,
    shutoffHead: 175,
    maxFlow: 90,
    motorRatingKw: 45,
    a0: 175,
    a1: -0.15,
    a2: -0.0042,
    curvePoints: [
      { flow: 0, head: 175, efficiency: 0, npshr: 1.8, powerKw: 18.0 },
      { flow: 25, head: 168, efficiency: 56, npshr: 2.1, powerKw: 23.5 },
      { flow: 50, head: 153, efficiency: 73, npshr: 2.8, powerKw: 31.0 },
      { flow: 65, head: 140, efficiency: 76, npshr: 3.4, powerKw: 34.8 },
      { flow: 80, head: 118, efficiency: 70, npshr: 4.4, powerKw: 36.5 },
      { flow: 90, head: 95, efficiency: 58, npshr: 5.6, powerKw: 37.0 },
    ],
  },
  {
    id: 'hydro_sewage_150',
    manufacturer: 'HydroVortex Submersible',
    model: 'HP-VX 150-40 (Solids Handling Vortex)',
    type: 'submersible_wastewater',
    rpm: 1450,
    impellerDiameterMm: 310,
    bepFlow: 180,
    bepHead: 22,
    bepEfficiency: 72,
    shutoffHead: 31,
    maxFlow: 260,
    motorRatingKw: 22,
    a0: 31,
    a1: -0.018,
    a2: -0.00018,
    curvePoints: [
      { flow: 0, head: 31, efficiency: 0, npshr: 1.5, powerKw: 6.8 },
      { flow: 60, head: 29.5, efficiency: 48, npshr: 1.8, powerKw: 9.9 },
      { flow: 120, head: 26.5, efficiency: 66, npshr: 2.4, powerKw: 13.8 },
      { flow: 180, head: 22.0, efficiency: 72, npshr: 3.2, powerKw: 17.5 },
      { flow: 220, head: 17.5, efficiency: 68, npshr: 4.0, powerKw: 19.2 },
      { flow: 260, head: 12.0, efficiency: 55, npshr: 5.5, powerKw: 20.1 },
    ],
  },
  {
    id: 'hydro_sp_8_15',
    manufacturer: 'HydroSub Pro DeepWell',
    model: 'SP 8-15 (4" Multistage Borehole Submersible)',
    type: 'submersible_borehole',
    rpm: 2900,
    impellerDiameterMm: 98,
    bepFlow: 8.0,
    bepHead: 75.0,
    bepEfficiency: 74,
    shutoffHead: 96,
    maxFlow: 11.5,
    motorRatingKw: 3.0,
    stages: 15,
    casingDiameterInches: 4,
    a0: 96,
    a1: 0,
    a2: -0.327,
    curvePoints: [
      { flow: 0, head: 96, efficiency: 0, npshr: 1.2, powerKw: 1.4 },
      { flow: 3, head: 93, efficiency: 45, npshr: 1.4, powerKw: 1.9 },
      { flow: 6, head: 84, efficiency: 68, npshr: 1.8, powerKw: 2.4 },
      { flow: 8, head: 75, efficiency: 74, npshr: 2.2, powerKw: 2.8 },
      { flow: 10, head: 63, efficiency: 66, npshr: 2.9, powerKw: 3.0 },
      { flow: 11.5, head: 52, efficiency: 52, npshr: 3.6, powerKw: 3.1 },
    ],
  },
  {
    id: 'hydro_sp_60_24',
    manufacturer: 'HydroSub Pro DeepWell',
    model: '6SP60-24 (6" Multistage Borehole Submersible - 24 Stages)',
    type: 'submersible_borehole',
    rpm: 2900,
    impellerDiameterMm: 142,
    bepFlow: 60.0,
    bepHead: 141.6,
    bepEfficiency: 81,
    shutoffHead: 184.8,
    maxFlow: 78.0,
    motorRatingKw: 30.0,
    stages: 24,
    casingDiameterInches: 8,
    a0: 184.8,
    a1: 0,
    a2: -0.012,
    curvePoints: [
      { flow: 0, head: 184.8, efficiency: 0, npshr: 1.5, powerKw: 14.2 },
      { flow: 20, head: 180.0, efficiency: 52, npshr: 1.8, powerKw: 19.5 },
      { flow: 40, head: 165.6, efficiency: 72, npshr: 2.2, powerKw: 24.8 },
      { flow: 54, head: 149.8, efficiency: 80.2, npshr: 2.6, powerKw: 27.2 },
      { flow: 60, head: 141.6, efficiency: 81.0, npshr: 2.9, powerKw: 28.5 },
      { flow: 70, head: 126.0, efficiency: 76.0, npshr: 3.5, powerKw: 30.1 },
      { flow: 78, head: 111.8, efficiency: 68.0, npshr: 4.2, powerKw: 31.0 },
    ],
  },
  {
    id: 'hydro_split_250_350',
    manufacturer: 'HydroMax Heavy',
    model: 'HP-SC 250-350 (Axially Split Case High Flow)',
    type: 'split_case',
    rpm: 1480,
    impellerDiameterMm: 420,
    bepFlow: 450,
    bepHead: 48,
    bepEfficiency: 84,
    shutoffHead: 62,
    maxFlow: 650,
    motorRatingKw: 90,
    a0: 62,
    a1: -0.012,
    a2: -0.000042,
    curvePoints: [
      { flow: 0, head: 62, efficiency: 0, npshr: 2.5, powerKw: 32.0 },
      { flow: 150, head: 59, efficiency: 58, npshr: 2.8, powerKw: 42.5 },
      { flow: 300, head: 55, efficiency: 78, npshr: 3.6, powerKw: 58.0 },
      { flow: 450, head: 48, efficiency: 84, npshr: 4.8, powerKw: 71.0 },
      { flow: 550, head: 40, efficiency: 80, npshr: 6.2, powerKw: 78.5 },
      { flow: 650, head: 29, efficiency: 68, npshr: 8.5, powerKw: 82.0 },
    ],
  },
];

// Pre-configured engineering templates
export const PROJECT_TEMPLATES: Record<string, ProjectData> = {
  booster_station: {
    id: 'tmpl_booster',
    name: 'Municipal Potable Water Booster Station',
    clientName: 'Metropolitan Water District',
    projectNumber: 'MWD-2026-B04',
    engineerName: 'Alex Mercer, P.E.',
    date: '2026-11-09',
    revision: 'Rev. 02 - Issued for Bid',
    notes: 'Primary booster station delivering treated potable water from clearwell reservoir to North Ridge zone reservoir. Designed with 100% duty + standby pump arrangement.',
    unitSystem: 'metric',
    designFlowM3h: 120,
    operatingHoursPerDay: 16,
    electricityCostPerKwh: 0.14,
    calculationMethod: 'darcy_weisbach',
    altitudeM: 250,
    fluid: getWaterProperties(20),
    suction: {
      id: 'suction',
      name: 'Suction Line (from Clearwell)',
      lengthM: 18,
      diameterMm: 154.1, // DN150
      materialId: 'ductile_iron_lined',
      roughnessMm: 0.025,
      staticElevationM: 2.5, // Flooded suction +2.5m
      terminalPressureKPa: 0, // Atmospheric clearwell
      fittings: [
        { id: 'f1', type: 'entrance_bellmouth', name: 'Pipe Entrance - Bellmouth / Rounded', kFactor: 0.05, count: 1, category: 'entrance_exit' },
        { id: 'f2', type: 'valve_gate_open', name: 'Gate Valve (Fully Open)', kFactor: 0.17, count: 1, category: 'valve' },
        { id: 'f3', type: 'elbow_90_long', name: '90° Long Radius Elbow', kFactor: 0.45, count: 2, category: 'elbow' },
        { id: 'f4', type: 'reducer_concentric', name: 'Concentric Reducer', kFactor: 0.25, count: 1, category: 'reducer' },
      ],
    },
    discharge: {
      id: 'discharge',
      name: 'Discharge Main (to North Ridge Reservoir)',
      lengthM: 650,
      diameterMm: 154.1, // DN150
      materialId: 'ductile_iron_lined',
      roughnessMm: 0.025,
      staticElevationM: 42.0, // Static lift 42m
      terminalPressureKPa: 50, // Residual pressure at reservoir nozzle 0.5 bar
      fittings: [
        { id: 'f5', type: 'reducer_concentric', name: 'Concentric Expander', kFactor: 0.25, count: 1, category: 'reducer' },
        { id: 'f6', type: 'valve_check_silent', name: 'Silent / Spring Check Valve', kFactor: 2.50, count: 1, category: 'valve' },
        { id: 'f7', type: 'valve_gate_open', name: 'Gate Valve (Fully Open)', kFactor: 0.17, count: 2, category: 'valve' },
        { id: 'f8', type: 'elbow_90_long', name: '90° Long Radius Elbow', kFactor: 0.45, count: 6, category: 'elbow' },
        { id: 'f9', type: 'elbow_45_std', name: '45° Standard Elbow', kFactor: 0.35, count: 4, category: 'elbow' },
        { id: 'f10', type: 'pipe_exit', name: 'Discharge Exit into Tank', kFactor: 1.00, count: 1, category: 'entrance_exit' },
      ],
    },
    selectedPumpId: 'hydro_es_100_250',
    vfdSpeedRatio: 1.0,
    pumpConfiguration: 'single',
  },

  chilled_water: {
    id: 'tmpl_chilled',
    name: 'HVAC Chilled Water Closed Circulation Loop',
    clientName: 'Apex Data Centers Ltd',
    projectNumber: 'ADC-HVAC-901',
    engineerName: 'Sarah Lin, CEng MIMechE',
    date: '2026-11-09',
    revision: 'Rev. 01 - Conceptual Design',
    notes: 'Secondary chilled water distribution with 30% Ethylene Glycol at 6°C supply to computer room air handlers (CRAH). Closed hydraulic loop with zero net static lift.',
    unitSystem: 'metric',
    designFlowM3h: 70,
    operatingHoursPerDay: 24,
    electricityCostPerKwh: 0.12,
    calculationMethod: 'darcy_weisbach',
    altitudeM: 50,
    fluid: {
      id: 'glycol_30_cold',
      name: 'Ethylene Glycol 30% @ 6°C',
      category: 'glycol',
      temperatureC: 6,
      density: 1048.0,
      viscosity: 4.10,
      vaporPressureKPa: 0.85,
      specificGravity: 1.048,
    },
    suction: {
      id: 'suction',
      name: 'Suction Header (from Chiller Evaporator)',
      lengthM: 35,
      diameterMm: 128.2, // DN125
      materialId: 'carbon_steel',
      roughnessMm: 0.045,
      staticElevationM: 0, // Closed loop
      terminalPressureKPa: 220, // Closed loop expansion tank baseline 2.2 bar
      fittings: [
        { id: 'c1', type: 'valve_butterfly_open', name: 'Butterfly Valve', kFactor: 0.60, count: 1, category: 'valve' },
        { id: 'c2', type: 'strainer_y', name: 'Y-Strainer (Clean)', kFactor: 2.00, count: 1, category: 'other' },
        { id: 'c3', type: 'elbow_90_std', name: '90° Standard Elbow', kFactor: 0.75, count: 3, category: 'elbow' },
      ],
    },
    discharge: {
      id: 'discharge',
      name: 'Discharge Distribution & CRAH Coil Run',
      lengthM: 280,
      diameterMm: 102.3, // DN100
      materialId: 'carbon_steel',
      roughnessMm: 0.045,
      staticElevationM: 0, // Closed loop net static head is 0
      terminalPressureKPa: 220, // Returns to closed suction
      fittings: [
        { id: 'c4', type: 'valve_check_silent', name: 'Silent / Spring Check Valve', kFactor: 2.50, count: 1, category: 'valve' },
        { id: 'c5', type: 'valve_butterfly_open', name: 'Butterfly Valve', kFactor: 0.60, count: 3, category: 'valve' },
        { id: 'c6', type: 'elbow_90_std', name: '90° Standard Elbow', kFactor: 0.75, count: 12, category: 'elbow' },
        { id: 'c7', type: 'tee_straight', name: 'Tee - Straight', kFactor: 0.40, count: 8, category: 'tee' },
      ],
    },
    selectedPumpId: 'hydro_multi_65_8',
    vfdSpeedRatio: 0.92, // Modulated via VFD
    pumpConfiguration: 'single',
  },

  wastewater_lift: {
    id: 'tmpl_sewage',
    name: 'Municipal Wastewater Lift Station #3',
    clientName: 'City Environmental Services',
    projectNumber: 'WWT-LS-304',
    engineerName: 'Marcus Vance, P.E.',
    date: '2026-11-09',
    revision: 'Rev. 03 - Final Approval',
    notes: 'Wet well submersible sewage lift station pumping unscreened domestic wastewater through a 450m force main to the regional interceptor.',
    unitSystem: 'metric',
    designFlowM3h: 180,
    operatingHoursPerDay: 8,
    electricityCostPerKwh: 0.16,
    calculationMethod: 'darcy_weisbach',
    altitudeM: 120,
    fluid: {
      id: 'raw_sewage',
      name: 'Municipal Wastewater / Raw Sewage',
      category: 'slurry',
      temperatureC: 18,
      density: 1020.0,
      viscosity: 1.25,
      vaporPressureKPa: 2.10,
      specificGravity: 1.02,
    },
    suction: {
      id: 'suction',
      name: 'Wet Well Submersible Intake',
      lengthM: 3.5,
      diameterMm: 202.7, // DN200
      materialId: 'ductile_iron_unlined',
      roughnessMm: 0.25,
      staticElevationM: 1.8, // Liquid level above impeller
      terminalPressureKPa: 0,
      fittings: [
        { id: 'w1', type: 'entrance_bellmouth', name: 'Bellmouth Suction Horn', kFactor: 0.10, count: 1, category: 'entrance_exit' },
      ],
    },
    discharge: {
      id: 'discharge',
      name: 'Force Main to Interceptor Manhole',
      lengthM: 450,
      diameterMm: 202.7, // DN200
      materialId: 'pvc_hdpe',
      roughnessMm: 0.0015,
      staticElevationM: 14.5, // Lift from wet well low water to discharge manhole
      terminalPressureKPa: 0, // Gravity discharge
      fittings: [
        { id: 'w2', type: 'valve_check_swing', name: 'Swing Check Valve with Lever', kFactor: 2.00, count: 1, category: 'valve' },
        { id: 'w3', type: 'valve_gate_open', name: 'Gate Valve (Fully Open)', kFactor: 0.17, count: 1, category: 'valve' },
        { id: 'w4', type: 'elbow_90_long', name: '90° Long Radius Elbow', kFactor: 0.45, count: 4, category: 'elbow' },
        { id: 'w5', type: 'pipe_exit', name: 'Discharge into Gravity Manhole', kFactor: 1.00, count: 1, category: 'entrance_exit' },
      ],
    },
    selectedPumpId: 'hydro_sewage_150',
    vfdSpeedRatio: 1.0,
    pumpConfiguration: 'single',
  },

  borehole_well: {
    id: 'tmpl_borehole',
    name: 'Deep Borehole Well & Elevated Reservoir Supply',
    clientName: 'Highland Water Works & Agro Estate',
    projectNumber: 'BW-2026-99M-15LPS',
    engineerName: 'Alex Mercer, P.E.',
    date: '2026-11-09',
    revision: 'Rev. 02 - Case Sizing Study',
    notes: 'Submersible borehole pump installed at 99m depth inside 8" cased well. Pumping 15 L/s (54 m³/h) through 99m PVC DN100 (ID 102.3mm) riser column, continuing via 250m PEHD DN200 (ID 202.7mm) pipeline climbing +40m altitude to elevated storage reservoir.',
    unitSystem: 'metric',
    designFlowM3h: 54.0, // 15 L/s
    operatingHoursPerDay: 12,
    electricityCostPerKwh: 0.14,
    calculationMethod: 'darcy_weisbach',
    altitudeM: 450,
    fluid: getWaterProperties(16),
    suction: {
      id: 'suction',
      name: 'Submerged Intake & Well Screen (-99m)',
      lengthM: 2.0,
      diameterMm: 142.0, // 6" Submersible intake
      materialId: 'stainless_steel',
      roughnessMm: 0.015,
      staticElevationM: 49.0, // Submerged depth below dynamic water level
      terminalPressureKPa: 0,
      fittings: [
        { id: 'bh1', type: 'valve_foot_strainer', name: 'Integrated Suction Strainer & Screen', kFactor: 1.20, count: 1, category: 'valve' },
      ],
    },
    discharge: {
      id: 'discharge',
      name: '99m PVC DN100 Riser + 250m PEHD DN200 to +40m Reservoir',
      lengthM: 349, // 99m vertical riser + 250m surface line
      diameterMm: 102.3, // PVC DN100 riser
      materialId: 'pvc_hdpe',
      roughnessMm: 0.0015,
      staticElevationM: 139.0, // 99m borehole depth + 40m reservoir altitude
      terminalPressureKPa: 30, // 0.3 bar residual tank discharge
      fittings: [
        { id: 'bh2', type: 'valve_check_silent', name: 'Submersible Non-Return Valve', kFactor: 2.50, count: 1, category: 'valve' },
        { id: 'bh3', type: 'valve_gate_open', name: 'Wellhead Isolating Gate Valve', kFactor: 0.17, count: 1, category: 'valve' },
        { id: 'bh4', type: 'elbow_90_long', name: '90° Long Radius Elbows', kFactor: 0.45, count: 4, category: 'elbow' },
        { id: 'bh5', type: 'pipe_exit', name: 'Discharge into Reservoir Tank', kFactor: 1.00, count: 1, category: 'entrance_exit' },
      ],
    },
    selectedPumpId: 'hydro_sp_60_24',
    vfdSpeedRatio: 1.0,
    pumpConfiguration: 'single',
  },
};
