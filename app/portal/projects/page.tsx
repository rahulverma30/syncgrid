'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Briefcase,
  Calendar,
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
  BarChart4,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui';
import { toast } from 'sonner';

export default function PortalProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/portal/projects');
      const body = await res.json();
      if (body.success) {
        setProjects(body.data);
        if (body.data.length > 0) {
          setSelectedProject(body.data[0]);
        }
      }
    } catch (err) {
      toast.error('Failed to load project details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const getStatusBadge = (status: string) => {
    const maps: Record<string, { label: string; class: string }> = {
      planning: { label: 'Planning', class: 'bg-blue-500/10 text-blue-400 border-blue-500/15' },
      design: {
        label: 'Design Scope',
        class: 'bg-purple-500/10 text-purple-400 border-purple-500/15',
      },
      development: {
        label: 'In Development',
        class: 'bg-amber-500/10 text-amber-400 border-amber-500/15',
      },
      testing: {
        label: 'QA & Testing',
        class: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/15',
      },
      completed: {
        label: 'Completed',
        class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15',
      },
    };
    const item = maps[status] || {
      label: status,
      class: 'bg-slate-500/10 text-slate-400 border-slate-500/15',
    };
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${item.class}`}>
        {item.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl bg-slate-900" />
          ))}
        </div>
        <div className="lg:col-span-2">
          <Skeleton className="h-full rounded-2xl bg-slate-900" />
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <Card className="bg-slate-900/20 border-slate-850 p-12 rounded-3xl text-center">
        <EmptyState
          title="No Shared Projects"
          description="Your agency account representative hasn't exposed any active projects to your portal workspace yet."
          icon={<Briefcase className="w-12 h-12 text-slate-500" />}
        />
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Project selector side list */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-white">Active Projects</h1>
          <p className="text-xs text-slate-500">Exposed project transparent spaces</p>
        </div>

        <div className="space-y-3">
          {projects.map((project) => {
            const isSelected = selectedProject?._id === project._id;
            return (
              <div
                key={project._id}
                className={`cursor-pointer transition-all duration-300 rounded-2xl border p-5 space-y-3 ${
                  isSelected
                    ? 'bg-slate-900 border-blue-500 shadow-lg shadow-blue-500/5'
                    : 'bg-slate-900/40 border-slate-850 hover:border-slate-800'
                }`}
                onClick={() => setSelectedProject(project)}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                    {project.code}
                  </span>
                  {getStatusBadge(project.status)}
                </div>
                <h3 className="text-sm font-bold text-white truncate">{project.name}</h3>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>Progress</span>
                    <span className="font-semibold text-slate-200">
                      {project.progressPercentage}%
                    </span>
                  </div>
                  {/* Tiny visual progress bar */}
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
                      style={{ width: `${project.progressPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Project Details Room */}
      {selectedProject && (
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-slate-900/40 border-slate-850 rounded-3xl p-6 lg:p-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 border-b border-slate-850 pb-6">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                    {selectedProject.code}
                  </span>
                  <span>•</span>
                  {getStatusBadge(selectedProject.status)}
                </div>
                <h2 className="text-2xl font-bold text-white">{selectedProject.name}</h2>
              </div>
              <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl">
                <BarChart4 className="w-4 h-4 text-emerald-400" />
                <div className="text-left text-xs">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">
                    Health Index
                  </span>
                  <p className="font-bold text-white">
                    {selectedProject.healthScore || 100}% Optimal
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                Project Summary
              </span>
              <p className="text-sm text-slate-300 leading-relaxed">
                {selectedProject.description || 'No description shared for this workspace.'}
              </p>
            </div>

            {/* Date metrics block */}
            <div className="grid grid-cols-2 gap-4 bg-slate-950/40 p-4 rounded-2xl border border-slate-850">
              <div className="flex items-center space-x-3">
                <Calendar className="w-4 h-4 text-blue-500" />
                <div className="text-xs text-left">
                  <span className="text-slate-500 font-medium">Kickoff Date</span>
                  <p className="font-bold text-white">
                    {selectedProject.startDate
                      ? new Date(selectedProject.startDate).toLocaleDateString()
                      : 'Pending'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="w-4 h-4 text-amber-500" />
                <div className="text-xs text-left">
                  <span className="text-slate-500 font-medium">Estimated Deadline</span>
                  <p className="font-bold text-white">
                    {selectedProject.deadline
                      ? new Date(selectedProject.deadline).toLocaleDateString()
                      : 'Retainer'}
                  </p>
                </div>
              </div>
            </div>

            {/* Shielded Milestones List */}
            <div className="space-y-4">
              <span className="text-xs text-slate-500 uppercase font-bold tracking-wider flex items-center space-x-2">
                <Activity className="w-4 h-4 text-blue-500" />
                <span>Exposed Milestones & Delivery Schedules</span>
              </span>

              {!selectedProject.milestones || selectedProject.milestones.length === 0 ? (
                <p className="text-sm text-slate-500 italic bg-slate-950/20 p-4 rounded-xl text-center border border-slate-850">
                  No milestones have been exposed to this client space.
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedProject.milestones.map((milestone: any) => (
                    <div
                      key={milestone._id}
                      className="flex items-start justify-between bg-slate-900 border border-slate-850 p-4 rounded-2xl hover:border-slate-800 transition-colors"
                    >
                      <div className="space-y-1 text-left">
                        <h4 className="text-sm font-bold text-white">{milestone.title}</h4>
                        <p className="text-xs text-slate-400">
                          {milestone.description || 'No description shared.'}
                        </p>
                        {milestone.dueDate && (
                          <span className="text-[10px] text-slate-500 block pt-1">
                            Deadline: {new Date(milestone.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {milestone.status === 'completed' ? (
                          <span className="inline-flex items-center text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 px-2 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Signed Off
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/15 px-2 py-0.5 rounded">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending Review
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
