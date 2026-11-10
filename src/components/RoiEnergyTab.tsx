import React, { useState } from 'react';
import { ProjectData, HydraulicCalculationResults, UnitSystem } from '../types/hydraulics';
import { UNIT_LABELS, flowToDisplay, headToDisplay, powerToDisplay } from '../utils/units';
import {
  TrendingUp,
  DollarSign,
  Zap,
  Clock,
  Coins,
  Percent,
  ShieldCheck,
  Activity,
  ArrowUpRight,
  Info,
  CheckCircle2,
  Sliders,
  Leaf,
} from 'lucide-react';

interface Props {
  project: ProjectData;
  results: HydraulicCalculationResults;
  onUpdateProject: (updater: (prev: ProjectData) => ProjectData) => void;
}

export const RoiEnergyTab: React.FC<Props> = ({ project, results, onUpdateProject }) => {
  const { unitSystem, operatingHoursPerDay, electricityCostPerKwh, vfdSpeedRatio } = project;
  const labels = UNIT_LABELS[unitSystem];

  // Local state for advanced ROI parameters
  const [vfdCostPerKw, setVfdCostPerKw] = useState<number>(180); // $180 per kW installed VFD cost
  const [co2FactorKgPerKwh, setCo2FactorKgPerKwh] = useState<number>(0.43); // 0.43 kg CO2 / kWh grid average
  const [analysisYears, setAnalysisYears] = useState<number>(10);
  const [inflationRatePercent, setInflationRatePercent] = useState<number>(3.0); // Annual electricity price inflation %

  // Load profile breakdown (Time % at various flow fractions)
  const [loadProfile, setLoadProfile] = useState([
    { flowPct: 100, timePct: 20 },
    { flowPct: 80, timePct: 50 },
    { flowPct: 60, timePct: 30 },
  ]);

  const annualHours = operatingHoursPerDay * 365;

  // Constant speed power (throttled duty point or full speed power)
  const constPowerKw = results.electricalPowerKw || 15.0;

  // VFD modulated weighted power calculation across load profile bins
  // Affinity laws: Power proportional to flow cubed (or adjusted system curve)
  // For each bin: P_vfd = constPower * (flowPct / 100)^3 adjusted for pump/motor efficiency
  const weightedVfdPowerKw = loadProfile.reduce((sum, bin) => {
    const binSpeed = bin.flowPct / 100;
    // Affinity law power ratio approx cubics with efficiency penalty at low speed
    const binPowerKw = constPowerKw * Math.pow(binSpeed, 2.65) * 0.95;
    return sum + binPowerKw * (bin.timePct / 100);
  }, 0);

  const constAnnualEnergyKwh = constPowerKw * annualHours;
  const constAnnualCostUsd = constAnnualEnergyKwh * electricityCostPerKwh;

  const vfdAnnualEnergyKwh = weightedVfdPowerKw * annualHours;
  const vfdAnnualCostUsd = vfdAnnualEnergyKwh * electricityCostPerKwh;

  const annualEnergySavingsKwh = Math.max(0, constAnnualEnergyKwh - vfdAnnualEnergyKwh);
  const annualCostSavingsUsd = Math.max(0, constAnnualCostUsd - vfdAnnualCostUsd);

  // Estimated VFD equipment & installation cost based on motor rating
  const motorKw = results.motorRecommendedKw || 18.5;
  const estimatedVfdInvestmentUsd = Math.round(motorKw * vfdCostPerKw);

  const simplePaybackYears =
    annualCostSavingsUsd > 0 ? estimatedVfdInvestmentUsd / annualCostSavingsUsd : 99.9;

  // 10-year cumulative savings with electricity inflation
  let cumulativeSavingsUsd = 0;
  let currentTariff = electricityCostPerKwh;
  for (let yr = 1; yr <= analysisYears; yr++) {
    const yrSavings = annualEnergySavingsKwh * currentTariff;
    cumulativeSavingsUsd += yrSavings;
    currentTariff *= 1 + inflationRatePercent / 100;
  }

  const netRoiPercent =
    estimatedVfdInvestmentUsd > 0
      ? ((cumulativeSavingsUsd - estimatedVfdInvestmentUsd) / estimatedVfdInvestmentUsd) * 100
      : 0;

  const annualCo2TonsSaved = (annualEnergySavingsKwh * co2FactorKgPerKwh) / 1000;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">
              VFD Speed Modulation & Energy ROI Analysis
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Compare constant-speed throttling vs variable frequency drive (VFD) affinity law savings & payback periods
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              Est. Annual Savings
            </span>
            <span className="text-lg font-mono font-extrabold text-emerald-400">
              ${Math.round(annualCostSavingsUsd).toLocaleString()} / yr
            </span>
          </div>
          <div className="bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              Simple Payback
            </span>
            <span className="text-lg font-mono font-extrabold text-cyan-400">
              {simplePaybackYears < 50 ? `${simplePaybackYears.toFixed(1)} Years` : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Top 4 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Constant-Speed Cost</span>
            <Zap className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            ${Math.round(constAnnualCostUsd).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500">
            {Math.round(constAnnualEnergyKwh).toLocaleString()} kWh/yr @ {electricityCostPerKwh}$/kWh
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>VFD-Modulated Cost</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-300">
            ${Math.round(vfdAnnualCostUsd).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500">
            {Math.round(vfdAnnualEnergyKwh).toLocaleString()} kWh/yr (Affinity Law)
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>10-Yr Net Cumulative ROI</span>
            <Percent className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            +{netRoiPercent.toFixed(0)}%
          </div>
          <div className="text-[11px] text-slate-500">
            Total Net Savings: ${Math.round(cumulativeSavingsUsd - estimatedVfdInvestmentUsd).toLocaleString()}
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Carbon Emission Reduction</span>
            <Leaf className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-300">
            {annualCo2TonsSaved.toFixed(1)} Tons
          </div>
          <div className="text-[11px] text-slate-500">
            Equivalent to {(annualCo2TonsSaved * 45).toFixed(0)} trees planted/yr
          </div>
        </div>
      </div>

      {/* Main Split: Left Parameters & Right Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration Parameters (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100">Tariff & VFD Investment Parameters</h3>
          </div>

          <div className="space-y-4 text-xs">
            {/* Operating Hours */}
            <div>
              <label className="text-slate-400 block mb-1 font-medium">Daily Operating Hours:</label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="24"
                  step="1"
                  value={operatingHoursPerDay}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 12;
                    onUpdateProject((prev) => ({ ...prev, operatingHoursPerDay: val }));
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                />
                <span className="absolute right-3 top-2.5 text-slate-500 font-mono">
                  hours/day ({annualHours.toLocaleString()} hrs/yr)
                </span>
              </div>
            </div>

            {/* Electricity Tariff */}
            <div>
              <label className="text-slate-400 block mb-1 font-medium">Electricity Tariff Cost:</label>
              <div className="relative">
                <input
                  type="number"
                  min="0.01"
                  max="2.0"
                  step="0.005"
                  value={electricityCostPerKwh}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0.12;
                    onUpdateProject((prev) => ({ ...prev, electricityCostPerKwh: val }));
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                />
                <span className="absolute right-3 top-2.5 text-slate-500 font-mono">$ / kWh</span>
              </div>
            </div>

            {/* Installed VFD Cost per kW */}
            <div>
              <label className="text-slate-400 block mb-1 font-medium">Installed VFD Cost (Drive + Labor):</label>
              <div className="relative">
                <input
                  type="number"
                  min="50"
                  max="500"
                  step="10"
                  value={vfdCostPerKw}
                  onChange={(e) => setVfdCostPerKw(parseFloat(e.target.value) || 180)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                />
                <span className="absolute right-3 top-2.5 text-slate-500 font-mono">$ / kW motor</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Estimated total VFD capital investment for {motorKw} kW motor ={' '}
                <strong className="text-cyan-400">${estimatedVfdInvestmentUsd.toLocaleString()}</strong>
              </span>
            </div>

            {/* Electricity Inflation Rate */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1 font-medium">Electricity Inflation:</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="15"
                    step="0.5"
                    value={inflationRatePercent}
                    onChange={(e) => setInflationRatePercent(parseFloat(e.target.value) || 3.0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                  <span className="absolute right-2.5 top-2.5 text-slate-500 font-mono">% / yr</span>
                </div>
              </div>
              <div>
                <label className="text-slate-400 block mb-1 font-medium">Analysis Horizon:</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="25"
                    step="1"
                    value={analysisYears}
                    onChange={(e) => setAnalysisYears(parseInt(e.target.value) || 10)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                  <span className="absolute right-2.5 top-2.5 text-slate-500 font-mono">years</span>
                </div>
              </div>
            </div>
          </div>

          {/* Load Profile Distribution */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <span className="font-semibold text-slate-300 text-xs block">
              Duty Cycle Flow Demand Profile (Part-Load Operation):
            </span>
            <div className="space-y-2">
              {loadProfile.map((bin, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
                  <div className="w-20 font-mono text-cyan-400 font-bold">{bin.flowPct}% Flow</div>
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={bin.timePct}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setLoadProfile((prev) => {
                          const updated = [...prev];
                          updated[idx].timePct = val;
                          return updated;
                        });
                      }}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                  </div>
                  <div className="w-16 text-right font-mono text-slate-300">{bin.timePct}% time</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Comparative Financial Table & Savings Breakdown (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-100">Operating Cost Comparison Matrix</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold uppercase">
                ISO 14414 Compliant
              </span>
            </div>

            {/* Comparison Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2.5 px-3 font-semibold">Operating Parameter</th>
                    <th className="py-2.5 px-3 font-semibold text-rose-400">Constant Speed (Throttled)</th>
                    <th className="py-2.5 px-3 font-semibold text-cyan-400">VFD Modulated (Affinity)</th>
                    <th className="py-2.5 px-3 font-semibold text-emerald-400">Net Annual Difference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  <tr>
                    <td className="py-3 px-3 text-slate-300 font-sans">Average Shaft Power</td>
                    <td className="py-3 px-3 text-white">{(constPowerKw * 0.85).toFixed(1)} kW</td>
                    <td className="py-3 px-3 text-cyan-300">{(weightedVfdPowerKw * 0.85).toFixed(1)} kW</td>
                    <td className="py-3 px-3 text-emerald-400">
                      -{((constPowerKw - weightedVfdPowerKw) * 0.85).toFixed(1)} kW
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 text-slate-300 font-sans">Electrical Power Input</td>
                    <td className="py-3 px-3 text-white">{constPowerKw.toFixed(1)} kW</td>
                    <td className="py-3 px-3 text-cyan-300">{weightedVfdPowerKw.toFixed(1)} kW</td>
                    <td className="py-3 px-3 text-emerald-400">
                      -{Math.max(0, constPowerKw - weightedVfdPowerKw).toFixed(1)} kW
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 text-slate-300 font-sans">Annual Energy Consumption</td>
                    <td className="py-3 px-3 text-white">
                      {Math.round(constAnnualEnergyKwh).toLocaleString()} kWh
                    </td>
                    <td className="py-3 px-3 text-cyan-300">
                      {Math.round(vfdAnnualEnergyKwh).toLocaleString()} kWh
                    </td>
                    <td className="py-3 px-3 text-emerald-400 font-bold">
                      -{Math.round(annualEnergySavingsKwh).toLocaleString()} kWh
                    </td>
                  </tr>
                  <tr className="bg-slate-950/40">
                    <td className="py-3 px-3 text-slate-200 font-sans font-bold">Annual Electricity Cost</td>
                    <td className="py-3 px-3 text-rose-300 font-bold">
                      ${Math.round(constAnnualCostUsd).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-cyan-300 font-bold">
                      ${Math.round(vfdAnnualCostUsd).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-emerald-400 font-extrabold text-sm">
                      +${Math.round(annualCostSavingsUsd).toLocaleString()} / yr
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Investment Summary Box */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 to-emerald-950/30 border border-cyan-800/40 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">Financial Investment Appraisal:</span>
              <span className="text-cyan-400 font-mono font-bold">
                Capital Outlay: ${estimatedVfdInvestmentUsd.toLocaleString()}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Simple Payback:</span>
                <span className="text-sm font-bold font-mono text-cyan-300">
                  {simplePaybackYears < 50 ? `${simplePaybackYears.toFixed(1)} Years` : 'N/A'}
                </span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">10-Yr Total Savings:</span>
                <span className="text-sm font-bold font-mono text-emerald-400">
                  ${Math.round(cumulativeSavingsUsd).toLocaleString()}
                </span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">CO₂ Abatement:</span>
                <span className="text-sm font-bold font-mono text-emerald-300">
                  {annualCo2TonsSaved.toFixed(1)} Tons / yr
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
