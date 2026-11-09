import React, { useState } from 'react';
import { ProjectData, HydraulicCalculationResults } from '../types/hydraulics';
import {
  UNIT_LABELS,
  flowToDisplay,
  headToDisplay,
  powerToDisplay,
  formatNum,
} from '../utils/units';
import {
  Gauge,
  Zap,
  ShieldAlert,
  ShieldCheck,
  DollarSign,
  Droplets,
  AlertTriangle,
  Info,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  X,
} from 'lucide-react';

interface Props {
  project: ProjectData;
  results: HydraulicCalculationResults;
}

export const ResultsSummary: React.FC<Props> = ({ project, results }) => {
  const { unitSystem } = project;
  const labels = UNIT_LABELS[unitSystem];
  const [isNpshTooltipOpen, setIsNpshTooltipOpen] = useState(false);

  const op = results.operatingPoint;
  const warnings = results.warnings;
  const isNpshBelowHalfMeter = results.npshMarginM < 0.5;

  return (
    <div className="space-y-4">
      {/* Real-time Engineering Warnings Banner (if any) */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((w) => (
            <div
              key={w.id}
              className={`p-3.5 rounded-xl border flex items-start gap-3 transition shadow-md ${
                w.severity === 'critical'
                  ? 'bg-rose-950/40 border-rose-800/80 text-rose-200'
                  : w.severity === 'warning'
                  ? 'bg-amber-950/40 border-amber-800/70 text-amber-200'
                  : 'bg-sky-950/40 border-sky-800/70 text-sky-200'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {w.severity === 'critical' ? (
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                ) : w.severity === 'warning' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                ) : (
                  <Info className="w-5 h-5 text-sky-400" />
                )}
              </div>
              <div className="flex-1 text-xs">
                <div className="font-semibold text-sm mb-0.5 flex items-center gap-2">
                  <span>{w.title}</span>
                  <span
                    className={`text-[10px] uppercase tracking-wider px-1.5 py-0.2 rounded font-mono font-bold ${
                      w.severity === 'critical'
                        ? 'bg-rose-900/60 text-rose-300'
                        : w.severity === 'warning'
                        ? 'bg-amber-900/60 text-amber-300'
                        : 'bg-sky-900/60 text-sky-300'
                    }`}
                  >
                    {w.severity}
                  </span>
                </div>
                <p className="opacity-90 leading-relaxed mb-1">{w.message}</p>
                <p className="font-medium text-[11px] opacity-100 flex items-center gap-1.5 pt-1 border-t border-white/10">
                  <span className="underline font-semibold">Recommendation:</span>
                  <span>{w.recommendation}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Dynamic Head (TDH) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-md hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-cyan-400" />
              Total Dynamic Head
            </span>
            <span className="font-mono text-[10px] bg-cyan-950/80 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-800/50">
              TDH
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-white">
              {headToDisplay(results.totalDynamicHeadM, unitSystem).toFixed(2)}
            </span>
            <span className="text-xs font-medium text-slate-400">{labels.head}</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex flex-col gap-0.5 pt-2 border-t border-slate-800">
            <div className="flex justify-between">
              <span>Static Head:</span>
              <span className="font-mono text-slate-300">
                {headToDisplay(results.staticHeadM, unitSystem).toFixed(1)} {labels.head}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total Friction Loss:</span>
              <span className="font-mono text-slate-300">
                {headToDisplay(results.suctionTotalLossM + results.dischargeTotalLossM, unitSystem).toFixed(1)}{' '}
                {labels.head}
              </span>
            </div>
          </div>
        </div>

        {/* Operating Point Flow */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-md hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-pink-400" />
              Duty Operating Point
            </span>
            <span className="font-mono text-[10px] bg-pink-950/80 text-pink-300 px-1.5 py-0.5 rounded border border-pink-800/50">
              Q_OP
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-pink-300">
              {flowToDisplay(op?.flowM3h || results.designFlowM3h, unitSystem).toFixed(1)}
            </span>
            <span className="text-xs font-medium text-slate-400">{labels.flow}</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex flex-col gap-0.5 pt-2 border-t border-slate-800">
            <div className="flex justify-between">
              <span>Design Target:</span>
              <span className="font-mono text-slate-300">
                {flowToDisplay(results.designFlowM3h, unitSystem).toFixed(1)} {labels.flow}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Pump Efficiency (η):</span>
              <span className="font-mono text-emerald-400 font-semibold">
                {op?.efficiency || results.pumpEfficiencyAtDuty}%
              </span>
            </div>
          </div>
        </div>

        {/* NPSH Available vs Required */}
        <div
          className={`bg-slate-900 border rounded-xl p-3.5 shadow-md transition relative ${
            isNpshBelowHalfMeter
              ? 'border-amber-500/80 ring-1 ring-amber-500/40 bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950/20'
              : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium flex items-center gap-1.5">
              {isNpshBelowHalfMeter ? (
                <div className="p-1 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-400 animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                </div>
              ) : results.isCavitationRisk ? (
                <ShieldAlert className="w-4 h-4 text-amber-400" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              )}
              <span className={isNpshBelowHalfMeter ? 'text-amber-200 font-semibold' : ''}>
                NPSH Margin
              </span>
            </span>

            {/* Warning indicator button with tooltip trigger */}
            <div className="relative group/npsh-tooltip">
              <button
                type="button"
                onClick={() => setIsNpshTooltipOpen((prev) => !prev)}
                onMouseEnter={() => setIsNpshTooltipOpen(true)}
                onMouseLeave={() => setIsNpshTooltipOpen(false)}
                className={`font-mono text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 transition cursor-pointer select-none ${
                  isNpshBelowHalfMeter
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/70 shadow-sm animate-pulse font-bold hover:bg-amber-500/30'
                    : results.isCavitationRisk
                    ? 'bg-amber-950 text-amber-300 border-amber-800'
                    : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                }`}
                aria-label={
                  isNpshBelowHalfMeter
                    ? 'Warning: NPSH safety margin is below 0.5m: Cavitation Hazard'
                    : results.isCavitationRisk
                    ? 'NPSH Warning'
                    : 'NPSH Safe'
                }
              >
                {isNpshBelowHalfMeter && (
                  <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                )}
                <span>
                  {isNpshBelowHalfMeter
                    ? '< 0.5m RISK'
                    : results.isCavitationRisk
                    ? 'RISK'
                    : 'SAFE'}
                </span>
                {isNpshBelowHalfMeter && (
                  <HelpCircle className="w-2.5 h-2.5 text-amber-400/80 shrink-0" />
                )}
              </button>

              {/* Floating Tooltip explaining the cavitation risk */}
              <div
                className={`absolute right-0 top-full mt-2 z-50 w-80 sm:w-96 p-4 rounded-xl bg-slate-950/98 border border-amber-500/70 shadow-2xl backdrop-blur-xl text-slate-100 transition-all duration-200 pointer-events-auto ${
                  isNpshTooltipOpen
                    ? 'block opacity-100'
                    : 'hidden group-hover/npsh-tooltip:block'
                }`}
                onMouseEnter={() => setIsNpshTooltipOpen(true)}
                onMouseLeave={() => setIsNpshTooltipOpen(false)}
              >
                {/* Tooltip Header */}
                <div className="flex items-start justify-between gap-2 pb-2.5 mb-2.5 border-b border-amber-500/30">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                      <AlertTriangle className="w-4 h-4 animate-bounce" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                        Cavitation Risk Warning
                        <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/30 text-amber-200 font-mono">
                          Margin &lt; 0.5m
                        </span>
                      </h4>
                      <p className="text-[10px] text-amber-400/90 font-medium">
                        Safety threshold: Minimum recommended margin is ≥ 0.50 m (1.64 ft)
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsNpshTooltipOpen(false);
                    }}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    aria-label="Close tooltip"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Live Margins Readout */}
                <div className="grid grid-cols-3 gap-1.5 p-2 rounded-lg bg-amber-950/40 border border-amber-800/60 mb-2.5 font-mono text-[10px] text-center">
                  <div>
                    <span className="text-slate-400 block text-[9px]">Available (NPSHa):</span>
                    <span className="font-bold text-slate-100">
                      {headToDisplay(results.npshAvailableM, unitSystem).toFixed(2)} {labels.head}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px]">Required (NPSHr):</span>
                    <span className="font-bold text-slate-100">
                      {headToDisplay(results.npshRequiredM, unitSystem).toFixed(2)} {labels.head}
                    </span>
                  </div>
                  <div className="bg-amber-500/20 rounded p-0.5 border border-amber-500/30">
                    <span className="text-amber-300 block text-[9px] font-bold">Net Margin:</span>
                    <span className="font-extrabold text-amber-400">
                      {results.npshMarginM >= 0 ? '+' : ''}
                      {headToDisplay(results.npshMarginM, unitSystem).toFixed(2)} {labels.head}
                    </span>
                  </div>
                </div>

                {/* Explanation of Cavitation Risk */}
                <div className="space-y-2 text-[11px] leading-relaxed text-slate-300">
                  <div>
                    <p className="font-semibold text-amber-300 text-[11px] mb-0.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block"></span>
                      What causes cavitation here?
                    </p>
                    <p className="text-slate-400 text-[10.5px]">
                      When the NPSH safety margin drops below 0.5m, localized fluid pressure at the pump suction impeller eye drops below the fluid vapor pressure ({project.fluid.vaporPressureKPa.toFixed(2)} kPa abs). The fluid spontaneously flashes into vapor pockets.
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-rose-300 text-[11px] mb-0.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block"></span>
                      Physical damage & operational hazards:
                    </p>
                    <ul className="text-slate-300 space-y-1 text-[10.5px] pl-2 border-l border-amber-500/30">
                      <li>
                        <strong className="text-slate-100">Impeller Pitting:</strong> As vapor bubbles enter high-pressure areas, they implode violently with micro-jets reaching up to 1,000 MPa, gouging blade metal.
                      </li>
                      <li>
                        <strong className="text-slate-100">Acoustic Noise & Vibration:</strong> Loud gravel-like rattling sound and severe high-frequency structural vibration.
                      </li>
                      <li>
                        <strong className="text-slate-100">Mechanical Seal & Bearing Rupture:</strong> Hydraulic shock pulses destroy mechanical faces and cause shaft deflection.
                      </li>
                      <li>
                        <strong className="text-slate-100">Hydraulic Choking:</strong> Sudden drop in flow rate and discharge head capacity.
                      </li>
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <p className="font-semibold text-cyan-300 text-[11px] mb-0.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block"></span>
                      How to restore safe margin (≥ 0.5m - 1.0m):
                    </p>
                    <ul className="text-slate-400 space-y-0.5 text-[10px] pl-2">
                      <li>• Upsize the suction pipe diameter to reduce fluid velocity and line friction ($h_f$).</li>
                      <li>• Shorten suction pipe run and remove unnecessary fittings (bends, valves, strainers).</li>
                      <li>• Elevate the supply tank water level or increase suction vessel head ($Z_s$).</li>
                      <li>• Lower fluid operating temperature if applicable to decrease vapor pressure ($P_v$).</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Metric value and pulsing amber indicator */}
          <div className="flex items-baseline justify-between mt-1">
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-2xl font-bold font-mono transition-colors ${
                  isNpshBelowHalfMeter
                    ? 'text-amber-400'
                    : results.isCavitationRisk
                    ? 'text-amber-300'
                    : 'text-emerald-400'
                }`}
              >
                {results.npshMarginM >= 0 ? '+' : ''}
                {headToDisplay(results.npshMarginM, unitSystem).toFixed(2)}
              </span>
              <span className="text-xs font-medium text-slate-400">{labels.head}</span>
            </div>

            {/* Amber pulsating visual beacon when margin < 0.5m */}
            {isNpshBelowHalfMeter && (
              <div
                className="relative flex items-center gap-1.5 cursor-pointer select-none"
                onClick={() => setIsNpshTooltipOpen((prev) => !prev)}
                onMouseEnter={() => setIsNpshTooltipOpen(true)}
                onMouseLeave={() => setIsNpshTooltipOpen(false)}
                title="Click or hover to inspect Cavitation Risk Advisory"
              >
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
                <span className="text-[10px] font-mono font-bold text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>&lt;0.5m</span>
                </span>
              </div>
            )}
          </div>

          {/* Breakdown: NPSHa vs NPSHr */}
          <div className="mt-2 text-[11px] text-slate-400 flex flex-col gap-0.5 pt-2 border-t border-slate-800">
            <div className="flex justify-between">
              <span>NPSH Available (NPSHa):</span>
              <span className="font-mono text-slate-300">
                {headToDisplay(results.npshAvailableM, unitSystem).toFixed(2)} {labels.head}
              </span>
            </div>
            <div className="flex justify-between">
              <span>NPSH Required (NPSHr):</span>
              <span className="font-mono text-slate-300">
                {headToDisplay(results.npshRequiredM, unitSystem).toFixed(2)} {labels.head}
              </span>
            </div>
          </div>

          {/* Real-time warning alert bar inside card when margin < 0.5m */}
          {isNpshBelowHalfMeter && (
            <div
              className="mt-2.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2 shadow-sm cursor-pointer hover:bg-amber-500/20 transition group animate-fade-in"
              onClick={() => setIsNpshTooltipOpen((prev) => !prev)}
              onMouseEnter={() => setIsNpshTooltipOpen(true)}
              onMouseLeave={() => setIsNpshTooltipOpen(false)}
            >
              <div className="p-1 rounded bg-amber-500/20 border border-amber-500/40 text-amber-400 shrink-0 mt-0.5">
                <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300 text-[11px] flex items-center gap-1">
                    Cavitation Hazard Alert
                  </span>
                  <span className="text-[9px] font-mono text-amber-400 underline group-hover:text-amber-200">
                    Learn more &rarr;
                  </span>
                </div>
                <p className="text-[10px] text-amber-200/90 leading-tight mt-0.5">
                  Margin is below 0.5m. Risk of destructive impeller vapor bubble collapse and pitting.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Power & Motor Sizing */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-md hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              Motor Size / Power
            </span>
            <span className="font-mono text-[10px] bg-amber-950/80 text-amber-300 px-1.5 py-0.5 rounded border border-amber-800/50">
              IEC/NEMA
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-amber-400">
              {powerToDisplay(results.motorRecommendedKw, unitSystem).toFixed(1)}
            </span>
            <span className="text-xs font-medium text-slate-400">{labels.power}</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex flex-col gap-0.5 pt-2 border-t border-slate-800">
            <div className="flex justify-between">
              <span>Brake Shaft Power:</span>
              <span className="font-mono text-slate-300">
                {powerToDisplay(results.shaftBrakePowerKw, unitSystem).toFixed(1)} {labels.power}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Hydraulic Power:</span>
              <span className="font-mono text-slate-300">
                {powerToDisplay(results.hydraulicPowerKw, unitSystem).toFixed(1)} {labels.power}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Hydraulic Breakdown Table & OPEX */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Head Losses Breakdown */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-200 font-semibold mb-2.5 pb-2 border-b border-slate-800">
            <Gauge className="w-4 h-4 text-cyan-400" />
            <span>Head Loss Breakdown</span>
          </div>
          <div className="space-y-1.5 text-slate-400">
            <div className="flex justify-between py-0.5">
              <span>Suction Pipe Friction (hf_s):</span>
              <span className="font-mono text-slate-200">
                {headToDisplay(results.suctionPipeFrictionM, unitSystem).toFixed(2)} {labels.head}
              </span>
            </div>
            <div className="flex justify-between py-0.5">
              <span>Suction Minor Losses (hm_s):</span>
              <span className="font-mono text-slate-200">
                {headToDisplay(results.suctionMinorLossM, unitSystem).toFixed(2)} {labels.head}
              </span>
            </div>
            <div className="flex justify-between py-0.5">
              <span>Discharge Pipe Friction (hf_d):</span>
              <span className="font-mono text-slate-200">
                {headToDisplay(results.dischargePipeFrictionM, unitSystem).toFixed(2)} {labels.head}
              </span>
            </div>
            <div className="flex justify-between py-0.5">
              <span>Discharge Minor Losses (hm_d):</span>
              <span className="font-mono text-slate-200">
                {headToDisplay(results.dischargeMinorLossM, unitSystem).toFixed(2)} {labels.head}
              </span>
            </div>
            <div className="flex justify-between py-0.5">
              <span>Pressure Difference Head:</span>
              <span className="font-mono text-slate-200">
                {headToDisplay(results.pressureHeadM, unitSystem).toFixed(2)} {labels.head}
              </span>
            </div>
            <div className="flex justify-between py-0.5">
              <span>Velocity Head Difference (ΔV²/2g):</span>
              <span className="font-mono text-slate-200">
                {headToDisplay(results.velocityHeadDiffM, unitSystem).toFixed(3)} {labels.head}
              </span>
            </div>
          </div>
        </div>

        {/* Pipeline Hydraulics & Velocity Check */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-200 font-semibold mb-2.5 pb-2 border-b border-slate-800">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Line Velocities & Flow Regime</span>
          </div>
          <div className="space-y-2 text-slate-400">
            <div>
              <div className="flex justify-between mb-1">
                <span>Suction Velocity:</span>
                <span
                  className={`font-mono font-semibold ${
                    results.suctionVelocityMs > 2.0
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {(unitSystem === 'imperial'
                    ? results.suctionVelocityMs * 3.28084
                    : results.suctionVelocityMs
                  ).toFixed(2)}{' '}
                  {labels.velocity}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    results.suctionVelocityMs > 2.0 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.min(100, (results.suctionVelocityMs / 2.5) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                <span>Re = {results.suctionReynolds.toLocaleString()}</span>
                <span className="capitalize">{results.suctionRegime} (f={results.suctionFrictionFactor})</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span>Discharge Velocity:</span>
                <span
                  className={`font-mono font-semibold ${
                    results.dischargeVelocityMs > 3.0
                      ? 'text-rose-400'
                      : results.dischargeVelocityMs < 0.6
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {(unitSystem === 'imperial'
                    ? results.dischargeVelocityMs * 3.28084
                    : results.dischargeVelocityMs
                  ).toFixed(2)}{' '}
                  {labels.velocity}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    results.dischargeVelocityMs > 3.0 ? 'bg-rose-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.min(100, (results.dischargeVelocityMs / 3.5) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                <span>Re = {results.dischargeReynolds.toLocaleString()}</span>
                <span className="capitalize">{results.dischargeRegime} (f={results.dischargeFrictionFactor})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Operating Cost & Lifecycle Carbon */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-200 font-semibold mb-2.5 pb-2 border-b border-slate-800">
            <DollarSign className="w-4 h-4 text-amber-400" />
            <span>Energy & Operating Cost (OPEX)</span>
          </div>
          <div className="space-y-1.5 text-slate-400">
            <div className="flex justify-between py-0.5">
              <span>Operating Schedule:</span>
              <span className="font-mono text-slate-200">
                {project.operatingHoursPerDay} hrs/day ({project.operatingHoursPerDay * 365} hrs/yr)
              </span>
            </div>
            <div className="flex justify-between py-0.5">
              <span>Power Draw (Electrical):</span>
              <span className="font-mono text-amber-400 font-semibold">
                {results.electricalPowerKw.toFixed(2)} kW
              </span>
            </div>
            <div className="flex justify-between py-0.5">
              <span>Annual Energy:</span>
              <span className="font-mono text-slate-200">
                {results.annualEnergyKwh.toLocaleString()} kWh/yr
              </span>
            </div>
            <div className="flex justify-between py-0.5">
              <span>Tariff Rate:</span>
              <span className="font-mono text-slate-200">
                ${project.electricityCostPerKwh.toFixed(3)} / kWh
              </span>
            </div>
            <div className="flex justify-between py-1 bg-amber-500/10 px-2 rounded border border-amber-500/20 text-slate-200">
              <span className="font-medium text-amber-300">Est. Annual Energy Cost:</span>
              <span className="font-mono font-bold text-amber-400">
                ${results.annualOperatingCostUsd.toLocaleString()} / yr
              </span>
            </div>
            <div className="flex justify-between py-0.5 text-[11px] text-slate-500">
              <span>Annual CO2 Footprint:</span>
              <span>{results.annualCo2Tons.toFixed(1)} metric tons CO2e</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
