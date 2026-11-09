import React, { useState } from 'react';
import { ProjectData } from '../types/hydraulics';
import { PROJECT_TEMPLATES } from '../data/defaultCatalog';
import {
  X,
  FolderOpen,
  Plus,
  Copy,
  Trash2,
  Download,
  Upload,
  Cloud,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentProject: ProjectData;
  savedProjects: ProjectData[];
  onLoadProject: (project: ProjectData) => void;
  onSaveProject: (project: ProjectData) => void;
  onDeleteProject: (projectId: string) => void;
  onLoadTemplate: (templateKey: string) => void;
}

export const ProjectManagerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentProject,
  savedProjects,
  onLoadProject,
  onSaveProject,
  onDeleteProject,
  onLoadTemplate,
}) => {
  const [activeTab, setActiveTab] = useState<'saved' | 'templates'>('saved');
  const [editingName, setEditingName] = useState(currentProject.name);
  const [editingClient, setEditingClient] = useState(currentProject.clientName || '');
  const [editingProjectNumber, setEditingProjectNumber] = useState(currentProject.projectNumber || '');
  const [editingEngineer, setEditingEngineer] = useState(currentProject.engineerName || '');
  const [editingNotes, setEditingNotes] = useState(currentProject.notes || '');

  if (!isOpen) return null;

  const handleSaveCurrentMeta = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: ProjectData = {
      ...currentProject,
      name: editingName.trim() || 'Untitled Hydraulic Project',
      clientName: editingClient.trim(),
      projectNumber: editingProjectNumber.trim(),
      engineerName: editingEngineer.trim(),
      notes: editingNotes.trim(),
      date: new Date().toISOString().split('T')[0],
    };
    onSaveProject(updated);
  };

  const handleExportJson = (project: ProjectData) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(project, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${project.name.replace(/\s+/g, '_')}_hydraulics.hydro`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.id && parsed.suction && parsed.discharge) {
          parsed.id = `imported_${Date.now()}`;
          onSaveProject(parsed);
          onLoadProject(parsed);
          onClose();
        } else {
          alert('Invalid HydroFlow project JSON file format.');
        }
      } catch (err) {
        alert('Failed to parse file: ' + err);
      }
    };
    reader.readAsText(file);
  };

  const handleCreateNew = () => {
    const newProj: ProjectData = {
      ...PROJECT_TEMPLATES.booster_station,
      id: `proj_${Date.now()}`,
      name: 'New Hydraulic System Calculation',
      clientName: 'New Client',
      projectNumber: `HF-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      engineerName: currentProject.engineerName || 'Alex Mercer, P.E.',
      date: new Date().toISOString().split('T')[0],
      revision: 'Rev. 01',
      notes: 'Initial preliminary pump sizing and pipeline loss modeling.',
    };
    onSaveProject(newProj);
    onLoadProject(newProj);
    onClose();
  };

  const handleClone = (proj: ProjectData) => {
    const cloned: ProjectData = {
      ...proj,
      id: `proj_${Date.now()}`,
      name: `${proj.name} (Copy)`,
      date: new Date().toISOString().split('T')[0],
      revision: 'Rev. 01 - Clone',
    };
    onSaveProject(cloned);
    onLoadProject(cloned);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Project Workspace & Cloud Management
              </h3>
              <p className="text-xs text-slate-400">
                Manage saved engineering projects, load pre-configured templates, or import/export
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateNew}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Project</span>
            </button>
            <label className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Import (.hydro)</span>
              <input type="file" accept=".hydro,.json" onChange={handleImportJson} className="hidden" />
            </label>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab switch */}
        <div className="px-4 pt-3 flex gap-2 border-b border-slate-800 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition ${
              activeTab === 'saved'
                ? 'border-cyan-400 text-cyan-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            My Saved Cloud Projects ({savedProjects.length})
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'templates'
                ? 'border-cyan-400 text-cyan-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Industrial Engineering Templates (3)</span>
          </button>
        </div>

        {/* Tab content */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4 custom-scrollbar">
          {activeTab === 'saved' ? (
            <div className="space-y-4">
              {/* Active Project Metadata Edit form */}
              <form
                onSubmit={handleSaveCurrentMeta}
                className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-xs space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Cloud className="w-4 h-4 text-cyan-400" />
                    Active Project Metadata & Header Information
                  </span>
                  <button
                    type="submit"
                    className="px-3 py-1 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-sm"
                  >
                    Save Changes
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Project Name:</label>
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Client / Facility:</label>
                    <input
                      type="text"
                      value={editingClient}
                      onChange={(e) => setEditingClient(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Project # / Job ID:</label>
                    <input
                      type="text"
                      value={editingProjectNumber}
                      onChange={(e) => setEditingProjectNumber(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Engineer Name, P.E.:</label>
                    <input
                      type="text"
                      value={editingEngineer}
                      onChange={(e) => setEditingEngineer(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="md:col-span-4">
                    <label className="text-slate-400 block mb-1">Engineering Notes / Remarks:</label>
                    <textarea
                      rows={2}
                      value={editingNotes}
                      onChange={(e) => setEditingNotes(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500 resize-none"
                    />
                  </div>
                </div>
              </form>

              {/* Projects List */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Saved Cloud & Local Projects
                </span>
                {savedProjects.map((p) => {
                  const isActive = p.id === currentProject.id;
                  return (
                    <div
                      key={p.id}
                      className={`p-3.5 rounded-xl border transition flex flex-wrap items-center justify-between gap-3 ${
                        isActive
                          ? 'bg-cyan-950/30 border-cyan-500 ring-1 ring-cyan-500/40'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-slate-100">{p.name}</h4>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500 text-slate-950 font-bold">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                          <span>Client: {p.clientName || 'General'}</span>
                          <span>|</span>
                          <span>Doc: {p.projectNumber || 'N/A'}</span>
                          <span>|</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {p.date}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!isActive && (
                          <button
                            onClick={() => {
                              onLoadProject(p);
                              onClose();
                            }}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-sm"
                          >
                            Open Project
                          </button>
                        )}
                        <button
                          onClick={() => handleClone(p)}
                          title="Duplicate / Clone project"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleExportJson(p)}
                          title="Export to .hydro file"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {savedProjects.length > 1 && (
                          <button
                            onClick={() => onDeleteProject(p.id)}
                            title="Delete project"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Templates list */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                {
                  key: 'booster_station',
                  title: 'Municipal Water Booster Station',
                  desc: 'Cleanwater distribution with 120 m³/h @ 65m TDH, long ductile iron main, and NPSH analysis.',
                  badge: 'Potable Water',
                },
                {
                  key: 'chilled_water',
                  title: 'HVAC Chilled Water Loop',
                  desc: 'Secondary chilled loop with 30% Ethylene Glycol at 6°C, closed loop zero static lift, VFD pump.',
                  badge: 'HVAC Hydronics',
                },
                {
                  key: 'wastewater_lift',
                  title: 'Wastewater / Sewage Lift Station',
                  desc: 'Wet well solids-handling vortex pump with high static lift and self-cleansing velocity check.',
                  badge: 'Wastewater',
                },
              ].map((t) => (
                <div
                  key={t.key}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 transition flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-semibold">
                      {t.badge}
                    </span>
                    <h4 className="text-sm font-semibold text-slate-100 mt-2 mb-1">{t.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">{t.desc}</p>
                  </div>
                  <button
                    onClick={() => {
                      onLoadTemplate(t.key);
                      onClose();
                    }}
                    className="w-full py-2 text-xs font-semibold rounded-lg bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/30 transition text-center"
                  >
                    Load Template
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
