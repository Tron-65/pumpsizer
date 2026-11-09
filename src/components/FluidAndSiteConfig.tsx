import React from 'react';
import { ProjectData, FluidProperties } from '../types/hydraulics';
import { PRESET_FLUIDS, getWaterProperties } from '../data/defaultCatalog';
import {
  UNIT_LABELS,
  lengthToDisplay,
  lengthFromDisplay,
  tempToDisplay,
  tempFromDisplay,
} from '../utils/units';
import { getAtmosphericPressureKPa } from '../utils/engineering';
import { Droplet, Mountain, Thermometer, Clock, DollarSign, Wind } from 'lucide-react';

interface Props {
  project: ProjectData;
  onUpdateProject: (updater: (prev: ProjectData) => ProjectData) => void;
}

export const FluidAndSiteConfig: React.FC<Props> = ({ project, onUpdateProject }) => {
  const { unitSystem, fluid, altitudeM, operatingHoursPerDay, electricityCostPerKwh } = project;
  const labels = UNIT_LABELS[unitSystem];

  const pAtmKPa = getAtmosphericPressureKPa(altitudeM);
  const pAtmDisplay =
    unitSystem === 'imperial'
      ? (pAtmKPa * 0.145038).toFixed(2) + ' psi'
      : (pAtmKPa / 100).toFixed(3) + ' bar';

  const handleSelectFluidPreset = (presetId: string) => {
    if (presetId === 'custom') {
      onUpdateProject((prev) => ({
        ...prev,
        fluid: {
          ...prev.fluid,
          id: 'custom',
          name: 'Custom Fluid Specification',
          category: 'custom',
        },
      }));
      return;
    }

    const preset = PRESET_FLUIDS.find((p) => p.id === presetId);
    if (preset) {
      onUpdateProject((prev) => ({
        ...prev,
        fluid: { ...preset },
      }));
    }
  };

  const handleTemperatureChange = (tempC: number) => {
    const clampedC = Math.max(0, Math.min(100, tempC));
    if (fluid.category === 'water') {
      const updated = getWaterProperties(clampedC);
      onUpdateProject((prev) => ({
        ...prev,
        fluid: { ...updated },
      }));
    } else {
      onUpdateProject((prev) => ({
        ...prev,
        fluid: { ...prev.fluid, temperatureC: clampedC },
      }));
    }
  };

  const handleUpdateFluidField = (field: keyof FluidProperties, val: any) => {
    onUpdateProject((prev) => ({
      ...prev,
      fluid: {
        ...prev.fluid,
        [field]: val,
      },
    }));
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Droplet className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Fluid & Site Ambient Conditions</h3>
            <p className="text-[11px] text-slate-400">
              Thermodynamic properties, vapor pressure for NPSH, and atmospheric barometric datum
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* Column 1: Fluid Selector & Temp */}
        <div className="space-y-3">
          <div>
            <label className="text-slate-400 mb-1 block">Fluid Type / Preset:</label>
            <select
              value={fluid.category === 'custom' ? 'custom' : fluid.id}
              onChange={(e) => handleSelectFluidPreset(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              {PRESET_FLUIDS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
              <option value="custom">Custom Fluid Properties...</option>
            </select>
          </div>

          {/* Temperature Slider */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400 flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                Fluid Temperature:
              </span>
              <span className="font-mono text-cyan-400 font-bold">
                {tempToDisplay(fluid.temperatureC, unitSystem).toFixed(0)} {labels.temperature}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={fluid.temperatureC}
              onChange={(e) => handleTemperatureChange(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Adjusting temperature recalculates density, viscosity, and vapor pressure.
            </span>
          </div>
        </div>

        {/* Column 2: Physical properties */}
        <div className="space-y-3 bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-400 block mb-0.5">Density (ρ):</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="any"
                  value={fluid.density}
                  onChange={(e) => handleUpdateFluidField('density', parseFloat(e.target.value) || 1000)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 font-mono text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
                />
                <span className="text-[10px] text-slate-500 font-mono">kg/m³</span>
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-0.5">Viscosity (ν):</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="any"
                  value={fluid.viscosity}
                  onChange={(e) => handleUpdateFluidField('viscosity', parseFloat(e.target.value) || 1.0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 font-mono text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
                />
                <span className="text-[10px] text-slate-500 font-mono">cSt</span>
              </div>
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-0.5">Vapor Pressure (P_v abs):</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="any"
                value={fluid.vaporPressureKPa}
                onChange={(e) => handleUpdateFluidField('vaporPressureKPa', parseFloat(e.target.value) || 2.3)}
                className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 font-mono text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-500 font-mono">kPa abs</span>
              <span className="text-[11px] text-slate-400 ml-auto">
                Head: {((fluid.vaporPressureKPa * 1000) / (fluid.density * 9.80665)).toFixed(2)} m
              </span>
            </div>
          </div>
        </div>

        {/* Column 3: Site Elevation & OPEX inputs */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-400 flex items-center gap-1">
                <Mountain className="w-3.5 h-3.5 text-cyan-400" />
                Site Altitude / Elevation:
              </label>
              <span className="font-mono text-slate-200">
                {lengthToDisplay(altitudeM, unitSystem).toFixed(0)} {labels.elevation}
              </span>
            </div>
            <input
              type="number"
              step="any"
              min="0"
              max="6000"
              value={Number(lengthToDisplay(altitudeM, unitSystem).toFixed(0))}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                onUpdateProject((prev) => ({
                  ...prev,
                  altitudeM: lengthFromDisplay(val, unitSystem),
                }));
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
            />
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
              <span>Barometric P_atm:</span>
              <span className="font-mono text-cyan-400 font-semibold">{pAtmDisplay}</span>
            </div>
          </div>

          {/* Operating hours & Tariff */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="text-slate-400 text-[11px] block mb-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                Duty (hrs/day):
              </label>
              <input
                type="number"
                min="1"
                max="24"
                value={operatingHoursPerDay}
                onChange={(e) =>
                  onUpdateProject((prev) => ({
                    ...prev,
                    operatingHoursPerDay: Math.max(1, Math.min(24, parseInt(e.target.value) || 16)),
                  }))
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 font-mono text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-slate-400 text-[11px] block mb-0.5 flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-slate-500" />
                Cost ($/kWh):
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={electricityCostPerKwh}
                onChange={(e) =>
                  onUpdateProject((prev) => ({
                    ...prev,
                    electricityCostPerKwh: parseFloat(e.target.value) || 0.12,
                  }))
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 font-mono text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
