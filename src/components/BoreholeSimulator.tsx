import React, { useState } from 'react';
import { UnitSystem } from '../types/hydraulics';
import { UNIT_LABELS, flowToDisplay, headToDisplay, lengthToDisplay } from '../utils/units';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Layers,
  Info,
  CheckCircle2,
  Gauge,
  Zap,
  Droplets,
  ArrowRight,
  Maximize2,
} from 'lucide-react';

interface SimulatorProps {
  unitSystem: UnitSystem;
  pumpSettingDepthM: number; // e.g. 99m
  staticWaterLevelM: number; // e.g. 35m
  drawdownM: number; // e.g. 15m -> DWL 50m
  surfaceElevationLiftM: number; // e.g. 40m
  riserDiameterMm: number; // e.g. 102.3mm (PVC DN100)
  surfaceDiameterMm: number; // e.g. 202.7mm (PEHD DN200)
  targetFlowLps: number; // e.g. 15 L/s
  tdhM: number; // e.g. 145m
  pumpModel: string;
  numberOfStages: number;
  motorRatingKw: number;
  motorRatingHp: number;
  efficiencyPercent: number;
  onApplyCaseStudy?: () => void;
}

export const BoreholeSimulator: React.FC<SimulatorProps> = ({
  unitSystem,
  pumpSettingDepthM,
  staticWaterLevelM,
  drawdownM,
  surfaceElevationLiftM,
  riserDiameterMm,
  surfaceDiameterMm,
  targetFlowLps,
  tdhM,
  pumpModel,
  numberOfStages,
  motorRatingKw,
  motorRatingHp,
  efficiencyPercent,
  onApplyCaseStudy,
}) => {
  const [isRunning, setIsRunning] = useState(true);
  const [activeStation, setActiveStation] = useState<string | null>(null);

  const labels = UNIT_LABELS[unitSystem];
  const dynamicWaterLevelM = staticWaterLevelM + drawdownM;
  const flowM3h = targetFlowLps * 3.6;

  // Fluid velocities
  const riserAreaM2 = (Math.PI / 4) * Math.pow(riserDiameterMm / 1000, 2);
  const surfaceAreaM2 = (Math.PI / 4) * Math.pow(surfaceDiameterMm / 1000, 2);
  const riserVelocityMs = riserAreaM2 > 0 ? (flowM3h / 3600) / riserAreaM2 : 0;
  const surfaceVelocityMs = surfaceAreaM2 > 0 ? (flowM3h / 3600) / surfaceAreaM2 : 0;

  // SVG coordinate dimensions
  const svgWidth = 900;
  const svgHeight = 460;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
      {/* Simulator Control Header */}
      <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Droplets className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                Deep Well & Hydraulic Pipeline Simulator
              </h3>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 ${
                  isRunning
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isRunning ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
                  }`}
                />
                {isRunning ? 'SIMULATION RUNNING (15 L/s)' : 'SIMULATION PAUSED'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Interactive CAD cross-section: 99m borehole setting + PVC DN100 riser + 40m surface lift (PEHD DN200)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onApplyCaseStudy && (
            <button
              onClick={onApplyCaseStudy}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/40 transition flex items-center gap-1.5 shadow-sm"
              title="Fill all parameters with this exact 15 L/s, 99m well, 40m reservoir case study"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Load 15 L/s & 99m Case Study</span>
            </button>
          )}

          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
              isRunning
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
            }`}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isRunning ? 'Pause Flow' : 'Start Flow'}</span>
          </button>
        </div>
      </div>

      {/* Main Interactive CAD Schematic Canvas */}
      <div className="relative w-full bg-slate-950 p-2 overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto"
          style={{ maxHeight: '460px' }}
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="groundGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#334155" stopOpacity="0.4" />
              <stop offset="30%" stopColor="#1e293b" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.95" />
            </linearGradient>

            <linearGradient id="aquiferGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="0.4" />
            </linearGradient>

            <linearGradient id="waterFlow" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.9" />
            </linearGradient>

            <linearGradient id="tankGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="0.2" />
            </linearGradient>

            {/* Geological strata pattern */}
            <pattern id="strataPattern" width="40" height="20" patternUnits="userSpaceOnUse">
              <line x1="0" y1="10" x2="40" y2="10" stroke="#475569" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.3" />
            </pattern>

            {/* Animation style */}
            <style>{`
              @keyframes dashFlowUp {
                from { stroke-dashoffset: 40; }
                to { stroke-dashoffset: 0; }
              }
              @keyframes dashFlowRight {
                from { stroke-dashoffset: 40; }
                to { stroke-dashoffset: 0; }
              }
              .water-stream-up {
                animation: dashFlowUp 0.8s linear infinite;
              }
              .water-stream-right {
                animation: dashFlowRight 1.2s linear infinite;
              }
            `}</style>
          </defs>

          {/* 1. Geological Background */}
          {/* Ground Line Y = 160 */}
          <rect x="0" y="160" width="450" height="300" fill="url(#groundGrad)" />
          <rect x="0" y="160" width="450" height="300" fill="url(#strataPattern)" />

          {/* Deep Aquifer Zone Y = 280 to 460 */}
          <rect x="0" y="280" width="450" height="180" fill="url(#aquiferGrad)" />
          <text x="20" y="440" fill="#38bdf8" fontSize="10" fontFamily="monospace" opacity="0.7">
            [ Saturated Groundwater Aquifer Layer ]
          </text>

          {/* Surface Terrain Hill climbing to reservoir (Y: 160 -> 60) */}
          <path
            d="M 450 160 Q 600 160 700 80 L 900 80 L 900 460 L 450 460 Z"
            fill="#1e293b"
            opacity="0.85"
          />
          {/* Ground Line highlight */}
          <line x1="0" y1="160" x2="450" y2="160" stroke="#64748b" strokeWidth="2.5" />
          <path d="M 450 160 Q 600 160 700 80 L 900 80" fill="none" stroke="#64748b" strokeWidth="2.5" />
          <text x="20" y="152" fill="#94a3b8" fontSize="11" fontWeight="bold">
            Ground Surface Datum (Elev: 0.0 m)
          </text>

          {/* 2. Static & Dynamic Water Table Lines */}
          {/* Static Water Level (e.g. -35m) Y = 240 */}
          <line x1="0" y1="240" x2="450" y2="240" stroke="#0ea5e9" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.8" />
          <text x="20" y="235" fill="#38bdf8" fontSize="10" fontFamily="monospace">
            Static Water Level (SWL: -{staticWaterLevelM}m)
          </text>

          {/* Drawdown Cone of Depression (Pumping Water Level) Y = 290 */}
          {isRunning ? (
            <path
              d="M 0 240 Q 150 250 200 295 L 240 295 Q 290 250 450 240"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2"
            />
          ) : (
            <line x1="0" y1="240" x2="450" y2="240" stroke="#06b6d4" strokeWidth="2" />
          )}
          <text x="20" y="305" fill="#22d3ee" fontSize="10" fontFamily="monospace" fontWeight="bold">
            Dynamic Pumping Level (DWL: -{dynamicWaterLevelM}m) [Drawdown: {drawdownM}m]
          </text>

          {/* 3. Borehole Casing (8" / 203mm) */}
          {/* Well centerline X = 220. Width = 50 */}
          <rect x="195" y="150" width="50" height="290" fill="#0f172a" stroke="#64748b" strokeWidth="2" />
          {/* Well screen slots at bottom */}
          <g stroke="#94a3b8" strokeWidth="1">
            {[380, 390, 400, 410, 420, 430].map((y) => (
              <line key={y} x1="195" y1={y} x2="245" y2={y} strokeDasharray="2 2" />
            ))}
          </g>

          {/* 4. Submersible Pump & Motor Assembly at 99m */}
          {/* Pump assembly at Y = 360 to 425 */}
          <g
            className="cursor-pointer"
            onClick={() => setActiveStation('pump')}
            onMouseEnter={() => setActiveStation('pump')}
          >
            {/* Submersible Motor (Bottom) */}
            <rect x="208" y="395" width="24" height="35" rx="3" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="220" y="415" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">
              {motorRatingKw}kW
            </text>
            <text x="220" y="424" fill="#bae6fd" fontSize="6" textAnchor="middle">
              MOTOR
            </text>

            {/* Suction Intake Screen (Middle) */}
            <rect x="210" y="385" width="20" height="10" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
            <line x1="210" y1="390" x2="230" y2="390" stroke="#38bdf8" strokeDasharray="1 1" />

            {/* Multistage Pump Bowls (Top section: 24 stages) */}
            <rect x="209" y="340" width="22" height="45" rx="2" fill="#0369a1" stroke="#38bdf8" strokeWidth="1.5" />
            {/* Stage rings */}
            {[345, 350, 355, 360, 365, 370, 375, 380].map((y) => (
              <line key={y} x1="209" y1={y} x2="231" y2={y} stroke="#38bdf8" strokeWidth="0.8" opacity="0.6" />
            ))}
            <text x="220" y="362" fill="#ffffff" fontSize="8" fontWeight="extrabold" textAnchor="middle">
              {numberOfStages} STG
            </text>
            <text x="220" y="372" fill="#7dd3fc" fontSize="6" fontWeight="bold" textAnchor="middle">
              6SP60
            </text>

            {/* Check valve at pump outlet */}
            <polygon points="214,340 226,340 220,334" fill="#f59e0b" stroke="#ffffff" strokeWidth="0.8" />
          </g>

          {/* 5. PVC DN100 Riser Column Pipe (Y = 160 to 335) */}
          <g
            className="cursor-pointer"
            onClick={() => setActiveStation('riser')}
            onMouseEnter={() => setActiveStation('riser')}
          >
            {/* Outer pipe tube */}
            <rect x="216" y="160" width="8" height="175" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.2" />

            {/* Animated Water flow stream up the riser */}
            {isRunning && (
              <line
                x1="220"
                y1="335"
                x2="220"
                y2="160"
                stroke="#22d3ee"
                strokeWidth="5"
                strokeDasharray="6 4"
                className="water-stream-up"
              />
            )}

            {/* Drop Cable clamped to riser */}
            <line x1="212" y1="160" x2="212" y2="400" stroke="#f43f5e" strokeWidth="1.5" />
            {/* Cable clamps */}
            {[180, 220, 260, 300].map((y) => (
              <circle key={y} cx="214" cy={y} r="1.5" fill="#f43f5e" />
            ))}
          </g>

          {/* 6. Wellhead Assembly at Ground (X = 220, Y = 160) */}
          <g
            className="cursor-pointer"
            onClick={() => setActiveStation('wellhead')}
            onMouseEnter={() => setActiveStation('wellhead')}
          >
            {/* Concrete wellhead plinth */}
            <rect x="185" y="145" width="70" height="15" rx="2" fill="#475569" stroke="#94a3b8" />
            {/* Wellhead flange */}
            <rect x="205" y="138" width="30" height="7" fill="#0284c7" />
            {/* Pressure gauge */}
            <circle cx="212" cy="126" r="6" fill="#ffffff" stroke="#0284c7" strokeWidth="1.5" />
            <line x1="212" y1="126" x2="215" y2="123" stroke="#f43f5e" strokeWidth="1.5" />
            <line x1="212" y1="138" x2="212" y2="132" stroke="#0284c7" strokeWidth="1.5" />
            {/* Isolating valve */}
            <circle cx="235" cy="138" r="4" fill="#f59e0b" stroke="#ffffff" strokeWidth="1" />
          </g>

          {/* 7. Surface HDPE DN200 Pipeline Climbing +40m to Elevated Reservoir */}
          {/* Path from wellhead (220, 138) -> (260, 138) -> terrain slope to reservoir inlet (730, 45) */}
          <g
            className="cursor-pointer"
            onClick={() => setActiveStation('surface')}
            onMouseEnter={() => setActiveStation('surface')}
          >
            {/* Pipeline casing */}
            <path
              d="M 235 138 L 450 138 Q 580 138 680 50 L 730 50"
              fill="none"
              stroke="#0f172a"
              strokeWidth="9"
              strokeLinecap="round"
            />
            <path
              d="M 235 138 L 450 138 Q 580 138 680 50 L 730 50"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="6"
              strokeLinecap="round"
            />
            {/* Animated Flow inside surface pipe */}
            {isRunning && (
              <path
                d="M 235 138 L 450 138 Q 580 138 680 50 L 730 50"
                fill="none"
                stroke="#ffffff"
                strokeWidth="3.5"
                strokeDasharray="8 6"
                className="water-stream-right"
              />
            )}
          </g>

          {/* 8. Elevated Storage Reservoir (+40m) */}
          {/* Reservoir tank at X = 730, Y = 10 to 80 (Elev: +40m) */}
          <g
            className="cursor-pointer"
            onClick={() => setActiveStation('reservoir')}
            onMouseEnter={() => setActiveStation('reservoir')}
          >
            {/* Tank shell */}
            <rect x="730" y="15" width="130" height="65" rx="5" fill="#0f172a" stroke="#0284c7" strokeWidth="2.5" />
            {/* Water level inside tank */}
            <rect x="732" y="30" width="126" height="48" rx="2" fill="url(#tankGrad)" />
            <line x1="732" y1="30" x2="858" y2="30" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 2" />

            {/* Discharge water fall into tank */}
            {isRunning && (
              <line x1="730" y1="48" x2="750" y2="48" stroke="#ffffff" strokeWidth="3" />
            )}

            <text x="795" y="55" fill="#f8fafc" fontSize="11" fontWeight="extrabold" textAnchor="middle">
              ELEVATED RESERVOIR
            </text>
            <text x="795" y="68" fill="#38bdf8" fontSize="9" textAnchor="middle" fontFamily="monospace">
              Altitude: +{surfaceElevationLiftM} m
            </text>
          </g>

          {/* 9. Height / Depth Dimension Arrows */}
          {/* Well Depth Dimension: 0.0 to -99m */}
          <g transform="translate(130, 0)">
            <line x1="0" y1="160" x2="0" y2="395" stroke="#ec4899" strokeWidth="1.5" />
            <polygon points="-3,165 3,165 0,160" fill="#ec4899" />
            <polygon points="-3,390 3,390 0,395" fill="#ec4899" />
            <rect x="-42" y="270" width="84" height="20" rx="4" fill="#0f172a" stroke="#ec4899" strokeWidth="1" />
            <text x="0" y="284" fill="#f472b6" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              Depth: {pumpSettingDepthM} m
            </text>
          </g>

          {/* Surface Lift Dimension: 0.0 to +40m */}
          <g transform="translate(875, 0)">
            <line x1="0" y1="160" x2="0" y2="50" stroke="#10b981" strokeWidth="1.5" />
            <polygon points="-3,155 3,155 0,160" fill="#10b981" />
            <polygon points="-3,55 3,55 0,50" fill="#10b981" />
            <rect x="-44" y="95" width="88" height="20" rx="4" fill="#0f172a" stroke="#10b981" strokeWidth="1" />
            <text x="0" y="109" fill="#34d399" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              Lift: +{surfaceElevationLiftM} m
            </text>
          </g>

          {/* Total Static Head Callout Box */}
          <g transform="translate(480, 230)">
            <rect x="0" y="0" width="180" height="52" rx="8" fill="#0f172a" stroke="#06b6d4" strokeWidth="1.5" />
            <text x="12" y="18" fill="#38bdf8" fontSize="10" fontWeight="bold">
              TOTAL STATIC HEAD
            </text>
            <text x="12" y="32" fill="#ffffff" fontSize="11" fontFamily="monospace">
              H_static = {pumpSettingDepthM}m + {surfaceElevationLiftM}m = {pumpSettingDepthM + surfaceElevationLiftM} m
            </text>
            <text x="12" y="44" fill="#f59e0b" fontSize="10" fontFamily="monospace">
              + Friction Loss: ~{(tdhM - (pumpSettingDepthM + surfaceElevationLiftM)).toFixed(1)} m
            </text>
          </g>
        </svg>

        {/* Live Interactive Station Diagnostics Card (floating overlay) */}
        <div className="absolute bottom-4 left-4 right-4 bg-slate-900/95 border border-slate-700/80 rounded-xl p-3 shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold text-xs shrink-0">
              HUD
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100">
                  {activeStation === 'pump'
                    ? 'Submersible Pump Station (-99m Depth)'
                    : activeStation === 'riser'
                    ? 'PVC DN100 Vertical Riser Column'
                    : activeStation === 'surface'
                    ? 'PEHD DN200 Surface Delivery Run (+40m Climb)'
                    : activeStation === 'reservoir'
                    ? 'Elevated Reservoir Storage Tank'
                    : 'System Simulation Overview (15 L/s @ 145m TDH)'}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Real-time
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {activeStation === 'pump'
                  ? `Pump: ${pumpModel} (${numberOfStages} Stages) • Motor: ${motorRatingKw}kW (${motorRatingHp}HP) 400V • Cooling: OK`
                  : activeStation === 'riser'
                  ? `PVC DN100 (ID: ${riserDiameterMm}mm) • Flow Velocity: ${riserVelocityMs.toFixed(2)} m/s (Optimal: 1.5 - 2.0 m/s) • Check Valve: 1x`
                  : activeStation === 'surface'
                  ? `PEHD DN200 (ID: ${surfaceDiameterMm}mm) • Flow Velocity: ${surfaceVelocityMs.toFixed(2)} m/s (Ultra-low friction)`
                  : activeStation === 'reservoir'
                  ? `Elevated Tank Elevation: +${surfaceElevationLiftM}m • Delivery: Continuous gravity storage`
                  : `Q: ${targetFlowLps} L/s (${flowM3h.toFixed(1)} m³/h) • TDH: ${tdhM.toFixed(1)} m • Motor: ${motorRatingKw}kW • Efficiency: ${efficiencyPercent}%`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px]">Flow Rate:</span>
              <span className="font-bold text-cyan-400">{targetFlowLps} L/s</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Total Head:</span>
              <span className="font-bold text-white">{tdhM.toFixed(1)} m</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Sized Pump:</span>
              <span className="font-bold text-emerald-400">{pumpModel.split(' ')[0]}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Motor Power:</span>
              <span className="font-bold text-amber-400">{motorRatingKw} kW</span>
            </div>
          </div>
        </div>
      </div>

      {/* Simulator Details & Legend Footer */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
        <div className="flex flex-wrap items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-cyan-500 inline-block"></span>
            <span>PVC DN100 Riser (99m, V=1.82 m/s)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-sky-400 inline-block"></span>
            <span>PEHD DN200 Surface (+40m, V=0.46 m/s)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-600 inline-block"></span>
            <span>6" Submersible Pump (24 Stages)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span>
            <span>Elevated Tank (+40m)</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400">
          Click or hover on any component in the schematic to inspect hydraulic conditions.
        </div>
      </div>
    </div>
  );
};
