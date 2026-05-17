'use client';

import { useState } from 'react';
import { useHRStore } from '@/store/hrStore';
import { Button, Badge, Input, Modal } from '@/components/ui';
import { Users, Search, Plus, Mail, Phone, ChevronRight } from 'lucide-react';
import { EmployeeDetailModal } from './EmployeeDetailModal';

export function HrDirectory() {
  const { employees, departmentsList, createEmployee, loading } = useHRStore();

  // Search and Filter states
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modeFilter, setModeFilter] = useState('');

  // Add Employee Modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    designation: '',
    departmentId: '',
    employmentType: 'full-time',
    workMode: 'remote',
    salary: 5000,
    skills: '', // Comma separated to parse
  });

  // Selected Employee details drawer state
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);

  // Filter employees array locally to avoid unnecessary database queries on typing
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.fullName.toLowerCase().includes(search.toLowerCase()) ||
      (emp.designation && emp.designation.toLowerCase().includes(search.toLowerCase())) ||
      (emp.employeeId && emp.employeeId.toLowerCase().includes(search.toLowerCase()));

    const matchesDept =
      !deptFilter || (emp.departmentId && emp.departmentId._id.toString() === deptFilter);
    const matchesStatus = !statusFilter || emp.status === statusFilter;
    const matchesMode = !modeFilter || emp.workMode === modeFilter;

    return matchesSearch && matchesDept && matchesStatus && matchesMode;
  });

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.email) {
      alert('Full Name and Email are required!');
      return;
    }

    // Parse comma-separated skills
    const skillList = form.skills
      ? form.skills.split(',').map((s) => ({ name: s.trim(), proficiency: 3 }))
      : [];

    const success = await createEmployee({
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      designation: form.designation,
      departmentId: form.departmentId || null,
      employmentType: form.employmentType,
      workMode: form.workMode,
      skills: skillList,
      compensationMetadata: {
        salary: Number(form.salary),
        currency: 'USD',
        payPeriod: 'monthly',
      },
    });

    if (success) {
      setIsAddOpen(false);
      setForm({
        fullName: '',
        email: '',
        phone: '',
        designation: '',
        departmentId: '',
        employmentType: 'full-time',
        workMode: 'remote',
        salary: 5000,
        skills: '',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Filter Header Controls */}
      <div className="bg-card/40 border border-border rounded-xl backdrop-blur-md p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Input Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/60" />
            <Input
              placeholder="Fuzzy search staff, titles, EMP ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-sm focus:border-primary border-border bg-card/20 placeholder:text-muted-foreground/60"
            />
          </div>

          {/* Mode & Action Controls */}
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsAddOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs py-5 px-4 rounded-xl gap-2 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]"
            >
              <Plus className="h-4 w-4" />
              Add New Employee
            </Button>
          </div>
        </div>

        {/* Granular Filters Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border/40">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
              Filter Department
            </label>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full bg-card/20 border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary"
            >
              <option value="" className="bg-card text-foreground">
                All Departments
              </option>
              {departmentsList.map((d) => (
                <option key={d._id} value={d._id} className="bg-card text-foreground">
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
              Filter Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-card/20 border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary"
            >
              <option value="" className="bg-card text-foreground">
                All Statuses
              </option>
              <option value="active" className="bg-card text-foreground">
                Active
              </option>
              <option value="onboarding" className="bg-card text-foreground">
                Onboarding
              </option>
              <option value="suspended" className="bg-card text-foreground">
                Suspended
              </option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
              Filter Work Mode
            </label>
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="w-full bg-card/20 border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary"
            >
              <option value="" className="bg-card text-foreground">
                All Work Modes
              </option>
              <option value="remote" className="bg-card text-foreground">
                Remote
              </option>
              <option value="hybrid" className="bg-card text-foreground">
                Hybrid
              </option>
              <option value="office" className="bg-card text-foreground">
                Office
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Directory Grid Employee Cards */}
      {filteredEmployees.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 border border-dashed border-border/40 rounded-2xl bg-card/10">
          <Users className="h-12 w-12 text-muted-foreground/40" />
          <div className="space-y-1">
            <h3 className="text-base font-bold tracking-tight">No Employees Found</h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              Adjust your search keywords or filter options to discover matching team profiles.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((emp) => (
            <div
              key={emp._id}
              onClick={() => setSelectedEmpId(emp._id)}
              className="bg-card/30 hover:bg-card/60 border border-border hover:border-primary/40 rounded-xl cursor-pointer transition-all duration-300 relative overflow-hidden group shadow-[0_4px_12px_rgba(0,0,0,0.02)] p-6 space-y-4"
            >
              {/* Top highlight glow dot on active employees */}
              <div
                className={`absolute top-0 left-0 right-0 h-[2px] transition-all duration-300 ${
                  emp.status === 'active'
                    ? 'bg-emerald-500/30 group-hover:bg-emerald-500'
                    : emp.status === 'onboarding'
                      ? 'bg-amber-500/30 group-hover:bg-amber-500'
                      : 'bg-rose-500/30 group-hover:bg-rose-500'
                }`}
              ></div>

              {/* Details Section */}
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg border border-primary/20">
                  {emp.fullName.charAt(0)}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-sm tracking-tight group-hover:text-primary transition-all duration-200 line-clamp-1 text-foreground">
                      {emp.fullName}
                    </h4>
                    <div
                      className={`h-2 w-2 rounded-full ${
                        emp.status === 'active'
                          ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                          : emp.status === 'onboarding'
                            ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                            : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                      }`}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {emp.designation || 'Staff Member'}
                  </p>
                </div>
              </div>

              {/* Tags Metadata */}
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className="text-[9px] font-semibold py-0">
                  {emp.departmentId?.name || 'Unassigned'}
                </Badge>
                <Badge variant="outline" className="text-[9px] font-semibold py-0">
                  {emp.employmentType}
                </Badge>
                <Badge variant="outline" className="text-[9px] font-semibold py-0">
                  {emp.workMode}
                </Badge>
              </div>

              {/* Email and Phone */}
              <div className="space-y-1.5 border-t border-border/30 pt-3 text-[11px] text-muted-foreground font-medium">
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground/60" />
                  <span className="truncate">{emp.email}</span>
                </div>
                {emp.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground/60" />
                    <span>{emp.phone}</span>
                  </div>
                )}
              </div>

              {/* View Details CTA */}
              <div className="flex justify-end pt-1 border-t border-border/30 mt-1">
                <span className="text-[10px] font-bold text-primary flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-all duration-200">
                  OPEN FILE <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Employee sliding file drawer */}
      <EmployeeDetailModal
        employeeId={selectedEmpId}
        isOpen={selectedEmpId !== null}
        onClose={() => setSelectedEmpId(null)}
      />

      {/* Add Employee Form Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Onboard New Team Member">
        <form onSubmit={handleAddEmployee} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Full Name
              </label>
              <Input
                placeholder="Sarah Jenkins"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
                className="text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Email
              </label>
              <Input
                type="email"
                placeholder="sarah.j@syncgrid.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Phone
              </label>
              <Input
                placeholder="+1 (555) 234-9876"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Designation
              </label>
              <Input
                placeholder="Senior Architect"
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Department
              </label>
              <select
                value={form.departmentId}
                onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                className="w-full bg-card/20 border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary"
              >
                <option value="" className="bg-card text-foreground">
                  Select Department...
                </option>
                {departmentsList.map((d) => (
                  <option key={d._id} value={d._id} className="bg-card text-foreground">
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Employment Type
              </label>
              <select
                value={form.employmentType}
                onChange={(e) => setForm({ ...form, employmentType: e.target.value })}
                className="w-full bg-card/20 border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary"
              >
                <option value="full-time" className="bg-card text-foreground">
                  Full Time
                </option>
                <option value="part-time" className="bg-card text-foreground">
                  Part Time
                </option>
                <option value="contractor" className="bg-card text-foreground">
                  Contractor
                </option>
                <option value="intern" className="bg-card text-foreground">
                  Intern
                </option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Work Mode
              </label>
              <select
                value={form.workMode}
                onChange={(e) => setForm({ ...form, workMode: e.target.value })}
                className="w-full bg-card/20 border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary"
              >
                <option value="remote" className="bg-card text-foreground">
                  Remote
                </option>
                <option value="hybrid" className="bg-card text-foreground">
                  Hybrid
                </option>
                <option value="office" className="bg-card text-foreground">
                  Office
                </option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Salary (Monthly USD)
              </label>
              <Input
                type="number"
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: Number(e.target.value) })}
                className="text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
              Skills (Comma-separated)
            </label>
            <Input
              placeholder="TypeScript, React, Node.js"
              value={form.skills}
              onChange={(e) => setForm({ ...form, skills: e.target.value })}
              className="text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddOpen(false)}
              className="text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading.editEmployee}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs px-4"
            >
              Onboard Employee
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
