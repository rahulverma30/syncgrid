'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAutomationStore, IWorkflowNode, IWorkflowEdge } from '@/store/automationStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Play,
  Save,
  Plus,
  Trash2,
  Settings,
  GitCommit,
  CheckCircle,
  Zap,
  Target,
  Briefcase,
  AlertTriangle,
  FolderOpen,
  UserCheck,
  PlusCircle,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';

let idCounter = 0;
const generateUniqueId = (prefix: string) => {
  idCounter += 1;
  return `${prefix}_${idCounter}_${Math.random().toString(36).substring(2, 9)}`;
};

export function WorkflowBuilder() {
  const {
    nodes,
    setNodes,
    edges,
    setEdges,
    workflowName,
    setWorkflowName,
    workflowDescription,
    setWorkflowDescription,
    workflowCategory,
    setWorkflowCategory,
    workflowStatus,
    setWorkflowStatus,
    selectedNodeId,
    setSelectedNodeId,
    activeWorkflowId,
    setActiveWorkflowId,
    clearCanvas,
  } = useAutomationStore();

  const [activeInspectorTab, setActiveInspectorTab] = useState<'config' | 'variables'>('config');
  const [isTestingSandbox, setIsTestingSandbox] = useState(false);
  const [testingStepIndex, setTestingStepIndex] = useState(-1);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Available Nodes Toolbox
  const triggerPalette = [
    {
      type: 'employee_onboarded',
      title: 'Employee Onboarded',
      icon: <UserCheck className="h-4 w-4 text-emerald-500" />,
    },
    {
      type: 'invoice_overdue',
      title: 'Invoice Overdue',
      icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
    },
    {
      type: 'expense_submitted',
      title: 'Expense Submitted',
      icon: <Layers className="h-4 w-4 text-indigo-500" />,
    },
    {
      type: 'task_completed',
      title: 'Task Completed',
      icon: <CheckCircle className="h-4 w-4 text-blue-500" />,
    },
  ];

  const actionPalette = [
    {
      type: 'send_notification',
      title: 'Send Notification',
      icon: <Zap className="h-4 w-4 text-yellow-500" />,
    },
    {
      type: 'create_task',
      title: 'Create Task',
      icon: <Briefcase className="h-4 w-4 text-sky-500" />,
    },
    {
      type: 'approval_request',
      title: 'Approval Request',
      icon: <UserCheck className="h-4 w-4 text-rose-500" />,
    },
    {
      type: 'escalate',
      title: 'Escalate Issue',
      icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
    },
    {
      type: 'send_email',
      title: 'Send Email',
      icon: <Settings className="h-4 w-4 text-purple-500" />,
    },
  ];

  const handleAddNode = (type: 'trigger' | 'action', nodeClass: string, title: string) => {
    // Prevent duplicate triggers
    if (type === 'trigger' && nodes.some((n) => n.type === 'trigger')) {
      toast.error('Only one trigger node is allowed per workflow definition.');
      return;
    }

    const newId = generateUniqueId('node');
    const xPos = type === 'trigger' ? 100 : 150 + nodes.length * 120;
    const yPos = type === 'trigger' ? 150 : 150 + (nodes.length % 3) * 60;

    const newNode: IWorkflowNode = {
      id: newId,
      type,
      x: xPos,
      y: yPos,
      data: {
        label: title,
        type: nodeClass,
        options: {
          title: `Automated ${title}`,
          description: `Dispatched operational parameters`,
          to: 'resource@syncgrid.com',
          subject: 'System Alert Notice',
        },
      },
    };

    setNodes((prev) => [...prev, newNode]);

    // Automatically draw connecting edges
    if (nodes.length > 0) {
      const lastNode = nodes[nodes.length - 1];
      const newEdge: IWorkflowEdge = {
        id: `edge_${lastNode.id}_${newId}`,
        source: lastNode.id,
        target: newId,
        type: 'default',
      };
      setEdges((prev) => [...prev, newEdge]);
    }

    setSelectedNodeId(newId);
    toast.success(`${title} block placed on canvas.`);
  };

  const handleDragNode = (id: string, e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newX = Math.max(
        20,
        Math.min(canvasRect.width - 250, moveEvent.clientX - canvasRect.left - 100)
      );
      const newY = Math.max(
        20,
        Math.min(canvasRect.height - 120, moveEvent.clientY - canvasRect.top - 40)
      );

      setNodes((prev) =>
        prev.map((node) => (node.id === id ? { ...node, x: newX, y: newY } : node))
      );
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleDeleteNode = (id: string) => {
    setNodes((prev) => prev.filter((node) => node.id !== id));
    setEdges((prev) => prev.filter((edge) => edge.source !== id && edge.target !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
    toast.info('Workflow node deleted.');
  };

  const handleSaveWorkflow = async () => {
    if (nodes.length === 0) {
      toast.error('Workflow canvas is empty. Add a trigger node to save.');
      return;
    }

    const triggerNode = nodes.find((n) => n.type === 'trigger');
    if (!triggerNode) {
      toast.error('Workflow lacks a start trigger node.');
      return;
    }

    const actionNodes = nodes.filter((n) => n.type === 'action');

    const payload = {
      name: workflowName,
      description: workflowDescription,
      category: workflowCategory,
      triggerConfig: {
        type: triggerNode.data.type,
        options: triggerNode.data.options || {},
      },
      actionChain: actionNodes.map((act) => ({
        actionId: act.id,
        type: act.data.type,
        options: act.data.options || {},
      })),
      status: workflowStatus,
    };

    setIsTestingSandbox(true);
    toast.promise(
      fetch(
        activeWorkflowId
          ? `/api/protected/automation/workflows/${activeWorkflowId}`
          : '/api/protected/automation/workflows',
        {
          method: activeWorkflowId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )
        .then((res) => res.json())
        .then((data) => {
          if (!data.success) throw new Error(data.message || 'Saving failed.');
          if (!activeWorkflowId) setActiveWorkflowId(data.data._id);
          setWorkflowStatus(data.data.status);
          setIsTestingSandbox(false);
          return data;
        }),
      {
        loading: 'Compiling syntax and saving configuration...',
        success: 'Workflow compiled and published successfully! 🚀',
        error: (err) => `Failed to save workflow: ${err.message}`,
      }
    );
  };

  const handleRunSandboxTest = () => {
    if (nodes.length === 0) {
      toast.error('Place nodes on the canvas to execute dry-run sandbox validations.');
      return;
    }

    setIsTestingSandbox(true);
    setTestingStepIndex(0);

    const stepInterval = setInterval(() => {
      setTestingStepIndex((prev) => {
        if (prev >= nodes.length - 1) {
          clearInterval(stepInterval);
          setIsTestingSandbox(false);
          toast.success('Sandbox testing completed! Execution paths resolved successfully.');
          return -1;
        }
        return prev + 1;
      });
    }, 1500);
  };

  const activeNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-280px)] select-none">
      {/* Sidebar Toolpack */}
      <div className="space-y-6 lg:col-span-1 flex flex-col h-full overflow-y-auto">
        <Card className="border-border bg-card/45 backdrop-blur-md">
          <CardHeader className="py-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-primary animate-pulse" />
              1. Trigger Console Start
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            {triggerPalette.map((trig) => (
              <button
                key={trig.type}
                onClick={() => handleAddNode('trigger', trig.type, trig.title)}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-border/80 bg-background/50 hover:border-primary/50 text-xs font-semibold text-foreground transition-all"
              >
                <div className="flex items-center gap-2">
                  {trig.icon}
                  {trig.title}
                </div>
                <PlusCircle className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border bg-card/45 backdrop-blur-md flex-1">
          <CardHeader className="py-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-primary" />
              2. Actions Library Cards
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            {actionPalette.map((act) => (
              <button
                key={act.type}
                onClick={() => handleAddNode('action', act.type, act.title)}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-border/80 bg-background/50 hover:border-primary/50 text-xs font-semibold text-foreground transition-all"
              >
                <div className="flex items-center gap-2">
                  {act.icon}
                  {act.title}
                </div>
                <PlusCircle className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Main Draggable Canvas Area */}
      <div className="lg:col-span-2 flex flex-col h-full border border-border rounded-xl overflow-hidden bg-card/25 backdrop-blur-sm relative">
        {/* Canvas Toolbar Controls */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-background/45 backdrop-blur-md z-10">
          <div className="flex flex-col gap-1 w-1/2">
            <Input
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="text-sm font-extrabold h-8 border-none focus-visible:ring-0 bg-transparent p-0"
              placeholder="Name your Workflow"
            />
            <Input
              value={workflowDescription}
              onChange={(e) => setWorkflowDescription(e.target.value)}
              className="text-[10px] text-muted-foreground h-6 border-none focus-visible:ring-0 bg-transparent p-0"
              placeholder="Provide a description..."
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleRunSandboxTest}
              variant="outline"
              size="sm"
              className="text-xs font-bold gap-1.5 h-8"
              disabled={isTestingSandbox}
            >
              <Play className="h-3.5 w-3.5" />
              Test Sandbox
            </Button>
            <Button
              onClick={handleSaveWorkflow}
              size="sm"
              className="text-xs font-bold gap-1.5 h-8"
              disabled={isTestingSandbox}
            >
              <Save className="h-3.5 w-3.5" />
              Publish Flow
            </Button>
            <Button
              onClick={clearCanvas}
              variant="destructive"
              size="icon"
              className="h-8 w-8"
              title="Clear Canvas"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* The Grid Canvas */}
        <div
          ref={canvasRef}
          className="flex-1 relative overflow-hidden bg-[radial-gradient(ellipse_at_center,rgba(var(--primary-rgb),0.02)_1px,transparent_1px)] bg-[size:20px_20px]"
        >
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center select-none pointer-events-none">
              <GitCommit className="h-10 w-10 text-muted-foreground/60 mb-2 animate-bounce" />
              <h5 className="text-sm font-extrabold text-foreground">Canvas Empty</h5>
              <p className="text-xs text-muted-foreground max-w-xs mt-1">
                Drag or click standard triggers from the left panel to begin orchestrating agency
                pipelines.
              </p>
            </div>
          )}

          {/* SVG Connection Paths */}
          <svg className="absolute inset-0 pointer-events-none w-full h-full">
            {edges.map((edge) => {
              const srcNode = nodes.find((n) => n.id === edge.source);
              const tgtNode = nodes.find((n) => n.id === edge.target);
              if (!srcNode || !tgtNode) return null;

              const x1 = srcNode.x + 100;
              const y1 = srcNode.y + 40;
              const x2 = tgtNode.x + 100;
              const y2 = tgtNode.y + 40;

              // Spline curve coordinates
              const controlPointX = (x1 + x2) / 2;

              return (
                <path
                  key={edge.id}
                  d={`M ${x1} ${y1} C ${controlPointX} ${y1}, ${controlPointX} ${y2}, ${x2} ${y2}`}
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                  strokeDasharray={isTestingSandbox ? '5,5' : '0'}
                  className={isTestingSandbox ? 'animate-[dash_2s_linear_infinite]' : ''}
                  fill="none"
                />
              );
            })}
          </svg>

          {/* Draggable Node Cards */}
          {nodes.map((node, index) => {
            const isSelected = selectedNodeId === node.id;
            const isTestingActive = isTestingSandbox && index === testingStepIndex;

            return (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  x: node.x,
                  y: node.y,
                  borderColor: isTestingActive
                    ? '#10b981'
                    : isSelected
                      ? 'hsl(var(--primary))'
                      : 'rgba(var(--border-rgb),0.8)',
                  boxShadow: isTestingActive
                    ? '0 0 12px rgba(16,185,129,0.4)'
                    : isSelected
                      ? '0 0 10px rgba(var(--primary-rgb),0.25)'
                      : 'none',
                }}
                className={`absolute w-[200px] border bg-background/95 rounded-lg p-3 cursor-grab select-none z-20`}
                onMouseDown={(e) => handleDragNode(node.id, e)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNodeId(node.id);
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                      node.type === 'trigger'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {node.type}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNode(node.id);
                    }}
                    className="p-1 hover:text-red-500 text-muted-foreground transition-all"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <h6 className="text-xs font-bold text-foreground leading-tight">
                  {node.data.label}
                </h6>
                <p className="text-[9px] text-muted-foreground mt-0.5 uppercase tracking-wide font-semibold">
                  Type: {node.data.type}
                </p>

                {node.type === 'trigger' && (
                  <div className="mt-2 flex items-center gap-1 text-[9px] text-emerald-500 font-bold bg-emerald-500/5 p-1 rounded">
                    <Target className="h-3 w-3" /> Start Node
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* inspector Panel Column */}
      <div className="lg:col-span-1 flex flex-col h-full">
        <Card className="border-border bg-card/45 backdrop-blur-md flex-1 flex flex-col overflow-hidden">
          <div className="border-b border-border flex items-center select-none bg-background/25">
            <button
              onClick={() => setActiveInspectorTab('config')}
              className={`flex-1 text-center py-3 text-xs font-bold transition-all border-b-2 ${
                activeInspectorTab === 'config'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Node Settings
            </button>
            <button
              onClick={() => setActiveInspectorTab('variables')}
              className={`flex-1 text-center py-3 text-xs font-bold transition-all border-b-2 ${
                activeInspectorTab === 'variables'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Global Context
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {activeInspectorTab === 'config' ? (
              activeNode ? (
                <div className="space-y-4">
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">
                      Node Title
                    </span>
                    <Input
                      value={activeNode.data.label}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNodes((prev) =>
                          prev.map((n) =>
                            n.id === activeNode.id ? { ...n, data: { ...n.data, label: val } } : n
                          )
                        );
                      }}
                      className="text-xs font-semibold h-8 mt-1"
                    />
                  </div>

                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">
                      Action Type Options
                    </span>
                    <div className="bg-background/40 p-2.5 rounded-lg border border-border/80 text-[10px] text-muted-foreground mt-1 space-y-2">
                      <div>
                        <span className="font-bold uppercase text-[9px]">Title/Task Name</span>
                        <Input
                          value={activeNode.data.options?.title || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNodes((prev) =>
                              prev.map((n) =>
                                n.id === activeNode.id
                                  ? {
                                      ...n,
                                      data: {
                                        ...n.data,
                                        options: { ...n.data.options, title: val },
                                      },
                                    }
                                  : n
                              )
                            );
                          }}
                          className="h-7 text-[10px] mt-0.5"
                        />
                      </div>
                      <div>
                        <span className="font-bold uppercase text-[9px]">
                          Description Parameters
                        </span>
                        <Input
                          value={activeNode.data.options?.description || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNodes((prev) =>
                              prev.map((n) =>
                                n.id === activeNode.id
                                  ? {
                                      ...n,
                                      data: {
                                        ...n.data,
                                        options: { ...n.data.options, description: val },
                                      },
                                    }
                                  : n
                              )
                            );
                          }}
                          className="h-7 text-[10px] mt-0.5"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <Settings className="h-8 w-8 text-muted-foreground/60 mb-1" />
                  <p className="text-xs text-muted-foreground">
                    Select a node on the canvas to configure trigger or action properties.
                  </p>
                </div>
              )
            ) : (
              <div className="space-y-3">
                <h6 className="text-xs font-bold text-foreground">
                  Dynamic Runtime Context Placeholders
                </h6>
                <p className="text-[10px] text-muted-foreground">
                  Use these double-curly bracket placeholders inside option parameter fields to
                  inject runtime values:
                </p>
                <div className="space-y-2">
                  {[
                    { token: '{{employee_name}}', label: 'Onboarded employee name.' },
                    { token: '{{invoice_number}}', label: 'Overdue invoice billing number.' },
                    { token: '{{invoice_amount}}', label: 'Total receivables amount.' },
                    { token: '{{task_title}}', label: 'Dynamically created task name.' },
                  ].map((tok) => (
                    <div
                      key={tok.token}
                      className="p-2 border border-border/80 bg-background/50 rounded-lg select-all"
                      title="Click to copy placeholder token"
                      onClick={() => {
                        navigator.clipboard.writeText(tok.token);
                        toast.success(`Copied placeholder: ${tok.token}`);
                      }}
                    >
                      <code className="text-xs font-extrabold text-primary">{tok.token}</code>
                      <p className="text-[9px] text-muted-foreground font-semibold mt-0.5">
                        {tok.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
