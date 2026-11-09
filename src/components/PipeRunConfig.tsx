import React, { useState } from 'react';
import { ProjectData, PipeSegment, HydraulicCalculationResults } from '../types/hydraulics';
import { PIPE_MATERIALS, NOMINAL_DIAMETERS } from '../data/defaultCatalog';
import {
  UNIT_LABELS,
  flowToDisplay,
  lengthToDisplay,
  lengthFromDisplay,
  diameterToDisplay,
  diameterFromDisplay,
  roughnessToDisplay,
  roughnessFromDisplay,
  pressureKPaToDisplay,
  pressureKPaFromDisplay,
} from '../utils/units';
import { FittingsModal } from './FittingsModal';
import {
  Pipette,
  Settings2,
  Layers,
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronDown,
  Info,
} from 'lucide-react';

interface Props {
  project: ProjectData;
  results: HydraulicCalculationResults;
  onUpdateProject: (updater: (prev: ProjectData) => ProjectData) => void;
}

export const PipeRunConfig: React.FC<Props> = ({ project, results, onUpdateProject }) => {
  const { unitSystem, suction, discharge, calculationMethod } = project;
  const labels = UNIT_LABELS[unitSystem];

  const [activeFittingsModal, setActiveFittingsModal] = useState<'suction' | 'discharge' | null>(
    null
  );

  const handleUpdateSegment = (
    segmentId: 'suction' | 'discharge',
    field: keyof PipeSegment,
    value: any
  ) => {
    onUpdateProject((prev) => ({
      ...prev,
      [segmentId]: {
        ...prev[segmentId],
        [field]: value,
      },
    }));
  };

  const handleSelectMaterial = (segmentId: 'suction' | 'discharge', materialId: string) => {
    const mat = PIPE_MATERIALS.find((m) => m.id === materialId);
    if (!mat) return;
    onUpdateProject((prev) => ({
      ...prev,
      [segmentId]: {
        ...prev[segmentId],
        materialId,
        roughnessMm: mat.roughnessMm,
      },
    }));
  };

  const handleSelectNominal = (segmentId: 'suction' | 'discharge', mm: number) => {
    onUpdateProject((prev) => ({
      ...prev,
      [segmentId]: {
        ...prev[segmentId],
        diameterMm: mm,
      },
    }));
  };

  const renderSegmentCard = (segmentId: 'suction' | 'discharge') => {
    const seg = segmentId === 'suction' ? suction : discharge;
    const velocity =
      segmentId === 'suction' ? results.suctionVelocityMs : results.dischargeVelocityMs;
    const velocityDisplay =
      unitSystem === 'imperial' ? velocity * 3.28084 : velocity;
    const reynolds = segmentId === 'suction' ? results.suctionReynolds : results.dischargeReynolds;
    const regime = segmentId === 'suction' ? results.suctionRegime : results.dischargeRegime;
    const frictionFactor =
      segmentId === 'suction' ? results.suctionFrictionFactor : results.dischargeFrictionFactor;
    const totalLoss =
      segmentId === 'suction' ? results.suctionTotalLossM : results.dischargeTotalLossM;
    const totalLossDisplay =
      unitSystem === 'imperial' ? totalLoss * 3.28084 : totalLoss;

    const totalK = seg.fittings.reduce((sum, f) => sum + f.kFactor * f.count, 0);

    const isSuction = segmentId === 'suction';
    const isVelHigh = isSuction ? velocity > 2.0 : velocity > 2.8;
    const isVelLow = !isSuction && velocity < 0.6;

    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                isSuction
                  ? 'bg-sky-500/10 border border-sky-500/20 text-sky-400'
                  : 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'
              }`}
            >
              {isSuction ? <ArrowDownToLine className="w-4 h-4" /> : <ArrowUpFromLine className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">{seg.name}</h3>
              <p className="text-[11px] text-slate-400">
                {isSuction ? 'Inlet run before pump suction' : 'Delivery run from pump discharge'}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">Total Loss (hf+hm)</span>
            <span className="text-sm font-mono font-bold text-cyan-400">
              {totalLossDisplay.toFixed(2)} {labels.head}
            </span>
          </div>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          {/* Length */}
          <div>
            <label className="text-slate-400 mb-1 flex items-center justify-between">
              <span>Pipe Length:</span>
              <span className="text-slate-500 text-[10px]">({labels.length})</span>
            </label>
            <input
              type="number"
              step="any"
              min="0.1"
              value={Number(lengthToDisplay(seg.lengthM, unitSystem).toFixed(1))}
              onChange={(e) =>
                handleUpdateSegment(
                  segmentId,
                  'lengthM',
                  lengthFromDisplay(parseFloat(e.target.value) || 0, unitSystem)
                )
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Elevation */}
          <div>
            <label className="text-slate-400 mb-1 flex items-center justify-between">
              <span>{isSuction ? 'Suction Level (Z_s):' : 'Discharge Elev (Z_d):'}</span>
              <span className="text-slate-500 text-[10px]">({labels.elevation})</span>
            </label>
            <input
              type="number"
              step="any"
              value={Number(lengthToDisplay(seg.staticElevationM, unitSystem).toFixed(1))}
              onChange={(e) =>
                handleUpdateSegment(
                  segmentId,
                  'staticElevationM',
                  lengthFromDisplay(parseFloat(e.target.value) || 0, unitSystem)
                )
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              {isSuction ? 'Positive = Flooded, Neg = Lift' : 'Elevation above pump centerline'}
            </span>
          </div>

          {/* Pipe Material */}
          <div className="col-span-2">
            <label className="text-slate-400 mb-1 block">Pipe Material:</label>
            <select
              value={seg.materialId}
              onChange={(e) => handleSelectMaterial(segmentId, e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500 cursor-pointer text-xs"
            >
              {PIPE_MATERIALS.map((mat) => (
                <option key={mat.id} value={mat.id}>
                  {mat.name} (ε = {mat.roughnessMm} mm)
                </option>
              ))}
            </select>
          </div>

          {/* Nominal Diameter Selector & Custom ID */}
          <div>
            <label className="text-slate-400 mb-1 flex items-center justify-between">
              <span>Nominal Diameter:</span>
            </label>
            <select
              value={
                NOMINAL_DIAMETERS.find((d) => Math.abs(d.mm - seg.diameterMm) < 0.8)?.mm || 'custom'
              }
              onChange={(e) => {
                if (e.target.value !== 'custom') {
                  handleSelectNominal(segmentId, parseFloat(e.target.value));
                }
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500 cursor-pointer text-xs"
            >
              {NOMINAL_DIAMETERS.map((d) => (
                <option key={d.nominal} value={d.mm}>
                  {d.nominal} ({unitSystem === 'imperial' ? `${d.inches}"` : `${d.mm} mm`})
                </option>
              ))}
              <option value="custom">Custom Internal Diameter</option>
            </select>
          </div>

          {/* Exact Internal Diameter */}
          <div>
            <label className="text-slate-400 mb-1 flex items-center justify-between">
              <span>Actual ID:</span>
              <span className="text-slate-500 text-[10px]">({labels.diameter})</span>
            </label>
            <input
              type="number"
              step="any"
              min="5"
              value={Number(diameterToDisplay(seg.diameterMm, unitSystem).toFixed(2))}
              onChange={(e) =>
                handleUpdateSegment(
                  segmentId,
                  'diameterMm',
                  diameterFromDisplay(parseFloat(e.target.value) || 10, unitSystem)
                )
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Roughness */}
          <div>
            <label className="text-slate-400 mb-1 flex items-center justify-between">
              <span>Wall Roughness (ε):</span>
              <span className="text-slate-500 text-[10px]">({labels.roughness})</span>
            </label>
            <input
              type="number"
              step="any"
              min="0.0001"
              value={Number(roughnessToDisplay(seg.roughnessMm, unitSystem).toFixed(4))}
              onChange={(e) =>
                handleUpdateSegment(
                  segmentId,
                  'roughnessMm',
                  roughnessFromDisplay(parseFloat(e.target.value) || 0.01, unitSystem)
                )
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Terminal Pressure */}
          <div>
            <label className="text-slate-400 mb-1 flex items-center justify-between">
              <span>{isSuction ? 'Vessel Pressure (P_s):' : 'Terminal Pressure (P_d):'}</span>
              <span className="text-slate-500 text-[10px]">({labels.pressure})</span>
            </label>
            <input
              type="number"
              step="any"
              value={Number(pressureKPaToDisplay(seg.terminalPressureKPa, unitSystem).toFixed(2))}
              onChange={(e) =>
                handleUpdateSegment(
                  segmentId,
                  'terminalPressureKPa',
                  pressureKPaFromDisplay(parseFloat(e.target.value) || 0, unitSystem)
                )
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              {isSuction ? '0 for atmospheric clearwell' : '0 for open gravity discharge'}
            </span>
          </div>
        </div>

        {/* Minor Losses & Fittings Button */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveFittingsModal(segmentId)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-cyan-500/50 transition flex items-center gap-1.5 shadow-sm"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Configure Fittings ({seg.fittings.length})</span>
            </button>
            <span className="text-xs font-mono text-slate-400">
              ΣK = <span className="text-cyan-400 font-bold">{totalK.toFixed(2)}</span>
            </span>
          </div>
        </div>

        {/* Real-time Velocity indicator */}
        <div className="pt-2 border-t border-slate-800/80 bg-slate-950/40 p-2.5 rounded-lg">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-400 font-medium">Flow Velocity (V):</span>
            <div className="flex items-center gap-2">
              <span
                className={`font-mono font-bold ${
                  isVelHigh
                    ? 'text-rose-400'
                    : isVelLow
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {velocityDisplay.toFixed(2)} {labels.velocity}
              </span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-mono uppercase ${
                  isVelHigh
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}
              >
                {isVelHigh ? 'High Velocity' : 'Optimal'}
              </span>
            </div>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isVelHigh ? 'bg-rose-500' : isVelLow ? 'bg-amber-500' : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(100, (velocity / 3.0) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>Re = {reynolds.toLocaleString()} ({regime})</span>
            <span>Darcy f = {frictionFactor.toFixed(4)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Design Flow & Calculation Method bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Settings2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100">System Design Flow Target</h2>
            <p className="text-xs text-slate-400">
              Set required operating flow rate and hydraulic friction loss standard
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Design Flow input */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-300 font-medium">Design Flow (Q):</label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0.1"
                value={Number(flowToDisplay(project.designFlowM3h, unitSystem).toFixed(1))}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 1;
                  onUpdateProject((prev) => ({
                    ...prev,
                    designFlowM3h: unitSystem === 'imperial' ? val / 4.40287 : val,
                  }));
                }}
                className="w-32 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-cyan-300 font-bold focus:outline-none focus:border-cyan-500 text-sm"
              />
              <span className="absolute right-2.5 top-2 text-xs font-mono text-slate-400 pointer-events-none">
                {labels.flow}
              </span>
            </div>
            {unitSystem === 'metric' && (
              <span className="text-xs font-mono text-slate-500">
                ({results.designFlowLps.toFixed(1)} L/s)
              </span>
            )}
          </div>

          {/* Friction Calculation Standard */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Friction Equation:</label>
            <div className="inline-flex rounded-lg border border-slate-800 p-0.5 bg-slate-950">
              <button
                onClick={() =>
                  onUpdateProject((prev) => ({ ...prev, calculationMethod: 'darcy_weisbach' }))
                }
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                  calculationMethod === 'darcy_weisbach'
                    ? 'bg-cyan-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Colebrook-White friction factor solver - Rigorous standard for all fluids & regimes"
              >
                Darcy-Weisbach
              </button>
              <button
                onClick={() =>
                  onUpdateProject((prev) => ({ ...prev, calculationMethod: 'hazen_williams' }))
                }
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                  calculationMethod === 'hazen_williams'
                    ? 'bg-cyan-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Hazen-Williams empirical formula - Standard for municipal potable water at ambient temperature"
              >
                Hazen-Williams (C)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-side Suction & Discharge Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {renderSegmentCard('suction')}
        {renderSegmentCard('discharge')}
      </div>

      {/* Active Fittings Modal */}
      {activeFittingsModal && (
        <FittingsModal
          isOpen={true}
          onClose={() => setActiveFittingsModal(null)}
          segmentTitle={activeFittingsModal === 'suction' ? suction.name : discharge.name}
          fittings={activeFittingsModal === 'suction' ? suction.fittings : discharge.fittings}
          onUpdateFittings={(fittings) => handleUpdateSegment(activeFittingsModal, 'fittings', fittings)}
        />
      )}
    </div>
  );
};
