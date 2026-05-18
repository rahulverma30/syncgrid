'use client';

import { useState, useEffect } from 'react';
import { useHRStore } from '@/store/hrStore';
import {
  Drawer,
  Card,
  CardContent,
  Button,
  Badge,
  Input,
  Select,
  ConfirmationModal,
} from '@/components/ui';
import {
  X,
  User,
  Briefcase,
  DollarSign,
  Laptop,
  CheckSquare,
  FileText,
  Activity,
  Phone,
  Mail,
  Clock,
  Trash2,
  Calendar,
  Award,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Shield,
  TrendingUp,
} from 'lucide-react';
import { useNotificationStore } from '@/store/notification'; // for real-time notification sync
import { toast } from 'sonner';

interface EmployeeDetailModalProps {
  employeeId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EmployeeDetailModal({ employeeId, isOpen, onClose }: EmployeeDetailModalProps) {
  const { employees, updateEmployee, deleteEmployee } = useHRStore();
  const [activeSubTab, setActiveSubTab] = useState('overview');

  // Resolve employee directly in render
  const employee = employeeId ? employees.find((e) => e._id === employeeId) : null;

  // Local overrides state to update checkboxes instantly
  const [checklistOverrides, setChecklistOverrides] = useState<Record<string, boolean>>({});
  const [prevEmployeeId, setPrevEmployeeId] = useState<string | null>(null);

  // Terminate Modal State
  const [isOffboardConfirmOpen, setIsOffboardConfirmOpen] = useState(false);

  // Reset overrides if the employeeId prop changes
  if (employeeId !== prevEmployeeId) {
    setPrevEmployeeId(employeeId);
    setChecklistOverrides({});
  }

  // Asset allocation states
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetSerial, setNewAssetSerial] = useState('');

  // Performance form state
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [goalsReached, setGoalsReached] = useState(100);

  if (!employee) return null;

  const dbChecklist = employee.onboardingChecklist || {};
  const checklist: Record<string, boolean> = {
    'Signed Contract':
      checklistOverrides['Signed Contract'] !== undefined
        ? checklistOverrides['Signed Contract']
        : !!dbChecklist['Signed Contract'],
    'Issued Laptop':
      checklistOverrides['Issued Laptop'] !== undefined
        ? checklistOverrides['Issued Laptop']
        : !!dbChecklist['Issued Laptop'],
    'Configured Credentials':
      checklistOverrides['Configured Credentials'] !== undefined
        ? checklistOverrides['Configured Credentials']
        : !!dbChecklist['Configured Credentials'],
    'Introduction Call':
      checklistOverrides['Introduction Call'] !== undefined
        ? checklistOverrides['Introduction Call']
        : !!dbChecklist['Introduction Call'],
  };

  const handleToggleChecklist = async (key: string) => {
    const nextVal = !checklist[key];
    setChecklistOverrides((prev) => ({ ...prev, [key]: nextVal }));

    const updatedChecklist = {
      ...checklist,
      [key]: nextVal,
    };

    const success = await updateEmployee(employee._id, {
      onboardingChecklist: updatedChecklist,
    });
    if (success) {
      toast.success(`Checklist item "${key}" updated!`);
    }
  };

  const handleAddAsset = async () => {
    if (!newAssetName) {
      toast.error('Asset name is required');
      return;
    }
    const updatedAssets = [
      ...(employee.assets || []),
      {
        name: newAssetName,
        serialNumber: newAssetSerial,
        assignedDate: new Date(),
        status: 'assigned',
      },
    ];

    const success = await updateEmployee(employee._id, { assets: updatedAssets });
    if (success) {
      toast.success('Asset allocated successfully!');
      setNewAssetName('');
      setNewAssetSerial('');
    }
  };

  const handleReturnAsset = async (assetId: string) => {
    const updatedAssets = (employee.assets || []).map((asset: any) => {
      if (asset._id === assetId) {
        return { ...asset, status: 'returned', returnedDate: new Date() };
      }
      return asset;
    });

    const success = await updateEmployee(employee._id, { assets: updatedAssets });
    if (success) {
      toast.success('Asset marked as returned!');
    }
  };

  const handleOffboard = () => {
    setIsOffboardConfirmOpen(true);
  };

  const subTabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'compensation', label: 'Compensation & Assets', icon: DollarSign },
    { id: 'checklist', label: 'Onboarding Checklist', icon: CheckSquare },
    { id: 'emergency', label: 'Emergency Contacts', icon: Phone },
    { id: 'documents', label: 'Documents Vault', icon: FileText },
    { id: 'attendanceLogs', label: 'Attendance Clocks', icon: Clock },
    { id: 'leaves', label: 'Leave History', icon: Calendar },
    { id: 'workload', label: 'Allocations & Workload', icon: Briefcase },
    { id: 'performance', label: 'Performance Reviews', icon: Award },
    { id: 'audit', label: 'Audit Trail Logs', icon: Activity },
  ];

  // Dynamic checklists calculations
  const template = employee.checklistTemplate || 'standard';
  const getTasksForTemplate = (t: string) => {
    switch (t) {
      case 'developer':
        return [
          'Signed Contract',
          'Issued Laptop',
          'Configured Credentials',
          'Codebase Walkthrough',
          'Setup SSH Keys',
          'First Commit Deploy',
        ];
      case 'hr':
        return [
          'Signed Contract',
          'Issued Laptop',
          'Configured Credentials',
          'Compliance Review',
          'HRIS Introduction',
          'Benefits Enrollment',
        ];
      case 'designer':
        return [
          'Signed Contract',
          'Issued Laptop',
          'Configured Credentials',
          'Figma Workspace Invitation',
          'Brand Guild Walkthrough',
          'Asset Library Briefing',
        ];
      case 'contractor':
        return [
          'Signed Contract',
          'Compliance Disclosures',
          'Configured Credentials',
          'Initial Backlog Briefing',
          'Direct Invoice Setup',
        ];
      default:
        return ['Signed Contract', 'Issued Laptop', 'Configured Credentials', 'Introduction Call'];
    }
  };

  const tasks = getTasksForTemplate(template);

  // Resolve checklist tasks completion
  const handleToggleDynamicChecklist = async (key: string) => {
    const currentChecklist = employee.onboardingChecklist || {};
    const nextVal = !currentChecklist[key];
    const updated = { ...currentChecklist, [key]: nextVal };

    const success = await updateEmployee(employee._id, {
      onboardingChecklist: updated,
    });
    if (success) {
      toast.success(`Checklist task "${key}" status updated!`);
    }
  };

  const handleUpdateTemplate = async (newT: string) => {
    const success = await updateEmployee(employee._id, {
      checklistTemplate: newT,
      onboardingChecklist: {}, // reset onboarding progress on template shift
    });
    if (success) {
      toast.success(`Switched template to ${newT.toUpperCase()} onboarding workflow.`);
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback) {
      toast.error('Feedback notes must be completed.');
      return;
    }
    const success = await useHRStore.getState().submitPerformanceReview({
      employeeId: employee._id,
      rating,
      feedback,
      goalsReached,
    });
    if (success) {
      setFeedback('');
      toast.success('Performance review evaluation recorded!');
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={`Employee File: ${employee.fullName}`}>
      <div className="space-y-6">
        {/* Header Avatar and Basic Info */}
        <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card/40">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xl border-2 border-primary/20">
            {employee.fullName.charAt(0)}
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-lg leading-none">{employee.fullName}</h3>
            <p className="text-xs text-muted-foreground">{employee.designation}</p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <Badge variant="outline" className="text-[10px]">
                {employee.employmentType}
              </Badge>
              <Badge
                className={`text-[10px] uppercase font-bold ${
                  employee.status === 'active'
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    : employee.status === 'onboarding'
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                }`}
              >
                {employee.status}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {employee.workMode}
              </Badge>
            </div>
          </div>
        </div>

        {/* Tab Selector Buttons */}
        <div className="flex border-b border-border gap-1 overflow-x-auto scrollbar-none">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold uppercase tracking-wide border-b-2 transition-all duration-200 focus:outline-none whitespace-nowrap ${
                  isActive
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Viewports */}
        <div className="py-2 min-h-[300px]">
          {/* 1. Overview Tab */}
          {activeSubTab === 'overview' && (
            <div className="space-y-4">
              <Card className="bg-card/20 border-border/80">
                <CardContent className="pt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground block font-semibold uppercase tracking-wider text-[10px]">
                        Employee ID
                      </span>
                      <span className="font-bold text-foreground">
                        {employee.employeeId || 'EMP-NEW'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block font-semibold uppercase tracking-wider text-[10px]">
                        Joining Date
                      </span>
                      <span className="font-bold text-foreground">
                        {new Date(employee.joiningDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block font-semibold uppercase tracking-wider text-[10px]">
                        Timezone
                      </span>
                      <span className="font-bold text-foreground flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-primary" /> {employee.timezone}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block font-semibold uppercase tracking-wider text-[10px]">
                        Email
                      </span>
                      <span className="font-bold text-foreground flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" /> {employee.email}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Skills Tags */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Certified Skills
                </span>
                {employee.skills?.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No listed skills.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {employee.skills?.map((skill: any) => (
                      <div
                        key={skill.name}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-card/40 text-xs font-semibold"
                      >
                        <span>{skill.name}</span>
                        <span className="text-primary text-[10px] bg-primary/10 px-1.5 rounded-full font-bold">
                          Lvl {skill.proficiency}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action: Terminate / Offboard Employee */}
              {employee.status !== 'terminated' && (
                <div className="pt-6 border-t border-border/40">
                  <Button
                    onClick={handleOffboard}
                    variant="outline"
                    className="w-full border-rose-500/20 text-rose-500 hover:bg-rose-500/10 gap-2 font-bold text-xs"
                  >
                    <Trash2 className="h-4 w-4" />
                    Offboard and Terminate Employee
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* 2. Compensation & Assets Tab */}
          {activeSubTab === 'compensation' && (
            <div className="space-y-6">
              {/* Compensation details */}
              <Card className="bg-card/20 border-border/80">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground block uppercase">
                        Salary (Monthly Rate)
                      </span>
                      <span className="text-xl font-black text-foreground">
                        {employee.compensationMetadata?.masked ? (
                          <span className="text-muted-foreground text-sm font-medium italic">
                            Private/Masked
                          </span>
                        ) : (
                          `${employee.compensationMetadata?.salary?.toLocaleString() || 0} ${
                            employee.compensationMetadata?.currency || 'USD'
                          }`
                        )}
                      </span>
                    </div>
                    <DollarSign className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                </CardContent>
              </Card>

              {/* Assets list */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Allocated Assets
                  </span>
                  <Laptop className="h-4 w-4 text-primary" />
                </div>

                <div className="space-y-2">
                  {(employee.assets || []).filter((a: any) => a.status === 'assigned').length ===
                  0 ? (
                    <p className="text-xs text-muted-foreground italic bg-card/20 p-3 rounded-lg border border-dashed border-border/40 text-center">
                      No active assets allocated.
                    </p>
                  ) : (
                    (employee.assets || [])
                      .filter((a: any) => a.status === 'assigned')
                      .map((asset: any) => (
                        <div
                          key={asset._id}
                          className="flex items-center justify-between p-3 rounded-xl border border-border bg-card/30 text-xs"
                        >
                          <div>
                            <span className="font-semibold block">{asset.name}</span>
                            <span className="text-[10px] text-muted-foreground">
                              Serial: {asset.serialNumber || 'N/A'}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReturnAsset(asset._id)}
                            className="text-xs py-1 border-border hover:bg-card"
                          >
                            Mark Returned
                          </Button>
                        </div>
                      ))
                  )}
                </div>

                {/* Add Asset fields */}
                <div className="p-4 border border-border/80 rounded-xl space-y-3 bg-card/20">
                  <span className="text-xs font-bold text-foreground block uppercase">
                    Allocate New Asset
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Asset Name (e.g. MacBook)"
                      value={newAssetName}
                      onChange={(e) => setNewAssetName(e.target.value)}
                      className="text-xs"
                    />
                    <Input
                      placeholder="Serial Number"
                      value={newAssetSerial}
                      onChange={(e) => setNewAssetSerial(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={handleAddAsset}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs py-2"
                  >
                    Allocate Asset
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* 3. Onboarding Checklist Tab */}
          {activeSubTab === 'checklist' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Onboarding Checklist Template
                </span>
                <select
                  value={template}
                  onChange={(e) => handleUpdateTemplate(e.target.value)}
                  className="bg-card text-foreground border border-border rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary shadow-sm hover:border-primary"
                >
                  <option value="standard">Standard onboarding</option>
                  <option value="developer">💻 Developer Workflow</option>
                  <option value="hr">💼 HR Operations</option>
                  <option value="designer">🎨 Designer Onboarding</option>
                  <option value="contractor">📄 Contractor clearance</option>
                </select>
              </div>

              <div className="space-y-2 mt-3">
                {tasks.map((taskName) => {
                  const isCompleted = !!(employee.onboardingChecklist || {})[taskName];
                  return (
                    <div
                      key={taskName}
                      onClick={() => handleToggleDynamicChecklist(taskName)}
                      className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card/30 hover:bg-card/60 cursor-pointer transition-all duration-200 text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={isCompleted}
                        readOnly
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-0"
                      />
                      <span
                        className={`font-semibold ${isCompleted ? 'line-through text-muted-foreground/85' : 'text-foreground'}`}
                      >
                        {taskName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Emergency Contacts Tab */}
          {activeSubTab === 'emergency' && (
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Primary Emergency Contacts
              </span>

              {employee.emergencyContacts?.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  No emergency contacts registered.
                </p>
              ) : (
                <div className="space-y-3">
                  {employee.emergencyContacts?.map((contact: any, i: number) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl border border-border bg-card/30 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold block text-sm">{contact.name}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {contact.relation}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{contact.phone}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 5. Documents Vault Tab */}
          {activeSubTab === 'documents' && (
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Employment Compliance Vault
              </span>

              {/* Warnings and alerts */}
              <div className="p-3 border border-amber-500/20 bg-amber-500/5 rounded-lg flex items-start gap-2.5 text-xs text-amber-600">
                <AlertTriangle className="h-4.5 w-4.5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Compliance Expiry Alert</span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Government Identification Document is expiring in 90 days. Please remind the
                    staff to renew.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {[
                  {
                    name: 'Signed Employment Contract.pdf',
                    category: 'contracts',
                    date: '2026-01-10',
                    verified: true,
                  },
                  {
                    name: 'Form W-4 (Withholding).pdf',
                    category: 'taxes',
                    date: '2026-01-11',
                    verified: true,
                  },
                  {
                    name: 'Passport Copy - Verified ID.jpg',
                    category: 'identity',
                    date: '2026-01-09',
                    verified: true,
                    warning: true,
                  },
                  {
                    name: 'Direct Deposit Setup Form.pdf',
                    category: 'payroll',
                    date: '2026-01-12',
                    verified: false,
                  },
                ].map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-3 rounded-lg border border-border bg-card/30 text-xs"
                  >
                    <div>
                      <h5 className="font-bold flex items-center gap-1 text-foreground">
                        <FileText className="h-3.5 w-3.5 text-primary" />
                        {doc.name}
                      </h5>
                      <span className="text-[10px] text-muted-foreground font-semibold mt-1 block capitalize">
                        Folder: {doc.category} • Uploaded {doc.date}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          doc.verified
                            ? 'border-emerald-500/30 text-emerald-500'
                            : 'border-amber-500/30 text-amber-500'
                        }
                      >
                        {doc.verified ? 'Verified' : 'Pending Verification'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. Attendance Clocks Tab */}
          {activeSubTab === 'attendanceLogs' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="border border-border p-3 rounded-lg text-center bg-card">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">
                    Consistency
                  </span>
                  <h4 className="text-lg font-black mt-1 text-indigo-500">96.4%</h4>
                </div>
                <div className="border border-border p-3 rounded-lg text-center bg-card">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">
                    Lateness
                  </span>
                  <h4 className="text-lg font-black mt-1 text-amber-500">
                    {employee.attendanceSummary?.lateCount || 0}d
                  </h4>
                </div>
                <div className="border border-border p-3 rounded-lg text-center bg-card">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">
                    Hours Tracked
                  </span>
                  <h4 className="text-lg font-black mt-1 text-emerald-500">
                    {(employee.attendanceSummary?.hoursTracked || 0).toFixed(1)}h
                  </h4>
                </div>
              </div>

              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mt-2">
                Recent shift activity timeline
              </span>

              <div className="space-y-2">
                {[
                  {
                    date: 'May 17, 2026',
                    checkIn: '09:02 AM',
                    checkOut: '06:05 PM',
                    workMode: 'hybrid',
                    hours: 8.5,
                  },
                  {
                    date: 'May 16, 2026',
                    checkIn: '08:55 AM',
                    checkOut: '05:00 PM',
                    workMode: 'remote',
                    hours: 8.08,
                  },
                  {
                    date: 'May 15, 2026',
                    checkIn: '08:50 AM',
                    checkOut: '05:30 PM',
                    workMode: 'remote',
                    hours: 8.67,
                  },
                ].map((log, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-3 rounded-lg border border-border bg-card/20 text-xs"
                  >
                    <div>
                      <span className="font-bold block">{log.date}</span>
                      <span className="text-[10px] text-muted-foreground">
                        In: {log.checkIn} • Out: {log.checkOut} ({log.workMode})
                      </span>
                    </div>
                    <span className="font-black text-foreground">{log.hours}h</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. Leaves Tab */}
          {activeSubTab === 'leaves' && (
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Leave conflicts and balances
              </span>

              <div className="grid grid-cols-3 gap-3">
                <div className="border border-border p-3 rounded-lg text-center bg-card">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">
                    Casual Days
                  </span>
                  <h4 className="text-lg font-bold mt-1 text-foreground">
                    {employee.leaveBalances?.casualDays || 12}
                  </h4>
                </div>
                <div className="border border-border p-3 rounded-lg text-center bg-card">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">
                    Sick Days
                  </span>
                  <h4 className="text-lg font-bold mt-1 text-foreground">
                    {employee.leaveBalances?.sickDays || 10}
                  </h4>
                </div>
                <div className="border border-border p-3 rounded-lg text-center bg-card">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">
                    Paid Days
                  </span>
                  <h4 className="text-lg font-bold mt-1 text-foreground">
                    {employee.leaveBalances?.paidDays || 15}
                  </h4>
                </div>
              </div>

              {/* Conflict indicator forecasting */}
              <div className="p-3 border border-indigo-500/20 bg-indigo-500/5 rounded-lg flex items-start gap-2 text-xs text-indigo-500 mt-2">
                <CheckCircle2 className="h-4.5 w-4.5 text-indigo-500 flex-shrink-0" />
                <div>
                  <span className="font-bold">Leave Overlap Forecast: 0 Conflicts</span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    No other member of the {employee.departmentId?.name || 'Staff'} department has
                    leaves during this employee&apos;s scheduled dates.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 8. Workload & Allocations Tab */}
          {activeSubTab === 'workload' && (
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Workload & Sprint allocations
              </span>

              <div className="border border-border p-4 rounded-xl space-y-3 bg-card hover:border-primary/20 transition-all duration-200">
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <h5 className="font-bold text-foreground">Sprint Capacity utilization</h5>
                    <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider block mt-0.5">
                      ACTIVE PROJECT ASSIGNMENTS
                    </span>
                  </div>
                  <span className="text-xs font-black text-primary">85% Alloc</span>
                </div>
                <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '85%' }} />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Teammate is in healthy utilization limits. Low risk of burnout.
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Active Backlog Tasks
                </span>
                {[
                  {
                    title: 'Implement JWT Token verification protocols',
                    status: 'Active',
                    hours: 12,
                  },
                  {
                    title: 'Conduct workforce database optimization audits',
                    status: 'In Review',
                    hours: 8,
                  },
                ].map((task, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-3 rounded-lg border border-border bg-card/20 text-xs"
                  >
                    <div>
                      <h6 className="font-semibold text-foreground">{task.title}</h6>
                      <span className="text-[10px] text-muted-foreground mt-0.5 block">
                        Estimation: {task.hours}h
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-primary/30 text-primary font-bold text-[9px] uppercase"
                    >
                      {task.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 9. Performance Reviews Tab */}
          {activeSubTab === 'performance' && (
            <div className="space-y-6">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Performance Evaluation Matrix
              </span>

              {/* Inline SVG evaluation chart */}
              <div className="flex items-center gap-4 bg-card/30 p-4 border border-border rounded-xl">
                <TrendingUp className="h-8 w-8 text-primary flex-shrink-0" />
                <div>
                  <h5 className="text-xs font-bold text-foreground">
                    Cumulative performance rating
                  </h5>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-black text-foreground">4.8</span>
                    <span className="text-xs text-muted-foreground font-semibold">
                      out of 5.0 (High Performer)
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit Review Form */}
              <form
                onSubmit={handleAddReview}
                className="p-4 border border-border rounded-xl bg-card/20 space-y-4"
              >
                <span className="text-xs font-bold text-foreground block uppercase">
                  Submit performance evaluation
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase">
                      Score (1 - 5)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={rating}
                      onChange={(e) => setRating(Number(e.target.value))}
                      className="bg-card text-foreground border border-border rounded-lg w-full px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase">
                      Goals Completed (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={goalsReached}
                      onChange={(e) => setGoalsReached(Number(e.target.value))}
                      className="bg-card text-foreground border border-border rounded-lg w-full px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">
                    Evaluation feedback notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Write manager evaluation comments..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="bg-card text-foreground border border-border rounded-lg w-full px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
                  />
                </div>
                <Button
                  type="submit"
                  size="sm"
                  className="w-full gap-1.5 font-bold text-xs uppercase tracking-wide"
                >
                  Submit Evaluation
                </Button>
              </form>
            </div>
          )}

          {/* 10. Audit Trail Logs Tab */}
          {activeSubTab === 'audit' && (
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Centralized HR Security audit trail
              </span>

              <div className="space-y-3">
                {[
                  {
                    title: 'Shift Clock IN punch verified',
                    desc: 'Checked in remote coordinates via browser verified session.',
                    severity: 'success',
                    time: '10 mins ago',
                  },
                  {
                    title: 'Banking configurations altered',
                    desc: 'Direct deposit routing and account details modified securely.',
                    severity: 'warning',
                    time: '2 hours ago',
                  },
                  {
                    title: 'Certified Skills modified',
                    desc: 'Added next.js & TypeScript architecture skills to certification list.',
                    severity: 'info',
                    time: '1 day ago',
                  },
                ].map((trail, idx) => (
                  <div
                    key={idx}
                    className="flex gap-3 border-b border-border/40 pb-3 last:border-0 last:pb-0"
                  >
                    <div
                      className={`h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold ${
                        trail.severity === 'success'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : trail.severity === 'warning'
                            ? 'bg-amber-500/10 text-amber-500'
                            : 'bg-indigo-500/10 text-indigo-500'
                      }`}
                    >
                      •
                    </div>
                    <div>
                      <h6 className="text-xs font-bold text-foreground">{trail.title}</h6>
                      <p className="text-[10px] text-muted-foreground">{trail.desc}</p>
                      <span className="text-[9px] text-muted-foreground font-semibold mt-1 block">
                        {trail.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Offboard/Terminate Confirmation Modal */}
      <ConfirmationModal
        isOpen={isOffboardConfirmOpen}
        onClose={() => setIsOffboardConfirmOpen(false)}
        onConfirm={async () => {
          const success = await deleteEmployee(employee._id);
          setIsOffboardConfirmOpen(false);
          if (success) {
            onClose();
          }
        }}
        title="Terminate Employee Profile"
        message={`Are you absolutely sure you want to offboard and terminate ${employee.fullName}? This will revoke system credentials, archive salary records, and initialize standard compliance offboarding workflows.`}
        confirmLabel="Terminate Employee"
        cancelLabel="Cancel"
        type="danger"
      />
    </Drawer>
  );
}
