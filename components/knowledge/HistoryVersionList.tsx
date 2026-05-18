'use client';

import React, { useEffect, useState } from 'react';
import { useKnowledgeStore } from '@/store';
import { History, RefreshCcw, User, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from '@/lib/date';
import { toast } from 'sonner';
import { ConfirmationModal } from '@/components/ui';

export function HistoryVersionList() {
  const { activeDocument, triggerRollback } = useKnowledgeStore();
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [rollingBackIdx, setRollingBackIdx] = useState<number | null>(null);

  // Rollback Modal States
  const [isRollbackConfirmOpen, setIsRollbackConfirmOpen] = useState(false);
  const [selectedRollbackVersion, setSelectedRollbackVersion] = useState<number | null>(null);
  const [selectedRollbackIdx, setSelectedRollbackIdx] = useState<number | null>(null);

  const fetchVersions = async () => {
    if (!activeDocument) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/protected/knowledge/documents/${activeDocument._id}/versions`);
      const json = await res.json();
      if (json.success) {
        setVersions(json.data);
      }
    } catch (err) {
      console.error('Failed to load version history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchVersions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDocument?._id, activeDocument?.versionsCount]);

  if (!activeDocument) return null;

  const handleRollback = (versionNumber: number, idx: number) => {
    setSelectedRollbackVersion(versionNumber);
    setSelectedRollbackIdx(idx);
    setIsRollbackConfirmOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/20 border border-border/20 rounded-xl overflow-hidden backdrop-blur-md">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border/30 bg-slate-950/40">
        <History className="h-4 w-4 text-emerald-400" />
        <span className="text-sm font-semibold text-slate-200">Revision History</span>
        <span className="ml-auto text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-border/40 text-slate-400 font-mono">
          V{activeDocument.versionsCount || 1}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-[150px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500 text-xs gap-2 animate-pulse">
            <RefreshCcw className="h-4 w-4 animate-spin text-emerald-500" />
            <span>Retrieving version logs...</span>
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-12 text-slate-500 italic text-xs">
            No revision history logs recorded.
          </div>
        ) : (
          versions.map((ver: any, idx: number) => {
            const isLatest = idx === 0;
            const editorName = ver.editorId?.name || 'Workspace Member';
            return (
              <div
                key={ver._id}
                className={`flex flex-col gap-1 border border-border/10 rounded-lg p-3 ${
                  isLatest ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-900/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-slate-950/60 border border-border flex items-center justify-center text-slate-400">
                    <User className="h-3 w-3" />
                  </div>
                  <span className="text-xs font-semibold text-slate-300">{editorName}</span>
                  <span className="text-[9px] text-emerald-500 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded ml-auto">
                    V{ver.versionNumber}
                  </span>
                </div>

                <div className="text-xs text-slate-400 font-semibold italic mt-1 font-mono">
                  &quot;{ver.changeSummary}&quot;
                </div>

                <div className="flex items-center justify-between border-t border-border/10 pt-2 mt-2">
                  <span className="text-[9px] text-slate-500 font-mono">
                    {ver.createdAt
                      ? formatDistanceToNow(new Date(ver.createdAt)) + ' ago'
                      : 'checkpoint'}
                  </span>

                  {isLatest ? (
                    <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-semibold font-mono">
                      <CheckCircle className="h-3 w-3" /> Current version
                    </span>
                  ) : (
                    <button
                      onClick={() => handleRollback(ver.versionNumber, idx)}
                      disabled={rollingBackIdx !== null}
                      className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-border/40 hover:bg-emerald-500/10 hover:border-emerald-500/30 text-[9px] text-slate-300 hover:text-emerald-400 font-mono transition-colors"
                    >
                      {rollingBackIdx === idx ? (
                        <RefreshCcw className="h-2.5 w-2.5 animate-spin" />
                      ) : (
                        <RefreshCcw className="h-2.5 w-2.5" />
                      )}{' '}
                      Restore V{ver.versionNumber}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Rollback Confirmation Modal */}
      <ConfirmationModal
        isOpen={isRollbackConfirmOpen}
        onClose={() => setIsRollbackConfirmOpen(false)}
        onConfirm={async () => {
          if (selectedRollbackVersion !== null && selectedRollbackIdx !== null) {
            setRollingBackIdx(selectedRollbackIdx);
            const success = await triggerRollback(activeDocument._id, selectedRollbackVersion);
            setRollingBackIdx(null);
            if (success) {
              fetchVersions();
            }
            setIsRollbackConfirmOpen(false);
          }
        }}
        title="Rollback Document Version"
        message={`Are you absolutely sure you want to rollback "${activeDocument.title}" to version ${selectedRollbackVersion}? All current unsaved edits will be replaced.`}
        confirmLabel="Rollback Version"
        cancelLabel="Cancel"
        type="warning"
      />
    </div>
  );
}
