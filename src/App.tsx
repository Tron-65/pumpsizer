/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { ProjectData, UnitSystem, PumpModel } from './types/hydraulics';
import { PROJECT_TEMPLATES, PUMP_CATALOG } from './data/defaultCatalog';
import { runHydraulicCalculations } from './utils/engineering';
import { Navbar } from './components/Navbar';
import { ResultsSummary } from './components/ResultsSummary';
import { PumpCurveChart } from './components/PumpCurveChart';
import { HGLProfileChart } from './components/HGLProfileChart';
import { PipeRunConfig } from './components/PipeRunConfig';
import { FluidAndSiteConfig } from './components/FluidAndSiteConfig';
import { PumpSelectorModal } from './components/PumpSelectorModal';
import { PdfReportModal } from './components/PdfReportModal';
import { ProjectManagerModal } from './components/ProjectManagerModal';
import { CloudCollaborationModal } from './components/CloudCollaborationModal';
import { BoreholeSizingModal } from './components/BoreholeSizingModal';
import { UNIT_LABELS, flowToDisplay, headToDisplay, powerToDisplay } from './utils/units';
import {
  Activity,
  Calculator,
  ListFilter,
  FileSpreadsheet,
  Settings,
  HelpCircle,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Droplets,
} from 'lucide-react';

const STORAGE_KEY_CURRENT = 'hydroflow_current_project';
const STORAGE_KEY_SAVED = 'hydroflow_saved_projects';
const STORAGE_KEY_THEME = 'hydroflow_theme';

export default function App() {
  // Theme state: dark | light
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_THEME);
      if (stored === 'light' || stored === 'dark') return stored;
    } catch (e) {
      console.error(e);
    }
    return 'dark';
  });

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      localStorage.setItem(STORAGE_KEY_THEME, nextTheme);
    } catch (e) {
      console.error(e);
    }
  };

  // Load saved projects or fallback to initial template
  const [savedProjects, setSavedProjects] = useState<ProjectData[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SAVED);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return [
      PROJECT_TEMPLATES.booster_station,
      PROJECT_TEMPLATES.borehole_well,
      PROJECT_TEMPLATES.chilled_water,
      PROJECT_TEMPLATES.wastewater_lift,
    ];
  });

  const [project, setProject] = useState<ProjectData>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CURRENT);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return PROJECT_TEMPLATES.booster_station;
  });

  // Active view tab
  const [activeTab, setActiveTab] = useState<'sizing' | 'hgl' | 'formulas' | 'bom'>('sizing');

  // Modals state
  const [isPumpModalOpen, setIsPumpModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);
  const [isCollabOpen, setIsCollabOpen] = useState(false);
  const [isBoreholeModalOpen, setIsBoreholeModalOpen] = useState(false);

  // Auto-save to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(project));
      // Also update in saved projects list if ID matches
      setSavedProjects((prev) => {
        const index = prev.findIndex((p) => p.id === project.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = project;
          localStorage.setItem(STORAGE_KEY_SAVED, JSON.stringify(updated));
          return updated;
        }
        return prev;
      });
    } catch (e) {
      console.error(e);
    }
  }, [project]);

  // Master real-time hydraulic calculation run
  const results = useMemo(() => {
    return runHydraulicCalculations(project);
  }, [project]);

  // Project management handlers
  const handleLoadProject = (proj: ProjectData) => {
    setProject(proj);
  };

  const handleSaveProject = (proj: ProjectData) => {
    setSavedProjects((prev) => {
      const filtered = prev.filter((p) => p.id !== proj.id);
      const updated = [proj, ...filtered];
      localStorage.setItem(STORAGE_KEY_SAVED, JSON.stringify(updated));
      return updated;
    });
    setProject(proj);
  };

  const handleDeleteProject = (projectId: string) => {
    setSavedProjects((prev) => {
      const updated = prev.filter((p) => p.id !== projectId);
      localStorage.setItem(STORAGE_KEY_SAVED, JSON.stringify(updated));
      return updated;
    });
  };

  const handleLoadTemplate = (templateKey: string) => {
    const tmpl = PROJECT_TEMPLATES[templateKey];
    if (tmpl) {
      const freshProject: ProjectData = {
        ...tmpl,
        id: `proj_${Date.now()}`,
        name: `${tmpl.name}`,
        date: new Date().toISOString().split('T')[0],
      };
      handleSaveProject(freshProject);
    }
  };

  const handleApplyBoreholePump = (sizedPump: PumpModel, targetQ: number, targetH: number) => {
    setProject((prev) => ({
      ...prev,
      name: prev.name.includes('Borehole') ? prev.name : `Borehole Well - ${sizedPump.model}`,
      selectedPumpId: sizedPump.id,
      customPump: sizedPump,
      designFlowM3h: targetQ,
      suction: {
        ...prev.suction,
        name: 'Submerged Well Intake Screen',
        staticElevationM: 6.0, // Submerged flooded suction below dynamic water level
        lengthM: 2.0,
      },
      discharge: {
        ...prev.discharge,
        staticElevationM: Math.max(10, Math.round(targetH * 0.75)),
      },
      vfdSpeedRatio: 1.0,
      pumpConfiguration: 'single',
    }));
    setActiveTab('sizing');
  };

  const labels = UNIT_LABELS[project.unitSystem];

  return (
    <div
      className={`min-h-screen ${
        theme === 'light' ? 'theme-light' : 'bg-slate-950 text-slate-100'
      } flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200 transition-colors duration-200`}
    >
      {/* Top Navbar */}
      <Navbar
        project={project}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onUpdateUnitSystem={(system) => setProject((prev) => ({ ...prev, unitSystem: system }))}
        onOpenProjectManager={() => setIsProjectManagerOpen(true)}
        onOpenPdfReport={() => setIsPdfModalOpen(true)}
        onOpenCollaboration={() => setIsCollabOpen(true)}
        onOpenBoreholeSizing={() => setIsBoreholeModalOpen(true)}
        onQuickLoadTemplate={handleLoadTemplate}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            {[
              { id: 'sizing', label: 'Pump Sizing & Curves', icon: Activity },
              { id: 'hgl', label: 'Hydraulic Grade Line (HGL)', icon: Calculator },
              { id: 'formulas', label: 'Engineering Calculations & Proofs', icon: Zap },
              { id: 'bom', label: 'Fittings & Material Schedule', icon: FileSpreadsheet },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition flex items-center gap-2 ${
                    isActive
                      ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick template pill shortcuts */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Quick Preset:</span>
            <button
              onClick={() => setIsBoreholeModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-500/20 to-sky-500/20 hover:from-cyan-500/30 hover:to-sky-500/30 border border-cyan-500/40 text-cyan-200 text-[11px] font-semibold transition flex items-center gap-1.5 shadow-sm"
              title="Launch Borehole CAD Simulator (99m well, PVC DN100 riser, +40m lift, PEHD DN200, 15 L/s)"
            >
              <Droplets className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Well CAD Simulator (15 L/s)</span>
            </button>
            <button
              onClick={() => handleLoadTemplate('booster_station')}
              className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] transition"
            >
              Water Booster
            </button>
            <button
              onClick={() => handleLoadTemplate('borehole_well')}
              className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] transition"
              title="Load 99m Well, 40m Lift, 15 L/s Scenario"
            >
              Deep Well (99m)
            </button>
            <button
              onClick={() => handleLoadTemplate('chilled_water')}
              className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] transition"
            >
              Chilled Glycol
            </button>
            <button
              onClick={() => handleLoadTemplate('wastewater_lift')}
              className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] transition"
            >
              Wastewater
            </button>
          </div>
        </div>

        {/* Tab 1: PUMP SIZING & CURVES */}
        {activeTab === 'sizing' && (
          <div className="space-y-6">
            {/* Top Results Summary Cards & Validation Alerts */}
            <ResultsSummary project={project} results={results} />

            {/* Interactive Pump Curve & Operating Point Solver */}
            <PumpCurveChart
              project={project}
              results={results}
              onUpdateVfd={(vfd) => setProject((prev) => ({ ...prev, vfdSpeedRatio: vfd }))}
              onUpdateConfig={(config) =>
                setProject((prev) => ({ ...prev, pumpConfiguration: config }))
              }
              onSelectPump={(pumpId) =>
                setProject((prev) => ({ ...prev, selectedPumpId: pumpId, customPump: undefined }))
              }
              onOpenPumpSelector={() => setIsPumpModalOpen(true)}
            />

            {/* Fluid & Site Ambient Configuration */}
            <FluidAndSiteConfig project={project} onUpdateProject={setProject} />

            {/* Suction & Discharge Pipeline Run Inputs with Real-time Velocity Meters */}
            <PipeRunConfig project={project} results={results} onUpdateProject={setProject} />
          </div>
        )}

        {/* Tab 2: HYDRAULIC & ENERGY GRADE LINE (HGL / EGL) */}
        {activeTab === 'hgl' && (
          <div className="space-y-6">
            <HGLProfileChart project={project} results={results} />
            <ResultsSummary project={project} results={results} />
            <PipeRunConfig project={project} results={results} onUpdateProject={setProject} />
          </div>
        )}

        {/* Tab 3: DETAILED FORMULAS & CALCULATION PROOFS */}
        {activeTab === 'formulas' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-100">
                    Step-by-Step Engineering Equations & Verification Proof
                  </h3>
                  <p className="text-xs text-slate-400">
                    Detailed breakdown of mathematical models replacing legacy Excel spreadsheets
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Friction Loss Equation */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="font-semibold text-cyan-400 text-sm">
                    1. Darcy-Weisbach & Colebrook-White Friction
                  </h4>
                  <p className="text-slate-400 leading-relaxed">
                    Pipe friction head loss is calculated using the rigorous Darcy-Weisbach formula:
                  </p>
                  <div className="p-2.5 bg-slate-900 rounded-lg font-mono text-cyan-300 text-center my-2">
                    h_f = f · (L / D) · (V² / 2g)
                  </div>
                  <p className="text-slate-400">
                    The Darcy friction factor <span className="font-mono text-slate-200">f</span> is
                    solved iteratively via the implicit Colebrook-White equation for turbulent flow:
                  </p>
                  <div className="p-2.5 bg-slate-900 rounded-lg font-mono text-cyan-300 text-center my-2 text-[11px]">
                    1 / √f = -2 · log₁₀( (ε / 3.7D) + (2.51 / (Re · √f)) )
                  </div>
                  <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800 space-y-0.5">
                    <div>
                      • Suction: Re = {results.suctionReynolds.toLocaleString()} → f ={' '}
                      {results.suctionFrictionFactor}
                    </div>
                    <div>
                      • Discharge: Re = {results.dischargeReynolds.toLocaleString()} → f ={' '}
                      {results.dischargeFrictionFactor}
                    </div>
                  </div>
                </div>

                {/* Total Dynamic Head Equation */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="font-semibold text-cyan-400 text-sm">
                    2. Total Dynamic Head (TDH) Formulation
                  </h4>
                  <p className="text-slate-400 leading-relaxed">
                    TDH represents the total equivalent energy head the pump must impart onto the fluid:
                  </p>
                  <div className="p-2.5 bg-slate-900 rounded-lg font-mono text-cyan-300 text-center my-2">
                    TDH = (Z_d - Z_s) + (P_d - P_s)/ρg + Σh_L,s + Σh_L,d + (V_d² - V_s²)/2g
                  </div>
                  <div className="space-y-1 text-slate-300 text-[11px] pt-1 border-t border-slate-800 font-mono">
                    <div className="flex justify-between">
                      <span>Static Lift (Z_d - Z_s):</span>
                      <span>{results.staticHeadM.toFixed(2)} m</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pressure Head Diff:</span>
                      <span>{results.pressureHeadM.toFixed(2)} m</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Suction Losses (hf + hm):</span>
                      <span>{results.suctionTotalLossM.toFixed(2)} m</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Discharge Losses (hf + hm):</span>
                      <span>{results.dischargeTotalLossM.toFixed(2)} m</span>
                    </div>
                    <div className="flex justify-between font-bold text-cyan-400 pt-1 border-t border-slate-800">
                      <span>Total Dynamic Head (TDH):</span>
                      <span>{results.totalDynamicHeadM.toFixed(2)} m</span>
                    </div>
                  </div>
                </div>

                {/* NPSH Analysis Equation */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="font-semibold text-cyan-400 text-sm">
                    3. Net Positive Suction Head (NPSHa vs NPSHr)
                  </h4>
                  <p className="text-slate-400 leading-relaxed">
                    NPSH Available at the pump suction nozzle to prevent vapor cavitation:
                  </p>
                  <div className="p-2.5 bg-slate-900 rounded-lg font-mono text-cyan-300 text-center my-2 text-[11px]">
                    NPSHa = (P_atm + P_suct,gauge - P_vapor) / (ρg) + Z_s - h_L,s
                  </div>
                  <div className="space-y-1 text-slate-300 text-[11px] pt-1 border-t border-slate-800 font-mono">
                    <div className="flex justify-between">
                      <span>P_atm (at {project.altitudeM}m):</span>
                      <span>{results.atmosphericPressureKPa.toFixed(1)} kPa</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Vapor Pressure (at {project.fluid.temperatureC}°C):</span>
                      <span>{project.fluid.vaporPressureKPa.toFixed(2)} kPa</span>
                    </div>
                    <div className="flex justify-between">
                      <span>NPSH Available (NPSHa):</span>
                      <span className="text-emerald-400 font-bold">{results.npshAvailableM.toFixed(2)} m</span>
                    </div>
                    <div className="flex justify-between">
                      <span>NPSH Required (NPSHr):</span>
                      <span>{results.npshRequiredM.toFixed(2)} m</span>
                    </div>
                    <div className="flex justify-between font-bold text-cyan-400 pt-1 border-t border-slate-800">
                      <span>Safety Margin:</span>
                      <span className={results.isCavitationRisk ? 'text-amber-400' : 'text-emerald-400'}>
                        +{results.npshMarginM.toFixed(2)} m
                      </span>
                    </div>
                  </div>
                </div>

                {/* Power & Motor Sizing Equation */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="font-semibold text-cyan-400 text-sm">
                    4. Hydraulic & Shaft Power Calculations
                  </h4>
                  <p className="text-slate-400 leading-relaxed">
                    Hydraulic fluid power and brake shaft power sizing:
                  </p>
                  <div className="p-2.5 bg-slate-900 rounded-lg font-mono text-cyan-300 text-center my-2">
                    P_hyd = (ρ · g · Q · TDH) / 1000 &nbsp;|&nbsp; P_shaft = P_hyd / η_pump
                  </div>
                  <div className="space-y-1 text-slate-300 text-[11px] pt-1 border-t border-slate-800 font-mono">
                    <div className="flex justify-between">
                      <span>Hydraulic Fluid Power:</span>
                      <span>{results.hydraulicPowerKw.toFixed(2)} kW</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pump Efficiency (η):</span>
                      <span>{results.operatingPoint?.efficiency || results.pumpEfficiencyAtDuty}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Brake Shaft Power (BHP):</span>
                      <span className="text-amber-400 font-bold">{results.shaftBrakePowerKw.toFixed(2)} kW</span>
                    </div>
                    <div className="flex justify-between font-bold text-cyan-400 pt-1 border-t border-slate-800">
                      <span>Recommended Motor:</span>
                      <span>{results.motorRecommendedKw} kW ({results.motorRecommendedKw * 1.341} HP)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: BILL OF MATERIALS & FITTINGS SCHEDULE */}
        {activeTab === 'bom' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-100">
                      Bill of Materials & Minor Losses Schedule
                    </h3>
                    <p className="text-xs text-slate-400">
                      Exportable bill of pipe segments, valves, elbows, and fittings with individual K-factors
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsPdfModalOpen(true)}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-sm"
                >
                  Export to Client PDF Report
                </button>
              </div>

              {/* Suction Line Fittings Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                  Suction Run Components ({project.suction.fittings.length} Items)
                </h4>
                <div className="overflow-x-auto rounded-lg border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-2.5">Component / Description</th>
                        <th className="p-2.5">Category</th>
                        <th className="p-2.5 text-right">Unit K-Factor</th>
                        <th className="p-2.5 text-center">Quantity</th>
                        <th className="p-2.5 text-right">Subtotal ΣK</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono">
                      {project.suction.fittings.map((f) => (
                        <tr key={f.id} className="hover:bg-slate-800/40">
                          <td className="p-2.5 font-sans font-medium text-slate-200">{f.name}</td>
                          <td className="p-2.5 uppercase text-[10px] text-slate-500">{f.category}</td>
                          <td className="p-2.5 text-right text-slate-300">{f.kFactor.toFixed(2)}</td>
                          <td className="p-2.5 text-center text-cyan-400 font-bold">{f.count}</td>
                          <td className="p-2.5 text-right font-bold text-white">
                            {(f.kFactor * f.count).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Discharge Line Fittings Table */}
              <div className="space-y-2 pt-3">
                <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                  Discharge Run Components ({project.discharge.fittings.length} Items)
                </h4>
                <div className="overflow-x-auto rounded-lg border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-2.5">Component / Description</th>
                        <th className="p-2.5">Category</th>
                        <th className="p-2.5 text-right">Unit K-Factor</th>
                        <th className="p-2.5 text-center">Quantity</th>
                        <th className="p-2.5 text-right">Subtotal ΣK</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono">
                      {project.discharge.fittings.map((f) => (
                        <tr key={f.id} className="hover:bg-slate-800/40">
                          <td className="p-2.5 font-sans font-medium text-slate-200">{f.name}</td>
                          <td className="p-2.5 uppercase text-[10px] text-slate-500">{f.category}</td>
                          <td className="p-2.5 text-right text-slate-300">{f.kFactor.toFixed(2)}</td>
                          <td className="p-2.5 text-center text-cyan-400 font-bold">{f.count}</td>
                          <td className="p-2.5 text-right font-bold text-white">
                            {(f.kFactor * f.count).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500 bg-slate-950">
        <p>
          HydroFlow Hydraulic Engineering Suite • Total Dynamic Head, NPSH, Pipe Friction & Pump
          Sizing
        </p>
      </footer>

      {/* Modals */}
      <PumpSelectorModal
        isOpen={isPumpModalOpen}
        onClose={() => setIsPumpModalOpen(false)}
        project={project}
        onSelectPump={(pumpId) =>
          setProject((prev) => ({ ...prev, selectedPumpId: pumpId, customPump: undefined }))
        }
        onSaveCustomPump={(customPump) =>
          setProject((prev) => ({ ...prev, customPump, selectedPumpId: customPump.id }))
        }
      />

      <PdfReportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        project={project}
        results={results}
      />

      <ProjectManagerModal
        isOpen={isProjectManagerOpen}
        onClose={() => setIsProjectManagerOpen(false)}
        currentProject={project}
        savedProjects={savedProjects}
        onLoadProject={handleLoadProject}
        onSaveProject={handleSaveProject}
        onDeleteProject={handleDeleteProject}
        onLoadTemplate={handleLoadTemplate}
      />

      <CloudCollaborationModal
        isOpen={isCollabOpen}
        onClose={() => setIsCollabOpen(false)}
        project={project}
      />

      <BoreholeSizingModal
        isOpen={isBoreholeModalOpen}
        onClose={() => setIsBoreholeModalOpen(false)}
        project={project}
        onApplyBoreholePump={handleApplyBoreholePump}
      />
    </div>
  );
}
