import React, { useState, useMemo } from 'react';
import { ProjectData, PumpModel, UnitSystem, BoreholeSizingInput } from '../types/hydraulics';
import { sizeBoreholePump, BOREHOLE_FAMILIES } from '../utils/borehole';
import { BoreholeSimulator } from './BoreholeSimulator';
import {
  UNIT_LABELS,
  flowToDisplay,
  flowFromDisplay,
  headToDisplay,
  headFromDisplay,
  lengthToDisplay,
  lengthFromDisplay,
  powerToDisplay,
} from '../utils/units';
import {
  X,
  Check,
  Sparkles,
  ArrowDown,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Info,
  Droplets,
  HelpCircle,
  Layers,
  ArrowRight,
  Maximize2,
  SlidersHorizontal,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectData;
  onApplyBoreholePump: (sizedPump: PumpModel, targetQ: number, targetH: number) => void;
}

export const BoreholeSizingModal: React.FC<Props> = ({
  isOpen,
  onClose,
  project,
  onApplyBoreholePump,
}) => {
  const { unitSystem } = project;
  const labels = UNIT_LABELS[unitSystem];

  // Modal active sub-view: 'calc' | 'simulator'
  const [activeModalTab, setActiveModalTab] = useState<'calc' | 'simulator'>('simulator');

  // User input mode: Direct Q&H vs Detailed Borehole Geometry
  const [useDetailedCalc, setUseDetailedCalc] = useState(true);

  // Direct Q and H state (stored in display units)
  // Default to 15 L/s = 54.0 m3/h
  const [displayQ, setDisplayQ] = useState(() =>
    flowToDisplay(54.0, unitSystem).toFixed(1)
  );
  const [displayH, setDisplayH] = useState(() =>
    headToDisplay(145.0, unitSystem).toFixed(1)
  );

  // Detailed borehole parameters matching the user's scenario
  const [staticWaterLevel, setStaticWaterLevel] = useState('35'); // meters
  const [drawdown, setDrawdown] = useState('15'); // meters
  const [pumpSettingDepth, setPumpSettingDepth] = useState('99'); // 99m inside borehole
  const [surfaceLift, setSurfaceLift] = useState('40'); // 40m altitude rise to reservoir
  const [surfacePipeLength, setSurfacePipeLength] = useState('250'); // meters
  const [surfacePipeDia, setSurfacePipeDia] = useState('202.7'); // mm (PEHD DN200)
  const [riserPipeDia, setRiserPipeDia] = useState('102.3'); // mm (PVC DN100)
  const [casingDiaInches, setCasingDiaInches] = useState<number>(8);
  const [residualPressureBar, setResidualPressureBar] = useState('0.5'); // bar (free atmospheric discharge into tank)
  const [supplyVoltage, setSupplyVoltage] = useState<230 | 400>(400);
  const [cableSizeMm2, setCableSizeMm2] = useState<number>(16.0);

  // Function to load the exact case scenario:
  // 99m depth, PVC DN100 riser, +40m lift, PEHD DN200, 15 L/s
  const handleLoadCaseScenario = () => {
    setUseDetailedCalc(true);
    setDisplayQ(flowToDisplay(54.0, unitSystem).toFixed(1)); // 15 L/s = 54.0 m³/h
    setPumpSettingDepth('99');
    setStaticWaterLevel('35');
    setDrawdown('15');
    setSurfaceLift('40');
    setRiserPipeDia('102.3'); // PVC DN100
    setSurfacePipeDia('202.7'); // PEHD DN200
    setSurfacePipeLength('250');
    setCasingDiaInches(8);
    setResidualPressureBar('0.5');
    setSupplyVoltage(400);
    setCableSizeMm2(16.0);
  };

  // Real-time calculation inputs (always called unconditionally)
  const qBase = flowFromDisplay(parseFloat(displayQ) || 54.0, unitSystem);
  const hBase = headFromDisplay(parseFloat(displayH) || 145.0, unitSystem);

  const inputParams: BoreholeSizingInput = useMemo(
    () => ({
      targetFlowM3h: qBase,
      targetHeadM: hBase,
      useDetailedWellHeadCalc: useDetailedCalc,
      wellDepthM: (parseFloat(pumpSettingDepth) || 99) + 15,
      staticWaterLevelM: parseFloat(staticWaterLevel) || 35,
      drawdownM: parseFloat(drawdown) || 15,
      pumpSettingDepthM: parseFloat(pumpSettingDepth) || 99,
      surfaceElevationLiftM: parseFloat(surfaceLift) || 40,
      surfacePipeLengthM: parseFloat(surfacePipeLength) || 250,
      surfacePipeDiameterMm: parseFloat(surfacePipeDia) || 202.7,
      casingDiameterInches: casingDiaInches,
      riserPipeDiameterMm: parseFloat(riserPipeDia) || 102.3,
      residualPressureBar: parseFloat(residualPressureBar) || 0.5,
      supplyVoltage,
      cableLengthM: (parseFloat(pumpSettingDepth) || 99) + 15,
      cableSizeMm2,
    }),
    [
      qBase,
      hBase,
      useDetailedCalc,
      pumpSettingDepth,
      staticWaterLevel,
      drawdown,
      surfaceLift,
      surfacePipeLength,
      surfacePipeDia,
      casingDiaInches,
      riserPipeDia,
      residualPressureBar,
      supplyVoltage,
      cableSizeMm2,
    ]
  );

  const { result, generatedPump } = useMemo(() => {
    return sizeBoreholePump(inputParams);
  }, [inputParams]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApplyBoreholePump(generatedPump, result.targetFlowM3h, result.calculatedTdhM);
    onClose();
  };

  const targetFlowLps = qBase / 3.6;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">
              <Droplets className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">
                  Submersible Borehole Pump & Pipeline Simulator
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold uppercase">
                  Deep Well Engineering
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Precision sizing for submersible borehole pumps, riser columns, surface pipelines, and reservoirs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadCaseScenario}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-xs font-semibold transition shadow-sm"
              title="Preload 99m well depth, PVC DN100 riser, +40m altitude rise with PEHD DN200 at 15 L/s"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Load 15 L/s & 99m Case</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Switcher & Case Study Banner */}
        <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-xl border border-slate-800 p-0.5 bg-slate-900 text-xs">
            <button
              onClick={() => setActiveModalTab('simulator')}
              className={`px-3.5 py-1.5 font-semibold rounded-lg transition flex items-center gap-1.5 ${
                activeModalTab === 'simulator'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Interactive CAD Simulator</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] bg-cyan-950 text-cyan-300 font-mono border border-cyan-800">
                Visual
              </span>
            </button>
            <button
              onClick={() => setActiveModalTab('calc')}
              className={`px-3.5 py-1.5 font-semibold rounded-lg transition flex items-center gap-1.5 ${
                activeModalTab === 'calc'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Sizing Inputs & Diagnostics</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Calculation Method:</span>
            <div className="inline-flex rounded-lg border border-slate-800 p-0.5 bg-slate-900 text-xs">
              <button
                onClick={() => setUseDetailedCalc(true)}
                className={`px-2.5 py-1 font-semibold rounded-md transition ${
                  useDetailedCalc
                    ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Well Depth + Lift
              </button>
              <button
                onClick={() => setUseDetailedCalc(false)}
                className={`px-2.5 py-1 font-semibold rounded-md transition ${
                  !useDetailedCalc
                    ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Direct (Q & H)
              </button>
            </div>
          </div>
        </div>

        {/* Body Content */}
        {activeModalTab === 'simulator' ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-950/60">
            {/* Interactive CAD Simulator Component */}
            <BoreholeSimulator
              unitSystem={unitSystem}
              pumpSettingDepthM={parseFloat(pumpSettingDepth) || 99}
              staticWaterLevelM={parseFloat(staticWaterLevel) || 35}
              drawdownM={parseFloat(drawdown) || 15}
              surfaceElevationLiftM={parseFloat(surfaceLift) || 40}
              riserDiameterMm={parseFloat(riserPipeDia) || 102.3}
              surfaceDiameterMm={parseFloat(surfacePipeDia) || 202.7}
              targetFlowLps={targetFlowLps}
              tdhM={result.calculatedTdhM}
              pumpModel={result.recommendedModel}
              numberOfStages={result.numberOfStages}
              motorRatingKw={result.motorRatingKw}
              motorRatingHp={result.motorRatingHp}
              efficiencyPercent={result.efficiencyAtDuty}
              onApplyCaseStudy={handleLoadCaseScenario}
            />

            {/* Quick Summary & Action Bar under Simulator */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-slate-400 block text-[10px]">Sized Submersible Pump:</span>
                  <span className="font-bold text-white text-sm">{result.recommendedModel}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Total Dynamic Head:</span>
                  <span className="font-bold text-cyan-400 text-sm">
                    {headToDisplay(result.calculatedTdhM, unitSystem).toFixed(1)} {labels.head}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Motor Rating:</span>
                  <span className="font-bold text-amber-400 text-sm">
                    {result.motorRatingKw} kW ({result.motorRatingHp} HP)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveModalTab('calc')}
                  className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition"
                >
                  Edit Well & Pipeline Values
                </button>
                <button
                  onClick={handleApply}
                  className="py-2 px-4 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-600 to-sky-500 hover:from-cyan-500 hover:to-sky-400 text-white shadow-md shadow-cyan-600/25 transition flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Apply Sized Pump to Project</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-800">
            {/* Left Column: Input Panel (6 cols) */}
            <div className="md:col-span-6 p-4 flex flex-col overflow-y-auto space-y-4 custom-scrollbar">
              {!useDetailedCalc ? (
                /* Direct Q & H Mode */
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-800/40 text-xs text-cyan-200">
                    <p className="font-semibold text-cyan-300 mb-0.5">Quick Direct Sizing</p>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Enter your required duty point (<span className="font-mono text-cyan-400 font-bold">Q</span> and{' '}
                      <span className="font-mono text-cyan-400 font-bold">H</span>). HydroFlow selects the optimal
                      multistage submersible pump series, calculates the exact number of stages, and sizes the submersible motor.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {/* Flow Q */}
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <label className="text-slate-400 block mb-1 font-medium">
                        Required Flow Rate (Q):
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          min="0.1"
                          value={displayQ}
                          onChange={(e) => setDisplayQ(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-750 rounded-lg px-3 py-1.5 font-mono text-lg font-bold text-cyan-300 focus:outline-none focus:border-cyan-500"
                        />
                        <span className="absolute right-2.5 top-2.5 text-xs font-mono text-slate-400 pointer-events-none">
                          {labels.flow}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        ≈ {(qBase / 3.6).toFixed(1)} L/s
                      </span>
                    </div>

                    {/* Head H */}
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <label className="text-slate-400 block mb-1 font-medium">
                        Required Total Head (H):
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          min="1"
                          value={displayH}
                          onChange={(e) => setDisplayH(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-750 rounded-lg px-3 py-1.5 font-mono text-lg font-bold text-cyan-300 focus:outline-none focus:border-cyan-500"
                        />
                        <span className="absolute right-2.5 top-2.5 text-xs font-mono text-slate-400 pointer-events-none">
                          {labels.head}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        ≈ {(hBase / 10.197).toFixed(1)} bar gauge
                      </span>
                    </div>
                  </div>

                  {/* Borehole Casing & Voltage */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-slate-400 block mb-1">Borehole Casing ID:</label>
                      <select
                        value={casingDiaInches}
                        onChange={(e) => setCasingDiaInches(parseInt(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none cursor-pointer"
                      >
                        <option value={4}>4" Casing (102 mm)</option>
                        <option value={5}>5" Casing (127 mm)</option>
                        <option value={6}>6" Casing (152 mm)</option>
                        <option value={8}>8" Casing (203 mm)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Motor Supply Voltage:</label>
                      <select
                        value={supplyVoltage}
                        onChange={(e) => setSupplyVoltage(parseInt(e.target.value) as any)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none cursor-pointer"
                      >
                        <option value={400}>3-Phase 400V (Standard)</option>
                        <option value={230}>1-Phase 230V (Domestic)</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                /* Detailed Borehole Geometry Mode */
                <div className="space-y-3 text-xs">
                  {/* Flow Rate Input */}
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-300 font-medium">Target Flow Rate (Q):</label>
                      <span className="text-[11px] font-mono text-cyan-400 font-bold">
                        {(qBase / 3.6).toFixed(1)} L/s (15 L/s = 54 m³/h)
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        value={displayQ}
                        onChange={(e) => setDisplayQ(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-750 rounded-lg px-2.5 py-1.5 font-mono text-cyan-300 font-bold focus:outline-none focus:border-cyan-500"
                      />
                      <span className="absolute right-2 top-1.5 text-xs text-slate-400 font-mono">
                        {labels.flow}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-slate-400 block mb-0.5">Pump Depth in Borehole:</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          value={pumpSettingDepth}
                          onChange={(e) => setPumpSettingDepth(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                        />
                        <span className="absolute right-2 top-2 text-[11px] text-slate-500 font-mono">m depth</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-0.5">Surface Lift to Tank:</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          value={surfaceLift}
                          onChange={(e) => setSurfaceLift(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                        />
                        <span className="absolute right-2 top-2 text-[11px] text-slate-500 font-mono">m altitude</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-slate-400 block mb-0.5">Riser Column (PVC DN100 ID):</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          value={riserPipeDia}
                          onChange={(e) => setRiserPipeDia(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                        />
                        <span className="absolute right-2 top-2 text-[11px] text-slate-500 font-mono">mm</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-0.5">Surface Pipe (PEHD DN200 ID):</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          value={surfacePipeDia}
                          onChange={(e) => setSurfacePipeDia(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                        />
                        <span className="absolute right-2 top-2 text-[11px] text-slate-500 font-mono">mm</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-slate-400 block mb-0.5">Surface Pipe Length:</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          value={surfacePipeLength}
                          onChange={(e) => setSurfacePipeLength(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                        />
                        <span className="absolute right-2 top-2 text-[11px] text-slate-500 font-mono">m run</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-0.5">Residual Delivery Pressure:</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          value={residualPressureBar}
                          onChange={(e) => setResidualPressureBar(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                        />
                        <span className="absolute right-2 top-2 text-[11px] text-slate-500 font-mono">bar</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <label className="text-slate-400 block mb-0.5">Submersible Drop Cable:</label>
                      <select
                        value={cableSizeMm2}
                        onChange={(e) => setCableSizeMm2(parseFloat(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-200 focus:outline-none cursor-pointer"
                      >
                        <option value={4.0}>3 x 4.0 mm²</option>
                        <option value={6.0}>3 x 6.0 mm²</option>
                        <option value={10.0}>3 x 10.0 mm²</option>
                        <option value={16.0}>3 x 16.0 mm² (Recommended)</option>
                        <option value={25.0}>3 x 25.0 mm²</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-0.5">Casing Diameter:</label>
                      <select
                        value={casingDiaInches}
                        onChange={(e) => setCasingDiaInches(parseInt(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-200 focus:outline-none cursor-pointer"
                      >
                        <option value={6}>6" Well (152 mm)</option>
                        <option value={8}>8" Well (203 mm)</option>
                        <option value={10}>10" Well (254 mm)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Interactive CAD Simulator Launch Card */}
              <div
                onClick={() => setActiveModalTab('simulator')}
                className="cursor-pointer group bg-gradient-to-r from-slate-950 to-cyan-950/40 p-3 rounded-xl border border-cyan-800/60 hover:border-cyan-500 transition shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition">
                        View Interactive 2D Simulator
                      </span>
                      <p className="text-[10px] text-slate-400">
                        Animated water flow, geology, wellhead, +40m hill, and tank
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition" />
                </div>
              </div>
            </div>

            {/* Right Column: Sized Pump Results & Diagnostics (6 cols) */}
            <div className="md:col-span-6 p-4 flex flex-col bg-slate-900/40 overflow-y-auto space-y-4 custom-scrollbar">
              {/* Sized Model Banner */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950 to-slate-900 border border-cyan-500/50 shadow-md">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-500 text-slate-950 font-bold">
                  OPTIMAL SIZED PUMP
                </span>
                <h4 className="text-base font-bold text-white mt-1.5">
                  {result.recommendedModel}
                </h4>
                <p className="text-xs text-cyan-300 mt-0.5">
                  {result.numberOfStages} Hydraulic Stages @ ~{result.headPerStageM}m per stage
                </p>
              </div>

              {/* Core Metrics Grid */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Calculated TDH:</span>
                  <span className="text-lg font-bold font-mono text-white">
                    {headToDisplay(result.calculatedTdhM, unitSystem).toFixed(1)} {labels.head}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Shutoff H_0 = {headToDisplay(result.shutoffHeadM, unitSystem).toFixed(0)} {labels.head}
                  </span>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Submersible Motor:</span>
                  <span className="text-lg font-bold font-mono text-amber-400">
                    {result.motorRatingKw} kW ({result.motorRatingHp} HP)
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Shaft BHP: {result.shaftPowerKw} kW (η = {result.efficiencyAtDuty}%)
                  </span>
                </div>
              </div>

              {/* Cooling & Diagnostics Checks */}
              <div className="space-y-2 text-xs">
                <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] block">
                  Engineering Diagnostics & Safety Validation
                </span>

                {/* Cooling check */}
                <div
                  className={`p-2.5 rounded-xl border flex items-center justify-between ${
                    result.isCoolingSleeveRequired
                      ? 'bg-amber-950/30 border-amber-800 text-amber-200'
                      : 'bg-emerald-950/30 border-emerald-800 text-emerald-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {result.isCoolingSleeveRequired ? (
                      <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                    <div>
                      <span className="font-semibold block">
                        Motor Cooling Velocity: {result.motorCoolingVelocityMs} m/s
                      </span>
                      <span className="text-[11px] opacity-80">
                        {result.isCoolingSleeveRequired
                          ? 'Low velocity (< 0.15 m/s) — Flow inducer shroud recommended!'
                          : 'Adequate cooling water flow across motor surface.'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cable voltage drop check */}
                <div
                  className={`p-2.5 rounded-xl border flex items-center justify-between ${
                    !result.isCableAdequate
                      ? 'bg-rose-950/30 border-rose-800 text-rose-200'
                      : 'bg-emerald-950/30 border-emerald-800 text-emerald-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {!result.isCableAdequate ? (
                      <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                    <div>
                      <span className="font-semibold block">
                        Drop Cable Voltage Drop: {result.cableVoltageDropPercent}%
                      </span>
                      <span className="text-[11px] opacity-80">
                        {result.isCableAdequate
                          ? 'Within acceptable < 4% voltage drop threshold.'
                          : 'Exceeds recommended 4% voltage drop. Upsize cable section.'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Apply Button */}
              <div className="pt-2 mt-auto">
                <button
                  onClick={handleApply}
                  className="w-full py-2.5 px-4 text-xs font-semibold rounded-xl bg-gradient-to-r from-cyan-600 to-sky-500 hover:from-cyan-500 hover:to-sky-400 text-white shadow-lg shadow-cyan-600/25 transition flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Apply Sized Borehole Pump & System Curves</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
