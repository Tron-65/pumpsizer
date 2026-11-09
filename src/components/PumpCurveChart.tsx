import React, { useState, useMemo } from 'react';
import { ProjectData, HydraulicCalculationResults, PumpModel } from '../types/hydraulics';
import { PUMP_CATALOG } from '../data/defaultCatalog';
import {
  evaluatePumpHead,
  evaluatePumpEfficiency,
  evaluatePumpNpshr,
} from '../utils/engineering';
import { UNIT_LABELS, flowToDisplay, headToDisplay, powerToDisplay } from '../utils/units';
import {
  Layers,
  Sliders,
  Maximize2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface Props {
  project: ProjectData;
  results: HydraulicCalculationResults;
  onUpdateVfd: (vfd: number) => void;
  onUpdateConfig: (config: ProjectData['pumpConfiguration']) => void;
  onSelectPump: (pumpId: string) => void;
  onOpenPumpSelector: () => void;
}

export const PumpCurveChart: React.FC<Props> = ({
  project,
  results,
  onUpdateVfd,
  onUpdateConfig,
  onOpenPumpSelector,
}) => {
  const { unitSystem, vfdSpeedRatio, pumpConfiguration } = project;
  const labels = UNIT_LABELS[unitSystem];

  // Active layers
  const [showEfficiency, setShowEfficiency] = useState(true);
  const [showPower, setShowPower] = useState(false);
  const [showNpshr, setShowNpshr] = useState(false);
  const [showPorBand, setShowPorBand] = useState(true);

  // Hover state
  const [hoverX, setHoverX] = useState<number | null>(null);

  const activePump: PumpModel =
    project.customPump ||
    PUMP_CATALOG.find((p) => p.id === project.selectedPumpId) ||
    PUMP_CATALOG[0];

  // Coordinate math for SVG
  const width = 800;
  const height = 440;
  const padding = { top: 30, right: 65, bottom: 50, left: 65 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Max bounds
  const maxFlowM3h = useMemo(() => {
    let base = activePump.maxFlow * 1.25;
    if (pumpConfiguration === 'parallel_2') base *= 2;
    if (pumpConfiguration === 'parallel_3') base *= 3;
    return Math.max(base, results.designFlowM3h * 1.4, (results.operatingPoint?.flowM3h || 0) * 1.25);
  }, [activePump, pumpConfiguration, results]);

  const maxHeadM = useMemo(() => {
    let base = activePump.shutoffHead * Math.pow(Math.max(1, vfdSpeedRatio), 2) * 1.2;
    if (pumpConfiguration === 'series_2') base *= 2;
    return Math.max(base, results.totalDynamicHeadM * 1.3, (results.operatingPoint?.headM || 0) * 1.2);
  }, [activePump, vfdSpeedRatio, pumpConfiguration, results]);

  // Scalers
  const xScale = (flowM3h: number) => padding.left + (flowM3h / maxFlowM3h) * plotWidth;
  const yScaleHead = (headM: number) => padding.top + plotHeight - (headM / maxHeadM) * plotHeight;
  const yScaleEff = (effPercent: number) => padding.top + plotHeight - (effPercent / 100) * plotHeight;

  // Flow from SVG x coordinate
  const xToFlow = (svgX: number) => {
    const clamped = Math.max(padding.left, Math.min(width - padding.right, svgX));
    return ((clamped - padding.left) / plotWidth) * maxFlowM3h;
  };

  // Generate Pump Curve path points
  const pumpCurvePath = useMemo(() => {
    const points: string[] = [];
    const steps = 80;
    for (let i = 0; i <= steps; i++) {
      const q = (maxFlowM3h * i) / steps;
      const h = evaluatePumpHead(activePump, q, vfdSpeedRatio, pumpConfiguration);
      const x = xScale(q);
      const y = yScaleHead(h);
      points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return points.join(' ');
  }, [activePump, vfdSpeedRatio, pumpConfiguration, maxFlowM3h, maxHeadM]);

  // Generate System Curve path points
  const systemCurvePath = useMemo(() => {
    if (!results.systemCurvePoints || results.systemCurvePoints.length === 0) return '';
    return results.systemCurvePoints
      .map((pt, i) => {
        const x = xScale(pt.flow);
        const y = yScaleHead(pt.head);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [results.systemCurvePoints, maxFlowM3h, maxHeadM]);

  // Generate Efficiency Curve path points
  const effCurvePath = useMemo(() => {
    const points: string[] = [];
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const q = (maxFlowM3h * i) / steps;
      const eff = evaluatePumpEfficiency(activePump, q, vfdSpeedRatio);
      const x = xScale(q);
      const y = yScaleEff(eff);
      points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return points.join(' ');
  }, [activePump, vfdSpeedRatio, maxFlowM3h]);

  // Preferred Operating Region (POR) X coordinates (70% - 120% of BEP)
  const porStartX = xScale(activePump.bepFlow * 0.7 * vfdSpeedRatio);
  const porEndX = xScale(activePump.bepFlow * 1.2 * vfdSpeedRatio);

  // Probe values at cursor
  const probeFlow = hoverX !== null ? xToFlow(hoverX) : null;
  const probeHead =
    probeFlow !== null ? evaluatePumpHead(activePump, probeFlow, vfdSpeedRatio, pumpConfiguration) : null;
  const probeEff = probeFlow !== null ? evaluatePumpEfficiency(activePump, probeFlow, vfdSpeedRatio) : null;
  const probeNpshr = probeFlow !== null ? evaluatePumpNpshr(activePump, probeFlow, vfdSpeedRatio) : null;

  // Grid tick values
  const flowTicks = useMemo(() => {
    const count = 6;
    return Array.from({ length: count + 1 }, (_, i) => (maxFlowM3h * i) / count);
  }, [maxFlowM3h]);

  const headTicks = useMemo(() => {
    const count = 5;
    return Array.from({ length: count + 1 }, (_, i) => (maxHeadM * i) / count);
  }, [maxHeadM]);

  const op = results.operatingPoint;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col">
      {/* Header bar */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">
            HQ
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-100">{activePump.model}</h2>
              <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
                {activePump.manufacturer}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              BEP: {flowToDisplay(activePump.bepFlow, unitSystem).toFixed(1)} {labels.flow} @ {headToDisplay(activePump.bepHead, unitSystem).toFixed(1)} {labels.head} (η = {activePump.bepEfficiency}%)
            </p>
          </div>
        </div>

        {/* Change pump button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenPumpSelector}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition flex items-center gap-1.5 shadow-sm"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Pump Library & Catalog
          </button>
        </div>
      </div>

      {/* Control panel & Layers */}
      <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
        {/* VFD slider */}
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="flex items-center gap-1.5 text-slate-300 font-medium whitespace-nowrap">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>VFD Speed:</span>
            <span className="font-mono text-cyan-400 font-bold">
              {(vfdSpeedRatio * 100).toFixed(0)}%
            </span>
            <span className="text-slate-500 text-[11px]">
              ({Math.round(activePump.rpm * vfdSpeedRatio)} RPM)
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="1.2"
            step="0.02"
            value={vfdSpeedRatio}
            onChange={(e) => onUpdateVfd(parseFloat(e.target.value))}
            className="flex-1 accent-cyan-400 h-1.5 bg-slate-800 rounded cursor-pointer"
          />
          {vfdSpeedRatio !== 1.0 && (
            <button
              onClick={() => onUpdateVfd(1.0)}
              title="Reset speed to 100%"
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Multi-pump arrangement */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Config:</span>
          <div className="inline-flex rounded-lg border border-slate-800 p-0.5 bg-slate-900">
            {[
              { id: 'single', label: '1x Single' },
              { id: 'parallel_2', label: '2x Parallel' },
              { id: 'parallel_3', label: '3x Parallel' },
              { id: 'series_2', label: '2x Series' },
            ].map((cfg) => (
              <button
                key={cfg.id}
                onClick={() => onUpdateConfig(cfg.id as any)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition ${
                  pumpConfiguration === cfg.id
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cfg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Layers toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-slate-400">
            <Layers className="w-3.5 h-3.5" />
            <span>Layers:</span>
          </div>
          <label className="flex items-center gap-1.5 text-emerald-400 cursor-pointer">
            <input
              type="checkbox"
              checked={showEfficiency}
              onChange={(e) => setShowEfficiency(e.target.checked)}
              className="accent-emerald-400 rounded"
            />
            <span>Efficiency (η)</span>
          </label>
          <label className="flex items-center gap-1.5 text-amber-400 cursor-pointer">
            <input
              type="checkbox"
              checked={showPorBand}
              onChange={(e) => setShowPorBand(e.target.checked)}
              className="accent-amber-400 rounded"
            />
            <span>POR Band (70-120%)</span>
          </label>
          <label className="flex items-center gap-1.5 text-rose-400 cursor-pointer">
            <input
              type="checkbox"
              checked={showNpshr}
              onChange={(e) => setShowNpshr(e.target.checked)}
              className="accent-rose-400 rounded"
            />
            <span>NPSHr</span>
          </label>
        </div>
      </div>

      {/* Main SVG Chart container */}
      <div className="relative w-full overflow-hidden p-2 bg-slate-950 flex-1">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const svgX = ((e.clientX - rect.left) / rect.width) * width;
            if (svgX >= padding.left && svgX <= width - padding.right) {
              setHoverX(svgX);
            } else {
              setHoverX(null);
            }
          }}
          onMouseLeave={() => setHoverX(null)}
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="systemCurveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="porBandGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid lines */}
          <g className="opacity-20 stroke-slate-600">
            {flowTicks.map((flowVal, i) => {
              const x = xScale(flowVal);
              return (
                <line
                  key={`gx-${i}`}
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={padding.top + plotHeight}
                  strokeDasharray="3 3"
                />
              );
            })}
            {headTicks.map((headVal, i) => {
              const y = yScaleHead(headVal);
              return (
                <line
                  key={`gy-${i}`}
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  strokeDasharray="3 3"
                />
              );
            })}
          </g>

          {/* POR Band (Preferred Operating Region) */}
          {showPorBand && (
            <rect
              x={Math.max(padding.left, porStartX)}
              y={padding.top}
              width={Math.min(width - padding.right - porStartX, Math.max(0, porEndX - porStartX))}
              height={plotHeight}
              fill="url(#porBandGrad)"
              stroke="#10b981"
              strokeOpacity="0.2"
              strokeDasharray="4 2"
            />
          )}

          {/* Efficiency Curve */}
          {showEfficiency && (
            <path
              d={effCurvePath}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.2"
              strokeDasharray="6 3"
              opacity="0.85"
            />
          )}

          {/* System Curve */}
          <path
            d={systemCurvePath}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="3"
            filter="url(#glow)"
          />

          {/* Pump H-Q Curve */}
          <path
            d={pumpCurvePath}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="3.5"
            filter="url(#glow)"
          />

          {/* Operating Point Indicator (Intersection) */}
          {op && (
            <g>
              {/* Dropline to axes */}
              <line
                x1={xScale(op.flowM3h)}
                y1={padding.top + plotHeight}
                x2={xScale(op.flowM3h)}
                y2={yScaleHead(op.headM)}
                stroke="#ec4899"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <line
                x1={padding.left}
                y1={yScaleHead(op.headM)}
                x2={xScale(op.flowM3h)}
                y2={yScaleHead(op.headM)}
                stroke="#ec4899"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />

              {/* Pulsing ring */}
              <circle
                cx={xScale(op.flowM3h)}
                cy={yScaleHead(op.headM)}
                r="11"
                fill="#ec4899"
                fillOpacity="0.2"
                className="animate-ping"
              />

              {/* Center point */}
              <circle
                cx={xScale(op.flowM3h)}
                cy={yScaleHead(op.headM)}
                r="6"
                fill="#ec4899"
                stroke="#ffffff"
                strokeWidth="2.5"
              />

              {/* Operating badge callout */}
              <g
                transform={`translate(${Math.min(
                  width - padding.right - 140,
                  Math.max(padding.left + 10, xScale(op.flowM3h) + 12)
                )}, ${Math.max(padding.top + 25, yScaleHead(op.headM) - 50)})`}
              >
                <rect
                  x="0"
                  y="0"
                  width="135"
                  height="46"
                  rx="6"
                  fill="#0f172a"
                  stroke="#ec4899"
                  strokeWidth="1.5"
                  filter="url(#glow)"
                />
                <text x="8" y="16" fill="#ec4899" fontSize="10" fontWeight="bold">
                  DUTY POINT
                </text>
                <text x="8" y="30" fill="#f8fafc" fontSize="11" fontFamily="monospace">
                  Q: {flowToDisplay(op.flowM3h, unitSystem).toFixed(1)} {labels.flow}
                </text>
                <text x="8" y="42" fill="#38bdf8" fontSize="10" fontFamily="monospace">
                  H: {headToDisplay(op.headM, unitSystem).toFixed(1)} {labels.head} (η {op.efficiency}%)
                </text>
              </g>
            </g>
          )}

          {/* Design Target Point (if different from OP) */}
          <g>
            <circle
              cx={xScale(results.designFlowM3h)}
              cy={yScaleHead(results.totalDynamicHeadM)}
              r="4.5"
              fill="#f59e0b"
              stroke="#0f172a"
              strokeWidth="2"
            />
          </g>

          {/* Interactive Probe Crosshair */}
          {probeFlow !== null && hoverX !== null && (
            <g>
              <line
                x1={hoverX}
                y1={padding.top}
                x2={hoverX}
                y2={padding.top + plotHeight}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              {probeHead !== null && (
                <circle
                  cx={hoverX}
                  cy={yScaleHead(probeHead)}
                  r="4"
                  fill="#06b6d4"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              )}
            </g>
          )}

          {/* Left Axis: Head */}
          <g className="text-xs font-mono fill-slate-400">
            <line
              x1={padding.left}
              y1={padding.top}
              x2={padding.left}
              y2={padding.top + plotHeight}
              stroke="#475569"
              strokeWidth="1.5"
            />
            {headTicks.map((val, i) => {
              const y = yScaleHead(val);
              const disp = headToDisplay(val, unitSystem);
              return (
                <g key={`lbl-head-${i}`}>
                  <line x1={padding.left - 5} y1={y} x2={padding.left} y2={y} stroke="#475569" />
                  <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="11">
                    {disp.toFixed(0)}
                  </text>
                </g>
              );
            })}
            {/* Y Axis Label */}
            <text
              transform={`rotate(-90)`}
              x={-(padding.top + plotHeight / 2)}
              y={padding.left - 38}
              textAnchor="middle"
              className="fill-cyan-400 font-sans font-semibold text-[12px]"
            >
              Head ({labels.head})
            </text>
          </g>

          {/* Right Axis: Efficiency % */}
          {showEfficiency && (
            <g className="text-xs font-mono fill-emerald-400">
              <line
                x1={width - padding.right}
                y1={padding.top}
                x2={width - padding.right}
                y2={padding.top + plotHeight}
                stroke="#10b981"
                strokeWidth="1"
                strokeOpacity="0.4"
              />
              {[0, 25, 50, 75, 100].map((eff) => {
                const y = yScaleEff(eff);
                return (
                  <g key={`lbl-eff-${eff}`}>
                    <line
                      x1={width - padding.right}
                      y1={y}
                      x2={width - padding.right + 4}
                      y2={y}
                      stroke="#10b981"
                      strokeOpacity="0.4"
                    />
                    <text x={width - padding.right + 8} y={y + 4} textAnchor="start" fontSize="10">
                      {eff}%
                    </text>
                  </g>
                );
              })}
              <text
                transform={`rotate(90)`}
                x={padding.top + plotHeight / 2}
                y={-(width - padding.right + 42)}
                textAnchor="middle"
                className="fill-emerald-400 font-sans font-semibold text-[11px]"
              >
                Efficiency (%)
              </text>
            </g>
          )}

          {/* Bottom Axis: Flow */}
          <g className="text-xs font-mono fill-slate-400">
            <line
              x1={padding.left}
              y1={padding.top + plotHeight}
              x2={width - padding.right}
              y2={padding.top + plotHeight}
              stroke="#475569"
              strokeWidth="1.5"
            />
            {flowTicks.map((val, i) => {
              const x = xScale(val);
              const disp = flowToDisplay(val, unitSystem);
              return (
                <g key={`lbl-flow-${i}`}>
                  <line
                    x1={x}
                    y1={padding.top + plotHeight}
                    x2={x}
                    y2={padding.top + plotHeight + 5}
                    stroke="#475569"
                  />
                  <text x={x} y={padding.top + plotHeight + 18} textAnchor="middle" fontSize="11">
                    {disp.toFixed(0)}
                  </text>
                </g>
              );
            })}
            {/* X Axis Label */}
            <text
              x={padding.left + plotWidth / 2}
              y={height - 12}
              textAnchor="middle"
              className="fill-slate-300 font-sans font-semibold text-[12px]"
            >
              Flow Rate ({labels.flow})
            </text>
          </g>
        </svg>

        {/* Live probe readout floating box */}
        {probeFlow !== null && probeHead !== null && (
          <div className="absolute top-4 right-16 bg-slate-900/90 border border-slate-700/80 rounded-lg p-2.5 shadow-xl backdrop-blur text-xs font-mono text-slate-200 pointer-events-none min-w-[170px]">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
              Probe Coordinate
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-400">Flow:</span>
              <span className="font-semibold text-white">
                {flowToDisplay(probeFlow, unitSystem).toFixed(1)} {labels.flow}
              </span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-cyan-400">Pump Head:</span>
              <span className="font-semibold text-cyan-300">
                {headToDisplay(probeHead, unitSystem).toFixed(1)} {labels.head}
              </span>
            </div>
            {probeEff !== null && (
              <div className="flex justify-between py-0.5">
                <span className="text-emerald-400">Efficiency:</span>
                <span className="font-semibold text-emerald-300">{probeEff.toFixed(1)}%</span>
              </div>
            )}
            {probeNpshr !== null && (
              <div className="flex justify-between py-0.5">
                <span className="text-rose-400">NPSHr:</span>
                <span className="font-semibold text-rose-300">
                  {headToDisplay(probeNpshr, unitSystem).toFixed(2)} {labels.head}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend & quick readout footer */}
      <div className="px-4 py-3 bg-slate-900/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 bg-cyan-400 rounded-full inline-block"></span>
            <span className="text-slate-200 font-medium">Pump H-Q Curve</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 bg-amber-500 rounded-full inline-block"></span>
            <span className="text-slate-200 font-medium">System Curve</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full border border-white bg-pink-500 inline-block"></span>
            <span className="text-pink-300 font-medium">Operating Point</span>
          </div>
          {showEfficiency && (
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 bg-emerald-400 border-dashed border-t inline-block"></span>
              <span className="text-emerald-300 font-medium">Efficiency (η)</span>
            </div>
          )}
          {showPorBand && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-emerald-500/20 border border-emerald-500/40 rounded inline-block"></span>
              <span className="text-slate-300 font-medium">POR Region</span>
            </div>
          )}
        </div>

        {/* Operating duty readout */}
        {op && (
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
            <CheckCircle2 className="w-4 h-4 text-pink-400" />
            <span className="text-slate-300">Duty Point:</span>
            <span className="font-mono font-semibold text-white">
              {flowToDisplay(op.flowM3h, unitSystem).toFixed(1)} {labels.flow} @{' '}
              {headToDisplay(op.headM, unitSystem).toFixed(1)} {labels.head}
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-emerald-400 font-mono">η = {op.efficiency}%</span>
            <span className="text-slate-500">|</span>
            <span className="text-cyan-400 font-mono">
              {powerToDisplay(op.powerKw, unitSystem).toFixed(1)} {labels.power}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
