'use client';

import React, { useEffect, useState } from 'react';
import { useKnowledgeStore } from '@/store';
import { CheckCircle, AlertTriangle, ShieldCheck, UserCheck } from 'lucide-react';
import { formatDate } from '@/lib/date';

export function ReadingAcknowledgePanel() {
  const { activeDocument, acknowledgeProgress } = useKnowledgeStore();
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchProgress = async () => {
    if (!activeDocument) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/protected/knowledge/documents/${activeDocument._id}/progress`);
      const json = await res.json();
      if (json.success) {
        setProgress(json.data);
      }
    } catch (err) {
      console.error('Failed to load reading progress:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, [activeDocument?._id]);

  if (!activeDocument) return null;
  if (!activeDocument.isSop) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center bg-slate-950/20 border border-border/20 rounded-xl backdrop-blur-md h-full">
        <ShieldCheck className="h-8 w-8 text-slate-600 mb-2" />
        <span className="text-xs font-semibold text-slate-400">Informational Document</span>
        <p className="text-[10px] text-slate-500 max-w-xs mt-1">This page is not flagged as a mandatory Standard Operating Procedure (SOP). Read tracking is disabled.</p>
      </div>
    );
  }

  const handleAcknowledge = async () => {
    setSubmitting(true);
    const success = await acknowledgeProgress(activeDocument._id);
    setSubmitting(false);
    if (success) {
      fetchProgress();
    }
  };

  const isCompleted = progress?.acknowledged;

  return (
    <div className="flex flex-col h-full bg-slate-950/20 border border-border/20 rounded-xl overflow-hidden backdrop-blur-md">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border/30 bg-slate-950/40">
        <ShieldCheck className="h-4 w-4 text-emerald-400" />
        <span className="text-sm font-semibold text-slate-200">Compliance & SOP Tracking</span>
      </div>

      <div className="flex-1 p-6 flex flex-col justify-between min-h-[200px]">
        <div className="flex flex-col items-center justify-center text-center gap-3">
          {loading ? (
            <div className="animate-pulse flex flex-col gap-2 items-center">
              <div className="h-10 w-10 rounded-full bg-slate-800" />
              <div className="h-4 w-28 bg-slate-800 rounded" />
            </div>
          ) : isCompleted ? (
            <div className="flex flex-col items-center gap-2">
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-1">
                <UserCheck className="h-6 w-6" />
              </div>
              <span className="text-sm font-semibold text-emerald-400">Sign-off Acknowledged!</span>
              <span className="text-[10px] text-slate-500 leading-relaxed font-mono">
                Confirmed read on: {progress.completedAt ? formatDate(progress.completedAt) : 'completed'}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="h-12 w-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 mb-1">
                <AlertTriangle className="h-6 w-6 animate-bounce" />
              </div>
              <span className="text-sm font-semibold text-amber-500">Awaiting Sign-off</span>
              <p className="text-[10px] text-slate-400 max-w-xs leading-relaxed">
                This page outlines standard business compliance instructions. You are strictly required to read it thoroughly and acknowledge below.
              </p>
            </div>
          )}
        </div>

        {!isCompleted && (
          <button
            onClick={handleAcknowledge}
            disabled={submitting}
            className="w-full mt-6 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-slate-950 font-semibold text-xs transition-colors shadow-md flex items-center justify-center gap-1.5"
          >
            <CheckCircle className="h-3.5 w-3.5" /> Confirm Acknowledge Reading SOP
          </button>
        )}
      </div>
    </div>
  );
}
