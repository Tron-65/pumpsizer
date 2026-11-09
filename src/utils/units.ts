import { UnitSystem } from '../types/hydraulics';

// Base storage is always SI Metric:
// Flow: m³/h
// Head: meters (m)
// Pressure: kPa
// Length / Elevation: meters (m)
// Diameter / Roughness: mm
// Power: kW
// Temperature: °C
// Density: kg/m³
// Viscosity: cSt (mm²/s)

export const UNIT_LABELS = {
  metric: {
    flow: 'm³/h',
    flowSmall: 'L/s',
    head: 'm',
    length: 'm',
    diameter: 'mm',
    roughness: 'mm',
    pressure: 'bar',
    pressureKPa: 'kPa',
    velocity: 'm/s',
    power: 'kW',
    temperature: '°C',
    density: 'kg/m³',
    viscosity: 'cSt',
    elevation: 'm',
  },
  imperial: {
    flow: 'GPM',
    flowSmall: 'GPM',
    head: 'ft',
    length: 'ft',
    diameter: 'in',
    roughness: 'in',
    pressure: 'psi',
    pressureKPa: 'psi',
    velocity: 'ft/s',
    power: 'HP',
    temperature: '°F',
    density: 'lb/ft³',
    viscosity: 'cSt',
    elevation: 'ft',
  },
};

// Conversions
export function flowToDisplay(m3h: number, system: UnitSystem): number {
  return system === 'imperial' ? m3h * 4.40287 : m3h;
}

export function flowFromDisplay(val: number, system: UnitSystem): number {
  return system === 'imperial' ? val / 4.40287 : val;
}

export function headToDisplay(m: number, system: UnitSystem): number {
  return system === 'imperial' ? m * 3.28084 : m;
}

export function headFromDisplay(val: number, system: UnitSystem): number {
  return system === 'imperial' ? val / 3.28084 : val;
}

export function lengthToDisplay(m: number, system: UnitSystem): number {
  return system === 'imperial' ? m * 3.28084 : m;
}

export function lengthFromDisplay(val: number, system: UnitSystem): number {
  return system === 'imperial' ? val / 3.28084 : val;
}

export function diameterToDisplay(mm: number, system: UnitSystem): number {
  return system === 'imperial' ? mm / 25.4 : mm;
}

export function diameterFromDisplay(val: number, system: UnitSystem): number {
  return system === 'imperial' ? val * 25.4 : val;
}

export function roughnessToDisplay(mm: number, system: UnitSystem): number {
  return system === 'imperial' ? mm / 25.4 : mm;
}

export function roughnessFromDisplay(val: number, system: UnitSystem): number {
  return system === 'imperial' ? val * 25.4 : val;
}

export function pressureKPaToDisplay(kPa: number, system: UnitSystem): number {
  // Metric displays bar (1 bar = 100 kPa), Imperial displays psi (1 psi = 6.89476 kPa)
  return system === 'imperial' ? kPa * 0.145038 : kPa / 100;
}

export function pressureKPaFromDisplay(val: number, system: UnitSystem): number {
  return system === 'imperial' ? val / 0.145038 : val * 100;
}

export function velocityToDisplay(ms: number, system: UnitSystem): number {
  return system === 'imperial' ? ms * 3.28084 : ms;
}

export function powerToDisplay(kw: number, system: UnitSystem): number {
  return system === 'imperial' ? kw * 1.34102 : kw;
}

export function tempToDisplay(c: number, system: UnitSystem): number {
  return system === 'imperial' ? (c * 9) / 5 + 32 : c;
}

export function tempFromDisplay(val: number, system: UnitSystem): number {
  return system === 'imperial' ? ((val - 32) * 5) / 9 : val;
}

export function densityToDisplay(kgm3: number, system: UnitSystem): number {
  return system === 'imperial' ? kgm3 * 0.062428 : kgm3;
}

export function formatNum(val: number, decimals: number = 2): string {
  if (isNaN(val) || !isFinite(val)) return '0.00';
  return val.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
