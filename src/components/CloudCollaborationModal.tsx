import React, { useState } from 'react';
import { ProjectData } from '../types/hydraulics';
import {
  X,
  Share2,
  Users,
  Cloud,
  Check,
  Copy,
  Clock,
  Shield,
  RotateCcw,
  Sparkles,
  Link2,
  UserPlus,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectData;
  onRevertRevision?: (revisionLabel: string) => void;
}

interface Collaborator {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Lead Engineer' | 'Peer Reviewer' | 'Client Viewer';
  avatarInitials: string;
  isOnline: boolean;
}

export const CloudCollaborationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  project,
}) => {
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Editor' | 'Viewer'>('Editor');
  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    {
      id: 'c1',
      name: project.engineerName || 'Alex Mercer, P.E.',
      email: 'alex.mercer@hydroflow.engineering',
      role: 'Owner',
      avatarInitials: 'AM',
      isOnline: true,
    },
    {
      id: 'c2',
      name: 'Sarah Lin, CEng',
      email: 's.lin@mwd-district.gov',
      role: 'Peer Reviewer',
      avatarInitials: 'SL',
      isOnline: true,
    },
    {
      id: 'c3',
      name: project.clientName ? `${project.clientName} Rep` : 'Client Reviewer',
      email: 'engineering@clientcorp.com',
      role: 'Client Viewer',
      avatarInitials: 'CR',
      isOnline: false,
    },
  ]);

  const [revisions] = useState([
    {
      rev: project.revision || 'Rev. 02',
      date: 'Just now',
      author: project.engineerName || 'Alex Mercer',
      notes: 'Updated VFD speed modulation and fitted DN150 discharge main for low friction loss.',
      active: true,
    },
    {
      rev: 'Rev. 01',
      date: 'Yesterday at 16:45',
      author: project.engineerName || 'Alex Mercer',
      notes: 'Initial preliminary hydraulic model setup with suction lift check.',
      active: false,
    },
  ]);

  if (!isOpen) return null;

  const projectShareUrl = `${window.location.origin}?project=${project.id}&auth=shared_cloud`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(projectShareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    const initials = inviteEmail
      .split('@')[0]
      .substring(0, 2)
      .toUpperCase();

    setCollaborators([
      ...collaborators,
      {
        id: `c_${Date.now()}`,
        name: inviteEmail.split('@')[0],
        email: inviteEmail.trim(),
        role: inviteRole === 'Editor' ? 'Lead Engineer' : 'Client Viewer',
        avatarInitials: initials,
        isOnline: false,
      },
    ]);
    setInviteEmail('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-100">
                  Cloud Storage & Team Collaboration
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Cloud Synced
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Share hydraulic project models in real-time with clients and peer reviewers
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-5 text-xs custom-scrollbar">
          {/* Share Link box */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-cyan-400" />
              Direct Collaboration Project Link
            </span>
            <p className="text-slate-400 text-[11px]">
              Anyone with this secure cloud link can view or collaborate on this hydraulic calculation.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                readOnly
                value={projectShareUrl}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-300 font-mono text-[11px] select-all focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition flex items-center gap-1.5 shadow-sm shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Collaborators List & Invite */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-cyan-400" />
                Active Project Collaborators ({collaborators.length})
              </span>
              <span className="text-[11px] text-slate-400">Multi-user cloud access</span>
            </div>

            {/* Invite form */}
            <form onSubmit={handleInvite} className="flex gap-2">
              <input
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="Editor">Can Edit</option>
                <option value="Viewer">Can View Only</option>
              </select>
              <button
                type="submit"
                className="px-3 py-1.5 font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center gap-1 shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Invite</span>
              </button>
            </form>

            {/* Members cards */}
            <div className="space-y-2 pt-1">
              {collaborators.map((c) => (
                <div
                  key={c.id}
                  className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold font-mono text-[11px] text-cyan-400">
                        {c.avatarInitials}
                      </div>
                      {c.isOnline && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-950"></span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-200">{c.name}</span>
                        {c.isOnline && (
                          <span className="text-[10px] text-emerald-400 font-mono">(Active now)</span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">{c.email}</span>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                    {c.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Cloud Versioning & Revision History */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              Automated Cloud Revision History
            </span>
            <div className="space-y-2">
              {revisions.map((rev) => (
                <div
                  key={rev.rev}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-cyan-400">{rev.rev}</span>
                      <span className="text-slate-500 text-[10px]">•</span>
                      <span className="text-slate-400 text-[11px]">{rev.date}</span>
                      <span className="text-slate-500 text-[10px]">•</span>
                      <span className="text-slate-400 text-[11px]">by {rev.author}</span>
                      {rev.active && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                          Current Head
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300">{rev.notes}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
