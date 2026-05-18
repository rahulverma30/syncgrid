'use client';

import React, { useEffect, useState } from 'react';
import { useAutomationStore } from '@/store/automationStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  UserCheck,
  CheckCircle,
  XCircle,
  FileText,
  Clock,
  RefreshCcw,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

export function ApprovalManager() {
  const { approvals, setApprovals } = useAutomationStore();
  const [selectedApproval, setSelectedApproval] = useState<any | null>(null);
  const [comment, setComment] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchApprovals = React.useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/protected/automation/approvals');
      const data = await res.json();
      if (data.success) {
        setApprovals(data.data);
      }
    } catch {
      toast.error('Failed to load pending approvals.');
    } finally {
      setIsRefreshing(false);
    }
  }, [setApprovals]);

  const handleResolveApproval = async (action: 'approve' | 'reject') => {
    if (!selectedApproval) return;

    if (action === 'reject' && !comment.trim()) {
      toast.error('Rejection comment is required.');
      return;
    }

    const payload = {
      approvalId: selectedApproval._id,
      action,
      comment,
    };

    toast.promise(
      fetch('/api/protected/automation/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then((res) => res.json())
        .then((data) => {
          if (!data.success) throw new Error(data.message || 'Operation failed.');
          setSelectedApproval(null);
          setComment('');
          fetchApprovals();
          return data;
        }),
      {
        loading: 'Submitting review decision...',
        success: `Approval successfully resolved!`,
        error: (err) => `Failed to resolve approval: ${err.message}`,
      }
    );
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchApprovals();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchApprovals]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-280px)] select-none">
      {/* Pending Approvals Feed */}
      <Card className="border-border bg-card/45 backdrop-blur-md lg:col-span-1 flex flex-col h-full overflow-hidden">
        <CardHeader className="py-4 border-b border-border flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <UserCheck className="h-4 w-4 text-primary animate-pulse" />
            Pending Action Console
          </CardTitle>
          <Button
            onClick={fetchApprovals}
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={isRefreshing}
          >
            <RefreshCcw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {approvals.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <CheckCircle className="h-6 w-6 text-emerald-500 mb-1" />
              <p className="text-xs text-muted-foreground font-semibold">Inbox Clear!</p>
              <p className="text-[10px] text-muted-foreground">
                You have zero pending workflow approvals.
              </p>
            </div>
          ) : (
            approvals.map((app) => {
              const isSelected = selectedApproval?._id === app._id;
              return (
                <button
                  key={app._id}
                  onClick={() => setSelectedApproval(app)}
                  className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border/80 bg-background/45 hover:border-primary/50'
                  }`}
                >
                  <div className="space-y-1 w-3/4">
                    <h6 className="text-xs font-bold text-foreground truncate">{app.title}</h6>
                    <div className="flex items-center gap-2 text-[9px] text-muted-foreground font-semibold">
                      <span className="uppercase text-primary">{app.requestType}</span>
                      <span>•</span>
                      <span>{new Date(app.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              );
            })
          )}
        </div>
      </Card>

      {/* Approval Stage review inspector */}
      <Card className="border-border bg-card/45 backdrop-blur-md lg:col-span-2 flex flex-col h-full overflow-hidden">
        {selectedApproval ? (
          <div className="flex flex-col h-full">
            <CardHeader className="py-4 border-b border-border">
              <span className="text-[9px] font-extrabold uppercase bg-primary/10 text-primary px-2 py-0.5 rounded-full w-fit">
                {selectedApproval.requestType} Approval Request
              </span>
              <CardTitle className="text-sm font-extrabold text-foreground mt-1.5">
                {selectedApproval.title}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {selectedApproval.description}
              </p>
            </CardHeader>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Approval steps sequence progression */}
              <div className="space-y-3">
                <h6 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-primary" />
                  Reviewer Escalation Chain
                </h6>

                <div className="space-y-3">
                  {selectedApproval.steps.map((step: any, idx: number) => {
                    const isActive = idx === selectedApproval.currentStepIndex;
                    return (
                      <div
                        key={step.approverId}
                        className={`p-3 rounded-lg border flex items-center justify-between ${
                          isActive
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-border bg-background/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-extrabold text-muted-foreground">
                            Stage {step.sequenceOrder}:
                          </span>
                          <div>
                            <h6 className="text-xs font-bold text-foreground">
                              {step.approverName}
                            </h6>
                            {isActive && (
                              <span className="text-[9px] text-primary font-bold animate-pulse">
                                Awaiting Decision
                              </span>
                            )}
                          </div>
                        </div>

                        <span
                          className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            step.status === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : step.status === 'rejected'
                                ? 'bg-red-500/10 text-red-500'
                                : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {step.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action form */}
              <div className="border-t border-border pt-4 space-y-4">
                <h6 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4" />
                  Decision Review Comments
                </h6>
                <Input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Enter comments (Required if rejecting)..."
                  className="text-xs h-9"
                />

                <div className="flex gap-2 justify-end select-none">
                  <Button
                    onClick={() => handleResolveApproval('reject')}
                    variant="destructive"
                    size="sm"
                    className="text-xs font-bold gap-1.5 h-9"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject Request
                  </Button>
                  <Button
                    onClick={() => handleResolveApproval('approve')}
                    size="sm"
                    className="text-xs font-bold gap-1.5 h-9 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve Request
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 select-none pointer-events-none">
            <FileText className="h-10 w-10 text-muted-foreground/60 mb-2" />
            <h5 className="text-sm font-extrabold text-foreground">Review Inspector</h5>
            <p className="text-xs text-muted-foreground max-w-xs mt-1">
              Select a pending item from the left panel to review reviewer chains, write supervisor
              feedback, and submit your decision.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
