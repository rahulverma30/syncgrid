'use client';

import { useEffect, useState } from 'react';
import { useHRStore } from '@/store/hrStore';
import { PageHeader, Button } from '@/components/ui';
import {
  Sparkles,
  Users,
  LayoutDashboard,
  Calendar,
  Network,
  Award,
  Settings,
  Database,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Component tab imports
import { HrDashboard } from '@/components/hr/HrDashboard';
import { HrDirectory } from '@/components/hr/HrDirectory';
import { HrOrgChart } from '@/components/hr/HrOrgChart';
import { HrLeaves } from '@/components/hr/HrLeaves';
import { HrPerformance } from '@/components/hr/HrPerformance';
import { HrSettings } from '@/components/hr/HrSettings';

export default function HRPage() {
  const { fetchEmployees, fetchDepartments, fetchAttendance, fetchLeaves, fetchAnnouncements } =
    useHRStore();

  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    // Initial fetch of all HR data
    Promise.all([
      fetchEmployees(),
      fetchDepartments(),
      fetchAttendance(),
      fetchLeaves(),
      fetchAnnouncements(),
    ]);
  }, [fetchEmployees, fetchDepartments, fetchAttendance, fetchLeaves, fetchAnnouncements]);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'directory', label: 'Employee Directory', icon: Users },
    { id: 'orgchart', label: 'Org Chart', icon: Network },
    { id: 'leaves', label: 'Time Off & Attendance', icon: Calendar },
    { id: 'performance', label: 'Performance', icon: Award },
    { id: 'settings', label: 'Policy Settings', icon: Settings },
  ];

  return (
    <div className="space-y-6 relative min-h-screen pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          eyebrow="Workforce Operations"
          title="Enterprise HR & Talent Suite"
          description="Manage employees, track attendance clocks, process leaves, evaluate cycles, and structure company hierarchy."
        />
      </div>

      {/* Tab Switcher Navigation */}
      <div className="border-b border-border bg-card/20 backdrop-blur-md sticky top-0 z-10 py-2 flex gap-2 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap focus:outline-none focus:ring-1 focus:ring-primary ${
                isActive
                  ? 'bg-primary/10 text-primary border-b-2 border-primary shadow-[0_4px_12px_rgba(var(--primary-rgb),0.05)]'
                  : 'text-muted-foreground hover:bg-card hover:text-foreground'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'animate-pulse' : ''}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Viewports */}
      <div className="mt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
          >
            {activeTab === 'dashboard' && <HrDashboard />}
            {activeTab === 'directory' && <HrDirectory />}
            {activeTab === 'orgchart' && <HrOrgChart />}
            {activeTab === 'leaves' && <HrLeaves />}
            {activeTab === 'performance' && <HrPerformance />}
            {activeTab === 'settings' && <HrSettings />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
