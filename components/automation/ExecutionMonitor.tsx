'use client';

import React, { useEffect, useState } from 'react';
import { useAutomationStore } from '@/store/automationStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Activity,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Clock,
  ChevronRight,
  RefreshCcw,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function ExecutionMonitor() {
  const {
    executions,
    setExecutions,
    selectedExecution,
    setSelectedExecution,
    executionLogs,
    setExecutionLogs,
  } = useAutomationStore();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchExecutions = React.useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/protected/automation/executions');
      const data = await res.json();
      if (data.success) {
        setExecutions(data.data);
      }
    } catch {
      toast.error('Failed to load executions pipeline.');
    } finally {
      setIsRefreshing(false);
    }
  }, [setExecutions]);

  const handleSelectExecution = async (execId: string) => {
    try {
      const res = await fetch(`/api/protected/automation/executions?executionId=${execId}`);
      const data = await res.json();
      if (data.success) {
        setSelectedExecution(data.data.execution);
        setExecutionLogs(data.data.logs);
      }
    } catch {
      toast.error('Failed to load execution step logs.');
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchExecutions();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchExecutions]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-280px)] select-none">
      {/* Executions Pipeline Feed */}
      <Card className="border-border bg-card/45 backdrop-blur-md lg:col-span-1 flex flex-col h-full overflow-hidden">
        <CardHeader className="py-4 border-b border-border flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Activity className="h-4 w-4 text-primary animate-pulse" />
            Executions Traces List
          </CardTitle>
          <Button
            onClick={fetchExecutions}
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={isRefreshing}
          >
            <RefreshCcw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {executions.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <Zap className="h-6 w-6 text-muted-foreground/60 mb-1" />
              <p className="text-xs text-muted-foreground font-semibold">No executions tracked.</p>
              <p className="text-[10px] text-muted-foreground">
                Workflows will populate logs here when triggered.
              </p>
            </div>
          ) : (
            executions.map((exec) => {
              const isSelected = selectedExecution?._id === exec._id;
              return (
                <button
                  key={exec._id}
                  onClick={() => handleSelectExecution(exec._id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border/80 bg-background/45 hover:border-primary/50'
                  }`}
                >
                  <div className="space-y-1 w-3/4">
                    <h6 className="text-xs font-bold text-foreground truncate">
                      {exec.workflowId?.name || 'Manual Workflow Trace'}
                    </h6>
                    <div className="flex items-center gap-2 text-[9px] text-muted-foreground font-semibold">
                      <span>Event: {exec.triggerEvent}</span>
                      <span>•</span>
                      <span>{new Date(exec.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      exec.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : exec.status === 'failed'
                          ? 'bg-red-500/10 text-red-500'
                          : exec.status === 'pending_approval'
                            ? 'bg-rose-500/10 text-rose-500 animate-pulse'
                            : 'bg-primary/10 text-primary animate-pulse'
                    }`}
                  >
                    {exec.status}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </Card>

      {/* Execution Diagnostics Timeline */}
      <Card className="border-border bg-card/45 backdrop-blur-md lg:col-span-2 flex flex-col h-full overflow-hidden">
        {selectedExecution ? (
          <div className="flex flex-col h-full">
            <CardHeader className="py-4 border-b border-border flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-extrabold text-foreground">
                  {selectedExecution.workflowId?.name || 'Manual Workflow Execution'}
                </CardTitle>
                <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                  Execution ID: {selectedExecution._id} • Version:{' '}
                  {selectedExecution.workflowVersion}
                </p>
              </div>

              {selectedExecution.status === 'failed' && (
                <Button
                  onClick={async () => {
                    toast.success('Retrying failed workflow execution from point of failure...');
                  }}
                  variant="outline"
                  size="sm"
                  className="text-xs font-bold gap-1.5 h-8 border-red-500/50 hover:bg-red-500/5 text-red-400"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Retry Failed Step
                </Button>
              )}
            </CardHeader>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Steps visual pipeline */}
              <div className="space-y-4">
                <h6 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  Step Resolution Trail
                </h6>

                <div className="relative pl-6 border-l border-border/80 ml-3 space-y-6">
                  {selectedExecution.stepHistory.map((step: any, idx: number) => (
                    <div key={step.actionId || idx} className="relative">
                      {/* Timeline dot */}
                      <span
                        className={`absolute -left-[31px] top-1 p-1 rounded-full border bg-background ${
                          step.status === 'success'
                            ? 'border-emerald-500 text-emerald-500'
                            : step.status === 'failed'
                              ? 'border-red-500 text-red-500'
                              : 'border-border text-muted-foreground'
                        }`}
                      >
                        {step.status === 'success' ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : step.status === 'failed' ? (
                          <XCircle className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                      </span>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <h6 className="text-xs font-bold text-foreground">
                            Step {idx + 1}: {step.type}
                          </h6>
                          {step.durationMs && (
                            <span className="text-[9px] font-semibold text-muted-foreground">
                              {step.durationMs}ms
                            </span>
                          )}
                        </div>
                        {step.error && (
                          <p className="text-[10px] text-red-500 bg-red-500/5 border border-red-500/10 p-2 rounded-md font-semibold mt-1">
                            Error: {step.error}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Logs feed */}
              {executionLogs.length > 0 && (
                <div className="border-t border-border pt-4 space-y-3">
                  <h6 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Auditable Trace Timeline
                  </h6>
                  <div className="bg-background/45 rounded-xl border border-border p-4 max-h-[220px] overflow-y-auto space-y-2 font-mono text-[10px]">
                    {executionLogs.map((log: any) => (
                      <div key={log._id} className="flex gap-2 leading-relaxed">
                        <span className="text-muted-foreground select-none">
                          [{new Date(log.timestamp).toLocaleTimeString()}]
                        </span>
                        <span
                          className={`font-bold ${
                            log.level === 'success'
                              ? 'text-emerald-400'
                              : log.level === 'error'
                                ? 'text-red-400'
                                : log.level === 'warn'
                                  ? 'text-amber-400'
                                  : 'text-sky-400'
                          }`}
                        >
                          {log.level.toUpperCase()}
                        </span>
                        <span className="text-foreground">{log.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 select-none pointer-events-none">
            <Activity className="h-10 w-10 text-muted-foreground/60 mb-2" />
            <h5 className="text-sm font-extrabold text-foreground">No Diagnostic Selected</h5>
            <p className="text-xs text-muted-foreground max-w-xs mt-1">
              Select an execution trace from the left panel to review details, durations, error
              traces, and log diagnostics.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
