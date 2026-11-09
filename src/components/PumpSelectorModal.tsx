import React, { useState } from 'react';
import { PumpModel, ProjectData } from '../types/hydraulics';
import { PUMP_CATALOG } from '../data/defaultCatalog';
import { UNIT_LABELS, flowToDisplay, headToDisplay, powerToDisplay } from '../utils/units';
import { X, Check, Plus, Wrench, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectData;
  onSelectPump: (pumpId: string) => void;
  onSaveCustomPump: (pump: PumpModel) => void;
}

export const PumpSelectorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  project,
  onSelectPump,
  onSaveCustomPump,
}) => {
  const { unitSystem } = project;
  const labels = UNIT_LABELS[unitSystem];

  const [activeTab, setActiveTab] = useState<'catalog' | 'custom'>('catalog');

  // Custom pump builder state
  const [modelName, setModelName] = useState('Custom Centrifugal 150-315');
  const [manufacturer, setManufacturer] = useState('Custom Manufacturer');
  const [bepFlow, setBepFlow] = useState('100');
  const [bepHead, setBepHead] = useState('50');
  const [shutoffHead, setShutoffHead] = useState('65');
  const [bepEff, setBepEff] = useState('78');
  const [maxFlow, setMaxFlow] = useState('150');
  const [rpm, setRpm] = useState('2950');
  const [motorKw, setMotorKw] = useState('30');

  if (!isOpen) return null;

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const qBep = parseFloat(bepFlow) || 100;
    const hBep = parseFloat(bepHead) || 50;
    const h0 = parseFloat(shutoffHead) || 65;
    const qMax = parseFloat(maxFlow) || 150;
    const eff = parseFloat(bepEff) || 75;

    // Fit quadratic curve passing through (0, h0) and (qBep, hBep) with smooth slope
    // H(Q) = h0 + a1*Q + a2*Q^2
    // Let's set a1 = 0 (flat at shutoff) or slight negative slope:
    // a2 = (hBep - h0) / (qBep^2)
    const a2 = (hBep - h0) / Math.pow(qBep, 2);
    const a0 = h0;
    const a1 = 0;

    const newPump: PumpModel = {
      id: `custom_pump_${Date.now()}`,
      manufacturer: manufacturer.trim() || 'Custom',
      model: modelName.trim() || 'Custom Pump',
      type: 'centrifugal_end_suction',
      rpm: parseInt(rpm) || 2950,
      impellerDiameterMm: 250,
      bepFlow: qBep,
      bepHead: hBep,
      bepEfficiency: eff,
      shutoffHead: h0,
      maxFlow: qMax,
      motorRatingKw: parseFloat(motorKw) || 30,
      a0,
      a1,
      a2,
      curvePoints: [
        { flow: 0, head: h0, efficiency: 0, npshr: 2.0 },
        { flow: qBep * 0.5, head: h0 + a2 * Math.pow(qBep * 0.5, 2), efficiency: eff * 0.8, npshr: 2.5 },
        { flow: qBep, head: hBep, efficiency: eff, npshr: 3.5 },
        { flow: qMax, head: Math.max(10, h0 + a2 * Math.pow(qMax, 2)), efficiency: eff * 0.7, npshr: 5.5 },
      ],
    };

    onSaveCustomPump(newPump);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">Pump Model & Performance Curves</h3>
            <p className="text-xs text-slate-400">
              Select an industrial pump or specify custom curve polynomial parameters
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-4 pt-3 flex gap-2 border-b border-slate-800 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition ${
              activeTab === 'catalog'
                ? 'border-cyan-400 text-cyan-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Standard Pump Catalog ({PUMP_CATALOG.length})
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'custom'
                ? 'border-cyan-400 text-cyan-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Custom Pump Curve Builder</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === 'catalog' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PUMP_CATALOG.map((p) => {
                const isSelected = project.selectedPumpId === p.id && !project.customPump;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      onSelectPump(p.id);
                      onClose();
                    }}
                    className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-cyan-950/30 border-cyan-500 shadow-md ring-1 ring-cyan-500/50'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                            {p.manufacturer}
                          </span>
                          <h4 className="text-sm font-semibold text-slate-100 mt-1">{p.model}</h4>
                        </div>
                        {isSelected && (
                          <span className="p-1 rounded-full bg-cyan-500 text-slate-950 shrink-0">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 py-2.5 my-2 border-y border-slate-800/80 text-[11px]">
                        <div>
                          <span className="text-slate-500 block">BEP Flow:</span>
                          <span className="font-mono font-bold text-slate-200">
                            {flowToDisplay(p.bepFlow, unitSystem).toFixed(1)} {labels.flow}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">BEP Head:</span>
                          <span className="font-mono font-bold text-slate-200">
                            {headToDisplay(p.bepHead, unitSystem).toFixed(1)} {labels.head}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Max Eff:</span>
                          <span className="font-mono font-bold text-emerald-400">
                            {p.bepEfficiency}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>Rated: {p.rpm} RPM</span>
                      <span>Motor: {powerToDisplay(p.motorRatingKw, unitSystem).toFixed(0)} {labels.power}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Custom Pump Form */
            <form onSubmit={handleCreateCustom} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 mb-1 block">Model Designation:</label>
                  <input
                    type="text"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                    placeholder="e.g. Acme Flow 80-200"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 mb-1 block">Manufacturer / OEM:</label>
                  <input
                    type="text"
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                    placeholder="e.g. Flowserve / Sulzer / Goulds"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <label className="text-slate-400 mb-1 block">Shutoff Head (Q=0):</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="any"
                      value={shutoffHead}
                      onChange={(e) => setShutoffHead(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                      required
                    />
                    <span className="text-[10px] text-slate-500 font-mono">{labels.head}</span>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 mb-1 block">BEP Flow Rate:</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="any"
                      value={bepFlow}
                      onChange={(e) => setBepFlow(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                      required
                    />
                    <span className="text-[10px] text-slate-500 font-mono">{labels.flow}</span>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 mb-1 block">BEP Head:</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="any"
                      value={bepHead}
                      onChange={(e) => setBepHead(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                      required
                    />
                    <span className="text-[10px] text-slate-500 font-mono">{labels.head}</span>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 mb-1 block">BEP Peak Efficiency:</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="any"
                      min="10"
                      max="95"
                      value={bepEff}
                      onChange={(e) => setBepEff(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                      required
                    />
                    <span className="text-[10px] text-slate-500 font-mono">%</span>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 mb-1 block">Max Runout Flow:</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="any"
                      value={maxFlow}
                      onChange={(e) => setMaxFlow(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                      required
                    />
                    <span className="text-[10px] text-slate-500 font-mono">{labels.flow}</span>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 mb-1 block">Synchronous RPM:</label>
                  <input
                    type="number"
                    value={rpm}
                    onChange={(e) => setRpm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('catalog')}
                  className="px-4 py-2 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-sm flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Save & Apply Custom Pump
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
