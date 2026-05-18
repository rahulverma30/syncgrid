'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAnalyticsStore } from '@/store/analyticsStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Target,
  AlertTriangle,
  Save,
  CheckCircle,
  TrendingDown,
  Percent,
  TrendingUp,
  Sliders,
  Scale,
  Award,
} from 'lucide-react';

export function KPIManager() {
  const { isLoading, setIsLoading, kpiConfigurations, setKpiConfigurations } = useAnalyticsStore();

  const [editKpiId, setEditKpiId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    targetValue: 0,
    warningThreshold: 80,
    criticalThreshold: 60,
    scoringWeight: 1,
  });

  const fetchKpis = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/protected/analytics/kpis');
      const json = await res.json();
      if (json.success) {
        setKpiConfigurations(json.data);
      } else {
        toast.error('Failed to load corporate target indicators.');
      }
    } catch (err) {
      toast.error('Network failure connecting to target vault.');
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setKpiConfigurations]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      await Promise.resolve();
      if (!active) return;
      fetchKpis();
    };
    load();
    return () => {
      active = false;
    };
  }, [fetchKpis]);

  const handleEditClick = (kpi: any) => {
    setEditKpiId(kpi._id);
    setFormData({
      targetValue: kpi.targetValue,
      warningThreshold: kpi.warningThreshold,
      criticalThreshold: kpi.criticalThreshold,
      scoringWeight: kpi.scoringWeight,
    });
  };

  const handleSaveKPI = async (metricName: string) => {
    setIsLoading(true);
    try {
      const payload = {
        metricName,
        targetValue: Number(formData.targetValue),
        warningThreshold: Number(formData.warningThreshold),
        criticalThreshold: Number(formData.criticalThreshold),
        scoringWeight: Number(formData.scoringWeight),
      };

      const res = await fetch('/api/protected/analytics/kpis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(`Target definitions for "${json.data.title}" updated!`);
        setEditKpiId(null);
        fetchKpis();
      } else {
        toast.error(`Failed to update KPI: ${json.message}`);
      }
    } catch (err) {
      toast.error('Error connecting to target configurations service.');
    } finally {
      setIsLoading(false);
    }
  };

  // Determine standard gauge color
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'on_track':
        return {
          bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
          badgeBg: 'bg-emerald-500',
          text: 'text-emerald-500',
          label: 'On Track',
        };
      case 'warning':
        return {
          bg: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
          badgeBg: 'bg-amber-500',
          text: 'text-amber-500',
          label: 'Warning Breach',
        };
      default:
        return {
          bg: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
          badgeBg: 'bg-rose-500',
          text: 'text-rose-500',
          label: 'Critical Underperformance',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Target Vault Header Details */}
      <div className="bg-muted/40 backdrop-blur-md rounded-xl p-4 border border-border flex items-start gap-4">
        <div className="p-3 bg-primary/10 rounded-xl text-primary mt-1 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]">
          <Target className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-foreground">Target Vault Metrics Center</h3>
          <p className="text-xs text-muted-foreground font-medium leading-relaxed">
            Establish corporate key performance indicators, warning limits, and target thresholds.
            Underperforming metric targets dynamically raise real-time alerts inside the auditing
            ledger.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {kpiConfigurations.map((kpi) => {
          const isEditing = editKpiId === kpi._id;
          const status = getStatusStyles(kpi.status);

          // Calculate visual target completion percentage
          let completionPercent = 100;
          if (kpi.targetValue > 0) {
            if (kpi.metricName === 'overdue_invoice_ratio') {
              completionPercent =
                kpi.currentValue <= kpi.targetValue
                  ? 100
                  : (kpi.targetValue / kpi.currentValue) * 100;
            } else {
              completionPercent = (kpi.currentValue / kpi.targetValue) * 100;
            }
          }
          completionPercent = Math.min(100, Math.max(0, completionPercent));

          return (
            <Card
              key={kpi._id}
              className={`border-border bg-card/45 backdrop-blur-md transition-all ${
                isEditing && 'ring-1 ring-primary/40'
              }`}
            >
              <CardHeader className="pb-3 border-b border-border flex flex-row items-start justify-between">
                <div className="space-y-1 pr-4">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest bg-muted px-2 py-0.5 rounded-sm">
                    KPI SCORE WEIGHT: {kpi.scoringWeight}
                  </span>
                  <CardTitle className="text-sm font-bold text-foreground">{kpi.title}</CardTitle>
                </div>
                <div
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${status.bg}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${status.badgeBg} animate-pulse`} />
                  {status.label}
                </div>
              </CardHeader>
              <CardContent className="py-4 space-y-4">
                <p className="text-xs text-muted-foreground font-medium">{kpi.description}</p>

                {/* Score bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                    <span>TARGET SATISFACTION INDEX</span>
                    <span>{completionPercent.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${status.badgeBg}`}
                      style={{ width: `${completionPercent}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-muted/20 rounded-lg p-3 border border-border/60">
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">
                      Current Standing
                    </span>
                    <h4 className="text-lg font-bold text-foreground">
                      {kpi.currentValue}
                      {kpi.unit === 'percent' ? '%' : ''}
                    </h4>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">
                      Objective Target
                    </span>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={formData.targetValue}
                        onChange={(e) =>
                          setFormData({ ...formData, targetValue: Number(e.target.value) })
                        }
                        className="h-7 text-xs py-0 px-2 mt-1 w-24 font-mono font-bold"
                      />
                    ) : (
                      <h4 className="text-lg font-bold text-primary">
                        {kpi.targetValue}
                        {kpi.unit === 'percent' ? '%' : ''}
                      </h4>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="space-y-3 pt-2 border-t border-border/80">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                          <Sliders className="h-3 w-3 text-amber-500" />
                          Warning limit
                        </label>
                        <Input
                          type="number"
                          value={formData.warningThreshold}
                          onChange={(e) =>
                            setFormData({ ...formData, warningThreshold: Number(e.target.value) })
                          }
                          className="h-8 text-xs font-bold"
                          placeholder="e.g. 80"
                        />
                        <span className="text-[8px] text-muted-foreground font-semibold">
                          Alert fires if target index &lt; {formData.warningThreshold}%
                        </span>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 text-rose-500" />
                          Critical Limit
                        </label>
                        <Input
                          type="number"
                          value={formData.criticalThreshold}
                          onChange={(e) =>
                            setFormData({ ...formData, criticalThreshold: Number(e.target.value) })
                          }
                          className="h-8 text-xs font-bold"
                          placeholder="e.g. 60"
                        />
                        <span className="text-[8px] text-muted-foreground font-semibold">
                          Breach is marked if target &lt; {formData.criticalThreshold}%
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                        <Scale className="h-3 w-3 text-primary" />
                        Scoring Priority Weight
                      </label>
                      <Input
                        type="number"
                        value={formData.scoringWeight}
                        onChange={(e) =>
                          setFormData({ ...formData, scoringWeight: Number(e.target.value) })
                        }
                        className="h-8 text-xs font-bold"
                        placeholder="e.g. 3 (High)"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  {isEditing ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditKpiId(null)}
                        className="text-xs h-8"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSaveKPI(kpi.metricName)}
                        className="text-xs h-8 font-bold"
                      >
                        <Save className="h-3.5 w-3.5 mr-1" />
                        Commit Targets
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(kpi)}
                      className="text-xs h-8 border-dashed"
                    >
                      Calibrate Limits
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
