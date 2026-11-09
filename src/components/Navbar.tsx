import React from 'react';
import { ProjectData, UnitSystem } from '../types/hydraulics';
import {
  Waves,
  FolderOpen,
  FileText,
  Share2,
  Cloud,
  Check,
  ChevronDown,
  Sparkles,
  SlidersHorizontal,
  Bookmark,
  Sun,
  Moon,
  Droplets,
} from 'lucide-react';

interface Props {
  project: ProjectData;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onUpdateUnitSystem: (system: UnitSystem) => void;
  onOpenProjectManager: () => void;
  onOpenPdfReport: () => void;
  onOpenCollaboration: () => void;
  onOpenBoreholeSizing: () => void;
  onQuickLoadTemplate: (templateKey: string) => void;
}

export const Navbar: React.FC<Props> = ({
  project,
  theme,
  onToggleTheme,
  onUpdateUnitSystem,
  onOpenProjectManager,
  onOpenPdfReport,
  onOpenCollaboration,
  onOpenBoreholeSizing,
  onQuickLoadTemplate,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md bg-slate-900/90 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <Waves className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-white">
                Hydro<span className="text-cyan-400">Flow</span>
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.2 rounded font-mono text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/60 uppercase">
                v2.6 Pro
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Pump Sizing & Hydraulic Calculations
            </p>
          </div>
        </div>

        {/* Project Title & Quick Switcher */}
        <div className="flex items-center gap-2 max-w-sm truncate">
          <button
            onClick={onOpenProjectManager}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition group max-w-xs"
          >
            <FolderOpen className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="truncate">
              <span className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition block truncate">
                {project.name}
              </span>
              <span className="text-[10px] font-mono text-slate-500 block">
                {project.projectNumber || 'Active Project'} • {project.revision || 'Rev 01'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 shrink-0 ml-1" />
          </button>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-2.5">
          {/* Unit Toggle */}
          <div className="inline-flex rounded-xl border border-slate-800 p-0.5 bg-slate-950">
            <button
              onClick={() => onUpdateUnitSystem('metric')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition ${
                project.unitSystem === 'metric'
                  ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Metric Units (m³/h, meters head, bar, mm, kW)"
            >
              Metric (SI)
            </button>
            <button
              onClick={() => onUpdateUnitSystem('imperial')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition ${
                project.unitSystem === 'imperial'
                  ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="US Customary Units (GPM, ft head, psi, inches, HP)"
            >
              US (GPM/ft)
            </button>
          </div>

          {/* Borehole Submersible Sizing Wizard button */}
          <button
            onClick={onOpenBoreholeSizing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition shadow-sm"
            title="Size a deep-well submersible borehole pump (Know Q & H)"
          >
            <Droplets className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Borehole Pump (Q & H)</span>
            <span className="sm:hidden">Borehole</span>
          </button>

          {/* Light / Dark Theme Switcher */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition flex items-center justify-center shadow-sm"
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-cyan-600" />
            )}
          </button>

          {/* Cloud Collaboration button */}
          <button
            onClick={onOpenCollaboration}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <Cloud className="w-3.5 h-3.5 text-cyan-400" />
            <span>Cloud Sync</span>
          </button>

          {/* Export Client PDF Report button */}
          <button
            onClick={onOpenPdfReport}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-cyan-600 to-sky-500 hover:from-cyan-500 hover:to-sky-400 text-white shadow-md shadow-cyan-600/20 transition"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Client PDF</span>
            <span className="sm:hidden">PDF</span>
          </button>
        </div>
      </div>
    </header>
  );
};
