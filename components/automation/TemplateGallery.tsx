'use client';

import React, { useEffect, useState } from 'react';
import { useAutomationStore } from '@/store/automationStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FolderOpen,
  Copy,
  ChevronRight,
  UserCheck,
  CreditCard,
  Briefcase,
  Cpu,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';

let idCounter = 0;
const generateUniqueId = (prefix: string) => {
  idCounter += 1;
  return `${prefix}_${idCounter}_${Math.random().toString(36).substring(2, 9)}`;
};

const getCategoryIcon = (cat: string) => {
  switch (cat) {
    case 'hr':
      return <UserCheck className="h-4 w-4 text-emerald-500" />;
    case 'finance':
      return <CreditCard className="h-4 w-4 text-amber-500" />;
    case 'project':
      return <Briefcase className="h-4 w-4 text-blue-500" />;
    default:
      return <Cpu className="h-4 w-4 text-sky-500" />;
  }
};

export function TemplateGallery() {
  const {
    setActiveTab,
    setNodes,
    setEdges,
    setWorkflowName,
    setWorkflowDescription,
    setWorkflowCategory,
    setWorkflowStatus,
    setActiveWorkflowId,
  } = useAutomationStore();

  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTemplates = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/protected/automation/templates');
      const data = await res.json();
      if (data.success) {
        setTemplates(data.data);
      }
    } catch {
      toast.error('Failed to load workflow templates.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCloneTemplate = (tpl: any) => {
    // Clear canvas
    setActiveWorkflowId(null);
    setWorkflowName(`${tpl.name} (Clone)`);
    setWorkflowDescription(tpl.description);
    setWorkflowCategory(tpl.category);
    setWorkflowStatus('draft');

    // Reconstruct nodes coordinates sequentially
    const generatedNodes: any[] = [];
    const generatedEdges: any[] = [];

    // 1. Start trigger node
    const triggerId = generateUniqueId('node_trig');
    generatedNodes.push({
      id: triggerId,
      type: 'trigger',
      x: 100,
      y: 150,
      data: {
        label: tpl.name.split(' ')[0] + ' Start Trigger',
        type: tpl.triggerConfig.type,
        options: tpl.triggerConfig.options || {},
      },
    });

    // 2. Action chain nodes
    tpl.actionChain.forEach((act: any, idx: number) => {
      const actId = generateUniqueId(`node_act_${idx}`);
      generatedNodes.push({
        id: actId,
        type: 'action',
        x: 150 + (idx + 1) * 200,
        y: 150 + (idx % 2) * 50,
        data: {
          label: act.type
            .split('_')
            .map((s: string) => s.charAt(0).toUpperCase() + s.slice(1))
            .join(' '),
          type: act.type,
          options: act.options || {},
        },
      });

      // Connecting edge
      const prevId = idx === 0 ? triggerId : generatedNodes[generatedNodes.length - 2].id;
      generatedEdges.push({
        id: `edge_${prevId}_${actId}`,
        source: prevId,
        target: actId,
        type: 'default',
      });
    });

    setNodes(generatedNodes);
    setEdges(generatedEdges);

    // Route user to the visual builder tab
    setActiveTab('builder');
    toast.success(`Cloned template: "${tpl.name}". You can now customize or publish it!`);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTemplates();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchTemplates]);

  return (
    <div className="space-y-6 select-none">
      {/* Premium Header */}
      <div className="flex flex-col gap-1">
        <h4 className="text-sm font-extrabold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
          <FolderOpen className="h-4 w-4 text-primary animate-pulse" />
          Out-of-the-Box Operations Blueprints
        </h4>
        <p className="text-xs text-muted-foreground">
          Browse our structured preconfigured automated templates to fast-track agency HR, billing,
          or task assignments pipelines.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {templates.length === 0 ? (
          <div className="col-span-3 h-[250px] border border-dashed border-border rounded-xl flex flex-col items-center justify-center text-center p-4">
            <Layers className="h-8 w-8 text-muted-foreground/60 mb-1" />
            <p className="text-xs text-muted-foreground font-semibold">No blueprints loaded.</p>
            <p className="text-[10px] text-muted-foreground">
              Seed default items using the Sandbox Seeding button in the header console.
            </p>
          </div>
        ) : (
          templates.map((tpl) => (
            <Card
              key={tpl._id}
              className="border-border bg-card/45 backdrop-blur-md hover:border-primary/50 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <CardHeader className="p-5 pb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-extrabold uppercase bg-background/50 border border-border px-2 py-0.5 rounded-full flex items-center gap-1">
                    {getCategoryIcon(tpl.category)}
                    {tpl.category}
                  </span>
                  <span className="text-[9px] font-extrabold text-muted-foreground uppercase">
                    {tpl.actionChain.length} steps
                  </span>
                </div>
                <CardTitle className="text-sm font-extrabold text-foreground leading-snug">
                  {tpl.name}
                </CardTitle>
                <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                  {tpl.description}
                </p>
              </CardHeader>

              <CardContent className="p-5 pt-0">
                <Button
                  onClick={() => handleCloneTemplate(tpl)}
                  size="sm"
                  className="w-full text-xs font-bold gap-1.5 h-8 mt-2"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Clone Template Flow
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
