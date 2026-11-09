import React, { useMemo } from 'react';
import { ProjectData, HydraulicCalculationResults } from '../types/hydraulics';
import { UNIT_LABELS, lengthToDisplay, headToDisplay, flowToDisplay } from '../utils/units';
import { Activity, ShieldAlert, ArrowRight } from 'lucide-react';

interface Props {
  project: ProjectData;
  results: HydraulicCalculationResults;
}

export const HGLProfileChart: React.FC<Props> = ({ project, results }) => {
  const { unitSystem, suction, discharge } = project;
  const labels = UNIT_LABELS[unitSystem];

  const svgWidth = 800;
  const svgHeight = 280;
  const pad = { top: 35, right: 40, bottom: 45, left: 60 };
  const pWidth = svgWidth - pad.left - pad.right;
  const pHeight = svgHeight - pad.top - pad.bottom;

  // Stationing distances (normalized or schematic length)
  // Let's create key stations:
  // Station 0: Suction source surface
  // Station 1: Suction pipe intake
  // Station 2: Pump suction flange (Centerline = 0)
  // Station 3: Pump discharge flange (Jump up by TDH)
  // Station 4: Discharge pipeline profile
  // Station 5: Discharge reservoir / terminal point

  const Zs = suction.staticElevationM;
  const Zd = discharge.staticElevationM;
  const TDH = results.totalDynamicHeadM;
  const hLs = results.suctionTotalLossM;
  const hLd = results.dischargeTotalLossM;
  const velHeadS = Math.pow(results.suctionVelocityMs, 2) / (2 * 9.80665);
  const velHeadD = Math.pow(results.dischargeVelocityMs, 2) / (2 * 9.80665);

  // Compute elevation boundaries
  const minElevM = Math.min(-2, Zs - 2, 0);
  const maxElevM = Math.max(Zd + 5, Zs + TDH + 5, 20);
  const elevRange = maxElevM - minElevM;

  const yPos = (elevM: number) => pad.top + pHeight - ((elevM - minElevM) / elevRange) * pHeight;

  // Horizontal station x coordinates
  const x0 = pad.left; // Suction surface
  const x1 = pad.left + pWidth * 0.12; // Suction entrance
  const x2 = pad.left + pWidth * 0.38; // Pump suction inlet
  const x3 = pad.left + pWidth * 0.42; // Pump discharge outlet
  const x4 = pad.left + pWidth * 0.82; // Discharge run
  const x5 = pad.left + pWidth; // Discharge point

  // Elevation values:
  // Suction water level: Zs
  // Pump centerline: 0
  // Discharge point: Zd
  const pipeInvert = [
    { x: x0, y: yPos(Zs) },
    { x: x1, y: yPos(Zs - 0.5) },
    { x: x2, y: yPos(0) }, // Pump inlet
    { x: x3, y: yPos(0) }, // Pump outlet
    { x: x4, y: yPos(Zd * 0.7) },
    { x: x5, y: yPos(Zd) },
  ];

  // HGL points:
  // At suction surface: HGL = Zs
  // At pump inlet: HGL = Zs - hLs
  // At pump discharge: HGL = (Zs - hLs) + TDH
  // At discharge end: HGL = (Zs - hLs) + TDH - hLd
  const hglPumpInlet = Zs - hLs;
  const hglPumpOutlet = hglPumpInlet + TDH;
  const hglEnd = hglPumpOutlet - hLd;

  const hglPoints = [
    { x: x0, y: yPos(Zs) },
    { x: x1, y: yPos(Zs - hLs * 0.1) },
    { x: x2, y: yPos(hglPumpInlet) },
    // Pump pressure boost jump
    { x: x3, y: yPos(hglPumpOutlet) },
    { x: x4, y: yPos(hglPumpOutlet - hLd * 0.7) },
    { x: x5, y: yPos(hglEnd) },
  ];

  // EGL points: EGL = HGL + V²/2g
  const eglPoints = [
    { x: x0, y: yPos(Zs) },
    { x: x1, y: yPos(Zs - hLs * 0.1 + velHeadS) },
    { x: x2, y: yPos(hglPumpInlet + velHeadS) },
    { x: x3, y: yPos(hglPumpOutlet + velHeadD) },
    { x: x4, y: yPos(hglPumpOutlet - hLd * 0.7 + velHeadD) },
    { x: x5, y: yPos(hglEnd + velHeadD) },
  ];

  const makePath = (pts: { x: number; y: number }[], breakIndex?: number) => {
    if (breakIndex !== undefined) {
      const part1 = pts.slice(0, breakIndex + 1).map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
      const part2 = pts.slice(breakIndex + 1).map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
      return { part1, part2 };
    }
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
  };

  const pipePath = makePath(pipeInvert) as string;
  const { part1: hglSuction, part2: hglDischarge } = makePath(hglPoints, 2) as { part1: string; part2: string };
  const { part1: eglSuction, part2: eglDischarge } = makePath(eglPoints, 2) as { part1: string; part2: string };

  const elevTicks = useMemo(() => {
    const ticks = [];
    const step = elevRange > 100 ? 25 : elevRange > 50 ? 10 : elevRange > 20 ? 5 : 2;
    for (let e = Math.ceil(minElevM / step) * step; e <= maxElevM; e += step) {
      ticks.push(e);
    }
    return ticks;
  }, [minElevM, maxElevM, elevRange]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col">
      <div className="p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              Hydraulic & Energy Grade Line Profile (HGL / EGL)
            </h2>
            <p className="text-xs text-slate-400">
              Pipeline stationing, pressure head gradient, and pump total dynamic boost
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 bg-cyan-400 rounded-full inline-block"></span>
            <span className="text-cyan-300 font-medium">HGL (P/γ + Z)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 bg-rose-400 border-dashed border-t inline-block"></span>
            <span className="text-rose-300 font-medium">EGL (HGL + V²/2g)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 bg-slate-400 rounded-full inline-block"></span>
            <span className="text-slate-300 font-medium">Pipe Invert</span>
          </div>
        </div>
      </div>

      <div className="p-2 bg-slate-950 overflow-hidden">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto select-none">
          <defs>
            <linearGradient id="suctionTankGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="dischargeTankGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Elevation Grid Lines */}
          <g className="opacity-20 stroke-slate-600">
            {elevTicks.map((tick) => (
              <line
                key={`grid-${tick}`}
                x1={pad.left}
                y1={yPos(tick)}
                x2={svgWidth - pad.right}
                y2={yPos(tick)}
                strokeDasharray="2 2"
              />
            ))}
          </g>

          {/* Elevation Axis */}
          <g className="text-xs font-mono fill-slate-400">
            <line
              x1={pad.left}
              y1={pad.top}
              x2={pad.left}
              y2={pad.top + pHeight}
              stroke="#475569"
              strokeWidth="1.5"
            />
            {elevTicks.map((tick) => (
              <g key={`lbl-e-${tick}`}>
                <line x1={pad.left - 4} y1={yPos(tick)} x2={pad.left} y2={yPos(tick)} stroke="#475569" />
                <text x={pad.left - 8} y={yPos(tick) + 4} textAnchor="end" fontSize="10">
                  {headToDisplay(tick, unitSystem).toFixed(0)}
                </text>
              </g>
            ))}
            <text
              transform={`rotate(-90)`}
              x={-(pad.top + pHeight / 2)}
              y={pad.left - 35}
              textAnchor="middle"
              className="fill-slate-400 font-sans font-semibold text-[11px]"
            >
              Elevation ({labels.elevation})
            </text>
          </g>

          {/* Suction Reservoir Box */}
          <rect
            x={x0 - 15}
            y={yPos(Zs)}
            width={40}
            height={Math.max(10, pad.top + pHeight - yPos(Zs))}
            fill="url(#suctionTankGrad)"
            stroke="#0284c7"
            strokeWidth="1.5"
            rx="2"
          />
          <text x={x0 + 5} y={yPos(Zs) - 8} fill="#38bdf8" fontSize="10" textAnchor="middle" fontWeight="bold">
            Suction Tank
          </text>

          {/* Discharge Point / Tank */}
          <rect
            x={x5 - 25}
            y={yPos(Zd)}
            width={40}
            height={Math.max(10, pad.top + pHeight - yPos(Zd))}
            fill="url(#dischargeTankGrad)"
            stroke="#06b6d4"
            strokeWidth="1.5"
            rx="2"
          />
          <text x={x5 - 5} y={yPos(Zd) - 8} fill="#22d3ee" fontSize="10" textAnchor="middle" fontWeight="bold">
            Discharge Point
          </text>

          {/* Pump Symbol in the middle */}
          <g transform={`translate(${x2 + (x3 - x2) / 2}, ${yPos(0)})`}>
            {/* Centerline datum line */}
            <line x1="-30" y1="0" x2="30" y2="0" stroke="#64748b" strokeDasharray="3 2" />
            <circle cx="0" cy="0" r="14" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
            {/* Impeller icon */}
            <path d="M-6 -6 L6 6 M-6 6 L6 -6" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
            <text x="0" y="24" fill="#f8fafc" fontSize="10" textAnchor="middle" fontWeight="bold">
              Pump Centerline (0.0)
            </text>
          </g>

          {/* Pipe Invert path */}
          <path d={pipePath} fill="none" stroke="#64748b" strokeWidth="4" strokeLinecap="round" />

          {/* HGL Paths */}
          <path d={hglSuction} fill="none" stroke="#06b6d4" strokeWidth="2.5" />
          <path d={hglDischarge} fill="none" stroke="#06b6d4" strokeWidth="2.5" />

          {/* Pump Head Jump line */}
          <line
            x1={x2}
            y1={yPos(hglPumpInlet)}
            x2={x3}
            y2={yPos(hglPumpOutlet)}
            stroke="#06b6d4"
            strokeWidth="2.5"
            strokeDasharray="4 2"
          />

          {/* EGL Paths */}
          <path d={eglSuction} fill="none" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.8" />
          <path d={eglDischarge} fill="none" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.8" />

          {/* TDH Dimension Arrow */}
          <g transform={`translate(${x3 + 20}, 0)`}>
            <line
              x1="0"
              y1={yPos(hglPumpInlet)}
              x2="0"
              y2={yPos(hglPumpOutlet)}
              stroke="#ec4899"
              strokeWidth="2"
            />
            <polygon points={`-4,${yPos(hglPumpOutlet) + 6} 4,${yPos(hglPumpOutlet) + 6} 0,${yPos(hglPumpOutlet)}`} fill="#ec4899" />
            <polygon points={`-4,${yPos(hglPumpInlet) - 6} 4,${yPos(hglPumpInlet) - 6} 0,${yPos(hglPumpInlet)}`} fill="#ec4899" />
            <rect
              x="6"
              y={(yPos(hglPumpInlet) + yPos(hglPumpOutlet)) / 2 - 12}
              width="78"
              height="22"
              rx="4"
              fill="#0f172a"
              stroke="#ec4899"
              strokeWidth="1"
            />
            <text
              x="45"
              y={(yPos(hglPumpInlet) + yPos(hglPumpOutlet)) / 2 + 3}
              fill="#f472b6"
              fontSize="10"
              fontWeight="bold"
              textAnchor="middle"
            >
              TDH: {headToDisplay(TDH, unitSystem).toFixed(1)} {labels.head}
            </text>
          </g>

          {/* Bottom Stations text */}
          <text x={x0} y={svgHeight - 12} fill="#94a3b8" fontSize="10" textAnchor="middle">
            Suction Intake (L=0)
          </text>
          <text x={x2} y={svgHeight - 12} fill="#94a3b8" fontSize="10" textAnchor="middle">
            L_s = {lengthToDisplay(suction.lengthM, unitSystem).toFixed(1)} {labels.length}
          </text>
          <text x={x5} y={svgHeight - 12} fill="#94a3b8" fontSize="10" textAnchor="middle">
            Total L = {lengthToDisplay(suction.lengthM + discharge.lengthM, unitSystem).toFixed(0)} {labels.length}
          </text>
        </svg>
      </div>

      {/* Hydraulic Grade summary footer */}
      <div className="px-4 py-2.5 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Suction Total Losses (hf + hm):</span>
          <span className="font-mono text-cyan-400 font-semibold">
            {headToDisplay(hLs, unitSystem).toFixed(2)} {labels.head}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Discharge Total Losses (hf + hm):</span>
          <span className="font-mono text-cyan-400 font-semibold">
            {headToDisplay(hLd, unitSystem).toFixed(2)} {labels.head}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Static Lift (Zd - Zs):</span>
          <span className="font-mono text-emerald-400 font-semibold">
            {headToDisplay(Zd - Zs, unitSystem).toFixed(2)} {labels.head}
          </span>
        </div>
      </div>
    </div>
  );
};
