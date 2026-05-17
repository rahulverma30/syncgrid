'use client';

import { useState, useEffect } from 'react';
import { useHRStore } from '@/store/hrStore';
import { Drawer, Card, CardContent, Button, Badge, Input, Select } from '@/components/ui';
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
} from 'lucide-react';
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

  // Reset overrides if the employeeId prop changes
  if (employeeId !== prevEmployeeId) {
    setPrevEmployeeId(employeeId);
    setChecklistOverrides({});
  }

  // Asset allocation states
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetSerial, setNewAssetSerial] = useState('');

  if (!employee) return null;

  const dbChecklist = employee.onboardingChecklist || {};
  const checklist = {
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

  const handleOffboard = async () => {
    if (
      confirm(`Are you absolutely sure you want to offboard and terminate ${employee.fullName}?`)
    ) {
      const success = await deleteEmployee(employee._id);
      if (success) {
        onClose();
      }
    }
  };

  const subTabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'compensation', label: 'Compensation & Assets', icon: DollarSign },
    { id: 'checklist', label: 'Onboarding Checklist', icon: CheckSquare },
    { id: 'emergency', label: 'Emergency Contacts', icon: Phone },
  ];

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
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all duration-200 focus:outline-none ${
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
                      <span className="text-muted-foreground block font-medium">Employee ID</span>
                      <span className="font-bold text-foreground">
                        {employee.employeeId || 'EMP-NEW'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block font-medium">Joining Date</span>
                      <span className="font-bold text-foreground">
                        {new Date(employee.joiningDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block font-medium">Timezone</span>
                      <span className="font-bold text-foreground flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-primary" /> {employee.timezone}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block font-medium">Email</span>
                      <span className="font-bold text-foreground flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" /> {employee.email}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Skills Tags */}
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                      <span className="text-xs text-muted-foreground block font-medium">
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
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                  <span className="text-xs font-semibold text-foreground block">
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
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                Checklist Completion Status
              </span>

              <div className="space-y-3">
                {Object.entries(checklist).map(([key, completed]) => (
                  <div
                    key={key}
                    onClick={() => handleToggleChecklist(key)}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card/30 hover:bg-card/60 cursor-pointer transition-all duration-200 text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={completed}
                      readOnly
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-0"
                    />
                    <span
                      className={`font-semibold ${completed ? 'line-through text-muted-foreground/80' : 'text-foreground'}`}
                    >
                      {key}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Emergency Contacts Tab */}
          {activeSubTab === 'emergency' && (
            <div className="space-y-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                Primary Emergency Relatives
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
                        <span className="font-semibold block text-sm">{contact.name}</span>
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
        </div>
      </div>
    </Drawer>
  );
}
