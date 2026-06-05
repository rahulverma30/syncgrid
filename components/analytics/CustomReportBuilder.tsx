'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAnalyticsStore } from '@/store/analyticsStore';
import { ChartWrapper } from './ChartWrapper';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, DateInput } from '@/components/ui';
import { toast } from 'sonner';
import { FileSpreadsheet, Download, Filter, Calendar, Send, Printer } from 'lucide-react';
import { ICustomReportQuery } from '@/types/analytics';

interface IReportBuilderMetadata {
  type: string;
  groupBy: string;
  startDate: string;
  endDate: string;
  cached: boolean;
}

export function CustomReportBuilder() {
  const { reportQuery, setReportQuery, isLoading, setIsLoading } = useAnalyticsStore();

  const [dateRange, setDateRange] = useState(() => ({
    start: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  }));

  const [reportName, setReportName] = useState('New Custom Performance Report');
  const [queryDataset, setQueryDataset] = useState<Record<string, any>[]>([]);
  const [metaInfo, setMetaInfo] = useState<IReportBuilderMetadata | null>(null);

  const handleRunQuery = useCallback(async () => {
    setIsLoading(true);
    try {
      const payload = {
        type: reportQuery.type,
        dateRange,
        groupBy: reportQuery.groupBy,
        aggregateType: reportQuery.aggregateType,
        metrics: reportQuery.metrics,
      };

      const res = await fetch('/api/protected/analytics/builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setQueryDataset(json.data);
        setMetaInfo(json.meta);
        toast.success(`Pipeline matched ${json.data.length} aggregated coordinates.`);
      } else {
        toast.error(`Query aggregation failed: ${json.message}`);
      }
    } catch (err) {
      toast.error('Network failure connecting to reports builder service.');
    } finally {
      setIsLoading(false);
    }
  }, [
    setIsLoading,
    reportQuery.type,
    reportQuery.groupBy,
    reportQuery.aggregateType,
    reportQuery.metrics,
    dateRange,
    setQueryDataset,
    setMetaInfo,
  ]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      await Promise.resolve();
      if (!active) return;
      handleRunQuery();
    };
    load();
    return () => {
      active = false;
    };
  }, [handleRunQuery]);

  const handleExportCSV = async () => {
    if (queryDataset.length === 0) {
      toast.error('Cannot compile empty dataset into spreadsheet.');
      return;
    }

    try {
      const res = await fetch('/api/protected/analytics/exports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportName,
          dataset: queryDataset,
        }),
      });

      const json = await res.json();
      if (json.success) {
        const blob = new Blob([json.csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', json.filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Excel CSV generated and downloaded!');
      } else {
        toast.error('Failed to parse sheet file.');
      }
    } catch (err) {
      toast.error('Error generating Excel sheet export.');
    }
  };

  // Triggers branded PDF Print layouts
  const handlePrintPDF = () => {
    if (queryDataset.length === 0) {
      toast.error('Cannot compile print template for empty datasets.');
      return;
    }
    window.print();
  };

  // Adjust metrics/grouping lists based on type selection
  const groupingOptions = useMemo(() => {
    switch (reportQuery.type) {
      case 'financial':
        return [
          { value: 'month', label: 'Billing Period (Month)' },
          { value: 'category', label: 'Transaction Category' },
          { value: 'paymentMethod', label: 'Payment Channel' },
        ];
      case 'workforce':
        return [
          { value: 'employee', label: 'Resource (Employee Name)' },
          { value: 'billable', label: 'Classification (Billable vs Overhead)' },
        ];
      default:
        return [
          { value: 'status', label: 'Kanban Status State' },
          { value: 'project', label: 'Project Portfolio Scope' },
        ];
    }
  }, [reportQuery.type]);

  const metricOptions = useMemo(() => {
    switch (reportQuery.type) {
      case 'financial':
        return [
          { key: 'amount', label: 'Total Value Sum' },
          { key: 'avgAmount', label: 'Average Value Size' },
          { key: 'count', label: 'Transactions Count' },
        ];
      case 'workforce':
        return [
          { key: 'totalHours', label: 'Total Man-Hours Logged' },
          { key: 'billableHours', label: 'Billable Client Hours' },
          { key: 'billableRatio', label: 'Billable Productivity Ratio (%)' },
        ];
      default:
        return [
          { key: 'count', label: 'Total Active Tasks' },
          { key: 'completedCount', label: 'Completed Deliverables' },
        ];
    }
  }, [reportQuery.type]);

  // Advanced WCAG Dynamic Accessibility Narrative Summary
  const screenReaderSummary = useMemo(() => {
    if (queryDataset.length === 0) return 'Corporate reporting chart is currently empty.';

    const activeMetricKey = reportQuery.metrics[0];
    const values = queryDataset.map((d) => d[activeMetricKey] || 0);
    const sumVal = values.reduce((a, b) => a + b, 0);
    const maxVal = Math.max(...values);
    const minVal = Math.min(...values);
    const maxIdx = values.indexOf(maxVal);
    const minIdx = values.indexOf(minVal);
    const maxLabel = queryDataset[maxIdx]?.label || 'unspecified month';
    const minLabel = queryDataset[minIdx]?.label || 'unspecified month';

    return `Report compiled under SyncGrid corporate parameters for category ${reportQuery.type}. Evaluated ${queryDataset.length} classifications. Total consolidated aggregate sum of selected metric is ${sumVal.toLocaleString(undefined, { maximumFractionDigits: 1 })}. Highest coordinates index was recorded at label ${maxLabel} with value ${maxVal.toLocaleString(undefined, { maximumFractionDigits: 1 })}. Lowest index registered at label ${minLabel} with value ${minVal.toLocaleString(undefined, { maximumFractionDigits: 1 })}.`;
  }, [queryDataset, reportQuery.metrics, reportQuery.type]);

  return (
    <div className="space-y-6">
      {/* Branded Export CSS Injections */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          header,
          nav,
          aside,
          footer,
          button,
          select,
          input,
          .no-print,
          [role='navigation'] {
            display: none !important;
          }
          .print-full-width {
            width: 100% !important;
            max-width: 100% !important;
            grid-column: span 12 / span 12 !important;
          }
          .print-border {
            border: 1px solid #000 !important;
            border-radius: 0px !important;
            box-shadow: none !important;
            background: transparent !important;
          }
        }
      `}</style>

      {/* Dynamic parameters filters wrapper */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Parameters selector sidebar */}
        <Card className="lg:col-span-1 border-border bg-card/45 backdrop-blur-md h-fit no-print">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              Report Specifications
            </CardTitle>
          </CardHeader>
          <CardContent className="py-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Module Category
              </label>
              <Select
                value={reportQuery.type}
                onChange={(val) => {
                  const newType = val as ICustomReportQuery['type'];
                  setReportQuery({
                    type: newType,
                    groupBy:
                      newType === 'financial'
                        ? 'month'
                        : newType === 'workforce'
                          ? 'employee'
                          : 'status',
                    metrics:
                      newType === 'financial'
                        ? ['amount']
                        : newType === 'workforce'
                          ? ['totalHours']
                          : ['count'],
                  });
                }}
                className="h-9 text-xs rounded-lg px-2 bg-background border-border"
                options={[
                  { value: 'financial', label: 'Financial Ledger Cashflows' },
                  { value: 'workforce', label: 'Workforce Utilization logs' },
                  { value: 'productivity', label: 'Task Productivity Delivery' },
                ]}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Group Data By
              </label>
              <Select
                value={reportQuery.groupBy}
                onChange={(val) => setReportQuery({ groupBy: val })}
                className="h-9 text-xs rounded-lg px-2 bg-background border-border"
                options={groupingOptions}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Aggregation metric
              </label>
              <Select
                value={reportQuery.metrics[0]}
                onChange={(val) => setReportQuery({ metrics: [val] })}
                className="h-9 text-xs rounded-lg px-2 bg-background border-border"
                options={metricOptions.map((opt) => ({ value: opt.key, label: opt.label }))}
              />
            </div>

            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" />
                  Date Range Start
                </label>
                <DateInput
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="text-xs w-full"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" />
                  Date Range End
                </label>
                <DateInput
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="text-xs w-full"
                />
              </div>
            </div>

            <Button
              onClick={handleRunQuery}
              disabled={isLoading}
              className="w-full text-xs font-bold py-2 mt-4"
            >
              <Send className="h-3.5 w-3.5 mr-2" />
              Compile Live Query
            </Button>
          </CardContent>
        </Card>

        {/* Visual Charts Display */}
        <div className="lg:col-span-3 space-y-6 print-full-width">
          {/* Branded export header block, only rendered in printed layouts */}
          <div className="hidden print:block space-y-2 border-b-2 border-foreground pb-4 mb-6">
            <h1 className="text-3xl font-extrabold tracking-tight">SyncGrid Enterprise</h1>
            <p className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
              Corporate Intelligence & Analytics Executive Dossier
            </p>
            <div className="text-xs text-muted-foreground flex gap-4 pt-1">
              <span>Date Compiled: {new Date().toLocaleDateString()}</span>
              <span>Scope: {reportQuery.type.toUpperCase()} Timeline</span>
              {metaInfo?.cached && <span>Cache Source: Verified Ledger Caches</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-muted/40 backdrop-blur-md rounded-xl p-4 border border-border items-center no-print">
            <div className="md:col-span-1 space-y-1">
              <label className="text-[9px] font-bold text-primary uppercase tracking-wider">
                Spreadsheet Identity
              </label>
              <Input
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="Give this compiled report a name..."
                className="text-xs font-bold bg-background h-9 border-border/80"
              />
            </div>
            <div className="flex md:col-span-2 md:justify-end gap-3 pt-3 md:pt-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrintPDF}
                className="flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Branded PDF Printout
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Spreadsheet
              </Button>
            </div>
          </div>

          {/* Accessible Screen-Reader Description Narrative Summary */}
          <div className="sr-only" aria-live="polite">
            {screenReaderSummary}
          </div>

          <div className="print-border">
            <ChartWrapper
              type={
                reportQuery.chartType === 'line' || reportQuery.chartType === 'area'
                  ? 'area'
                  : 'bar'
              }
              data={queryDataset}
              xKey="label"
              metrics={[
                {
                  key: reportQuery.metrics[0],
                  label:
                    metricOptions.find((m) => m.key === reportQuery.metrics[0])?.label || 'Value',
                },
              ]}
              title={reportName}
              subtitle={`Consolidated ${reportQuery.type} timeline aggregates grouped by ${reportQuery.groupBy}`}
              height={280}
            />
          </div>

          {/* Aggregated Grid Metrics Tabular View */}
          <Card className="border-border bg-card/45 backdrop-blur-md print-border print-full-width">
            <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                Tabular Aggregation Ledger Matrix
              </CardTitle>
              <span className="text-[10px] font-bold text-muted-foreground bg-muted/65 px-2 py-0.5 rounded-full no-print">
                {queryDataset.length} rows processed
              </span>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-semibold text-left select-none">
                <thead>
                  <tr className="bg-muted/40 border-b border-border text-muted-foreground/90 text-[10px] uppercase font-bold tracking-wider">
                    <th className="p-4">Group Classification Label</th>
                    {metricOptions.map((opt) => (
                      <th key={opt.key} className="p-4 text-right">
                        {opt.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {queryDataset.map((row, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-muted/20 transition-colors text-foreground/90"
                    >
                      <td className="p-4 font-extrabold text-foreground">{row.label}</td>
                      {metricOptions.map((opt) => (
                        <td
                          key={opt.key}
                          className="p-4 text-right font-mono text-muted-foreground"
                        >
                          {row[opt.key] !== undefined
                            ? typeof row[opt.key] === 'number'
                              ? row[opt.key].toLocaleString(undefined, { maximumFractionDigits: 1 })
                              : String(row[opt.key])
                            : '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {queryDataset.length === 0 && (
                    <tr>
                      <td
                        colSpan={metricOptions.length + 1}
                        className="p-8 text-center text-muted-foreground font-medium"
                      >
                        No active rows. Run dynamic query to load data matrix.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
