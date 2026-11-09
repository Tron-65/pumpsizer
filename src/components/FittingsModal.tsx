import React, { useState } from 'react';
import { FittingItem, PipeSegment } from '../types/hydraulics';
import { FITTING_CATALOG } from '../data/defaultCatalog';
import { X, Plus, Trash2, PlusCircle, MinusCircle, Layers } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  segmentTitle: string;
  fittings: FittingItem[];
  onUpdateFittings: (fittings: FittingItem[]) => void;
}

export const FittingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  segmentTitle,
  fittings,
  onUpdateFittings,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customName, setCustomName] = useState('');
  const [customK, setCustomK] = useState('0.50');

  if (!isOpen) return null;

  const totalK = fittings.reduce((sum, item) => sum + item.kFactor * item.count, 0);

  const handleAddPreset = (catalogItem: (typeof FITTING_CATALOG)[0]) => {
    const existingIndex = fittings.findIndex((f) => f.type === catalogItem.type);
    if (existingIndex >= 0) {
      const updated = [...fittings];
      updated[existingIndex].count += 1;
      onUpdateFittings(updated);
    } else {
      onUpdateFittings([
        ...fittings,
        {
          id: `fit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          type: catalogItem.type,
          name: catalogItem.name,
          kFactor: catalogItem.kFactor,
          count: 1,
          category: catalogItem.category,
        },
      ]);
    }
  };

  const handleUpdateCount = (id: string, delta: number) => {
    const updated = fittings
      .map((item) => {
        if (item.id === id) {
          const newCount = Math.max(0, item.count + delta);
          return { ...item, count: newCount };
        }
        return item;
      })
      .filter((item) => item.count > 0);
    onUpdateFittings(updated);
  };

  const handleRemove = (id: string) => {
    onUpdateFittings(fittings.filter((item) => item.id !== id));
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const k = parseFloat(customK);
    if (!customName.trim() || isNaN(k) || k <= 0) return;
    onUpdateFittings([
      ...fittings,
      {
        id: `custom_${Date.now()}`,
        type: 'custom',
        name: customName.trim(),
        kFactor: k,
        count: 1,
        category: 'other',
      },
    ]);
    setCustomName('');
    setCustomK('0.50');
  };

  const categories = [
    { id: 'all', label: 'All Fittings' },
    { id: 'valve', label: 'Valves' },
    { id: 'elbow', label: 'Elbows & Bends' },
    { id: 'tee', label: 'Tees' },
    { id: 'entrance_exit', label: 'Entrance & Exit' },
    { id: 'reducer', label: 'Reducers' },
  ];

  const filteredCatalog =
    selectedCategory === 'all'
      ? FITTING_CATALOG
      : FITTING_CATALOG.filter((item) => item.category === selectedCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">
              Fitting & Valve Minor Losses (K-Factors)
            </h3>
            <p className="text-xs text-slate-400">
              Configure components for: <span className="text-cyan-400 font-semibold">{segmentTitle}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content split into two columns: Catalog and Active Fittings */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-800">
          {/* Left Column: Preset Catalog (7 cols) */}
          <div className="md:col-span-7 p-4 flex flex-col overflow-hidden">
            {/* Category tabs */}
            <div className="flex flex-wrap gap-1 mb-3">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition ${
                    selectedCategory === c.id
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Catalog Grid */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {filteredCatalog.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-cyan-500/40 transition group"
                >
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="text-xs font-medium text-slate-200 truncate group-hover:text-cyan-300 transition">
                      {item.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                        {item.category}
                      </span>
                      <span className="text-[11px] font-mono font-semibold text-cyan-400">
                        K = {item.kFactor.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddPreset(item)}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/30 transition flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Custom Fitting Form */}
            <form onSubmit={handleAddCustom} className="mt-3 pt-3 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                placeholder="Custom fitting / equipment (e.g. Flow meter)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="flex-1 text-xs bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
              <input
                type="number"
                step="0.05"
                min="0.01"
                placeholder="K-factor"
                value={customK}
                onChange={(e) => setCustomK(e.target.value)}
                className="w-20 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              >
                Add Custom
              </button>
            </form>
          </div>

          {/* Right Column: Currently Selected Fittings (5 cols) */}
          <div className="md:col-span-5 p-4 flex flex-col bg-slate-900/60 overflow-hidden">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-200">
                Selected Components ({fittings.length})
              </span>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400">Total ΣK:</span>
                <span className="font-mono font-bold text-cyan-400 text-sm">
                  {totalK.toFixed(2)}
                </span>
              </div>
            </div>

            {fittings.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <Layers className="w-10 h-10 mb-2 stroke-1 text-slate-600" />
                <p className="text-xs font-medium text-slate-400">No fittings added</p>
                <p className="text-[11px] text-slate-600 mt-1">
                  Click "+ Add" on any fitting from the catalog to calculate minor losses.
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {fittings.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-200 truncate">{item.name}</p>
                      <p className="text-[11px] font-mono text-cyan-400 mt-0.5">
                        K = {item.kFactor.toFixed(2)} × {item.count} ={' '}
                        <span className="font-bold text-white">
                          {(item.kFactor * item.count).toFixed(2)}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleUpdateCount(item.id, -1)}
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                      >
                        <MinusCircle className="w-4 h-4" />
                      </button>
                      <span className="w-6 text-center font-mono text-xs font-bold text-slate-200">
                        {item.count}
                      </span>
                      <button
                        onClick={() => handleUpdateCount(item.id, 1)}
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                      >
                        <PlusCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 ml-1 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-3 border-t border-slate-800 mt-3 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-sm"
              >
                Done / Save Fittings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
