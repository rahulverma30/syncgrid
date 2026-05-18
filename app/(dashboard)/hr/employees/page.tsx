'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PageHeader,
  Card,
  CardContent,
  Button,
  Input,
  LoadingSpinner,
  ConfirmationModal,
} from '@/components/ui';
import {
  Users,
  Search,
  Filter,
  Plus,
  Briefcase,
  DollarSign,
  Calendar,
  Trash2,
  Eye,
  Edit2,
  Download,
  Building,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface Employee {
  _id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  salary: number;
  status: string;
  startDate: string;
  createdAt: string;
}

export default function HREmployeesPage() {
  const [mounted, setMounted] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [deptFilter, setDeptFilter] = useState('');

  // Delete confirm modal states
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [employeeToDeleteId, setEmployeeToDeleteId] = useState<string | null>(null);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setEmployees([
        {
          _id: 'e1',
          name: 'Harvey Dent',
          role: 'Legal Chief Specialist',
          department: 'Legal',
          email: 'dent@syncgrid.co',
          phone: '312-555-0105',
          salary: 145000,
          status: 'active',
          startDate: '2025-01-10',
          createdAt: new Date().toISOString(),
        },
        {
          _id: 'e2',
          name: 'Selina Kyle',
          role: 'Strategic Acquisition Manager',
          department: 'Operations',
          email: 'kyle@syncgrid.co',
          phone: '212-555-0177',
          salary: 115000,
          status: 'active',
          startDate: '2025-03-15',
          createdAt: new Date().toISOString(),
        },
        {
          _id: 'e3',
          name: 'Pamela Isley',
          role: 'Bio-diversity Lead Research',
          department: 'Research',
          email: 'isley@syncgrid.co',
          phone: '415-555-0190',
          salary: 125000,
          status: 'on-leave',
          startDate: '2025-02-01',
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      toast.error('Failed to sync employee directory.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    fetchEmployees();
  }, []);

  const handleRowSelect = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedRows.length === filteredEmployees.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredEmployees.map((e) => e._id));
    }
  };

  const handleDeleteEmployee = (id: string) => {
    setEmployeeToDeleteId(id);
    setIsDeleteConfirmOpen(true);
  };

  const handleBulkDelete = () => {
    setIsBulkDeleteConfirmOpen(true);
  };

  const handleExportCSV = () => {
    const headers = [
      'Full Name',
      'Role',
      'Department',
      'Email',
      'Phone',
      'Salary ($)',
      'Status',
      'Start Date',
    ];
    const rows = filteredEmployees.map((e) => [
      e.name,
      e.role,
      e.department,
      e.email,
      e.phone,
      e.salary,
      e.status,
      e.startDate,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((val) => `"${val}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `syncgrid_hr_employees_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Employee directory exported successfully.');
  };

  const filteredEmployees = employees.filter((e) => {
    const matchesSearch =
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.role.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = deptFilter ? e.department === deptFilter : true;
    const matchesStatus = statusFilter ? e.status === statusFilter : true;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const totalPayroll = filteredEmployees.reduce((acc, curr) => acc + (curr.salary || 0), 0);
  const avgSalary =
    filteredEmployees.length > 0 ? Math.round(totalPayroll / filteredEmployees.length) : 0;

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Human Resources Infrastructure"
        title="HR Employees Directory"
        description="Verify corporate headcounts, manage department assignments, review contract salary bands, and track active statuses."
        actions={
          <div className="flex items-center gap-2">
            <Button
              onClick={handleExportCSV}
              variant="outline"
              size="sm"
              className="h-9 hover:bg-accent/40 text-xs gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
            <Link href="/hr/employees/create">
              <Button variant="default" size="sm" className="h-9 text-xs gap-1.5">
                <Plus className="h-4 w-4" />
                Add Employee
              </Button>
            </Link>
          </div>
        }
      />

      {/* KPI stats */}
      <div className="grid gap-4 sm:grid-cols-3 select-none">
        <Card className="bg-card/40 border border-border/60 p-5 rounded-2xl backdrop-blur-md">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Headcount</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <h3 className="text-2xl font-black font-mono text-white mt-1.5">{employees.length}</h3>
          <p className="text-[10px] text-slate-400 mt-1">Active full-time specialists</p>
        </Card>

        <Card className="bg-card/40 border border-border/60 p-5 rounded-2xl backdrop-blur-md">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Combined Salary Liability
            </span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-black font-mono text-emerald-400 mt-1.5">
            ${totalPayroll.toLocaleString()}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">Annual baseline payroll exposure</p>
        </Card>

        <Card className="bg-card/40 border border-border/60 p-5 rounded-2xl backdrop-blur-md">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Avg Annual Pay Rate
            </span>
            <CheckCircle2 className="w-4 h-4 text-purple-500" />
          </div>
          <h3 className="text-2xl font-black font-mono text-purple-400 mt-1.5">
            ${avgSalary.toLocaleString()}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">Specialist salary rate bounds</p>
        </Card>
      </div>

      {/* Filters and Control bar */}
      <Card className="bg-card/30 border border-border/60 p-4 rounded-2xl backdrop-blur-sm">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employee name or role..."
              className="pl-8 h-9 text-xs bg-background/40"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-1.5 bg-background/30 px-3 py-1.5 rounded-xl border border-border/40">
              <Building className="h-3 w-3 text-slate-400" />
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="bg-transparent border-0 text-[10px] font-bold uppercase tracking-wider text-slate-300 focus:ring-0 outline-none cursor-pointer"
              >
                <option value="" className="bg-slate-900">
                  All Departments
                </option>
                <option value="Legal" className="bg-slate-900">
                  Legal
                </option>
                <option value="Operations" className="bg-slate-900">
                  Operations
                </option>
                <option value="Research" className="bg-slate-900">
                  Research
                </option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-background/30 px-3 py-1.5 rounded-xl border border-border/40">
              <Filter className="h-3 w-3 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent border-0 text-[10px] font-bold uppercase tracking-wider text-slate-300 focus:ring-0 outline-none cursor-pointer"
              >
                <option value="" className="bg-slate-900">
                  All Statuses
                </option>
                <option value="active" className="bg-slate-900">
                  Active
                </option>
                <option value="on-leave" className="bg-slate-900">
                  On Leave
                </option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Directory table grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <LoadingSpinner className="h-8 w-8 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground animate-pulse font-bold tracking-wider uppercase">
            Syncing employee directory...
          </p>
        </div>
      ) : (
        <Card className="bg-card/40 border border-border/60 rounded-2xl overflow-hidden backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-background/20 select-none text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={
                        selectedRows.length === filteredEmployees.length &&
                        filteredEmployees.length > 0
                      }
                      onChange={handleSelectAll}
                      className="rounded border-border/60 text-primary focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4">Employee Full Name</th>
                  <th className="py-3.5 px-4">Role Title</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Salary Liability</th>
                  <th className="py-3.5 px-4">Start Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-xs">
                <AnimatePresence mode="popLayout">
                  {filteredEmployees.map((e) => (
                    <motion.tr
                      key={e._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`hover:bg-slate-900/10 transition-colors ${
                        selectedRows.includes(e._id) ? 'bg-primary/5' : ''
                      }`}
                    >
                      <td className="py-4 px-4">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(e._id)}
                          onChange={() => handleRowSelect(e._id)}
                          className="rounded border-border/60 text-primary focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-white text-sm">{e.name}</div>
                        <div className="flex items-center gap-2 mt-0.5 text-slate-400 text-[10px]">
                          <span>{e.email}</span>
                          <span>•</span>
                          <span>{e.phone}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-300">{e.role}</td>
                      <td className="py-4 px-4">
                        <span className="inline-flex bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider">
                          {e.department}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono font-bold text-emerald-400">
                        ${e.salary?.toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-slate-400">{e.startDate}</td>
                      <td className="py-4 px-4 uppercase font-bold tracking-wider text-[10px]">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full border ${
                            e.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                          }`}
                        >
                          {e.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/hr/employees/${e._id}`}>
                            <button
                              title="View Profile Details"
                              className="p-1.5 rounded-lg border border-border/60 hover:bg-primary/10 text-slate-400 hover:text-primary transition-all"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          </Link>
                          <Link href={`/hr/employees/${e._id}/edit`}>
                            <button
                              title="Edit employee"
                              className="p-1.5 rounded-lg border border-border/60 hover:bg-blue-500/10 text-slate-400 hover:text-blue-400 transition-all"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                          </Link>
                          <button
                            onClick={() => handleDeleteEmployee(e._id)}
                            title="Delete record"
                            className="p-1.5 rounded-lg border border-border/60 hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Bulk actions */}
      <AnimatePresence>
        {selectedRows.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-slate-900 border border-border p-3.5 rounded-2xl shadow-2xl select-none"
          >
            <span className="text-xs font-bold text-slate-300">
              {selectedRows.length} records selected
            </span>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleBulkDelete}
                variant="destructive"
                size="sm"
                className="h-8 text-xs gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Selected
              </Button>
              <Button
                onClick={() => setSelectedRows([])}
                variant="outline"
                size="sm"
                className="h-8 text-xs"
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Single Employee Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() => {
          if (employeeToDeleteId) {
            setEmployees(employees.filter((e) => e._id !== employeeToDeleteId));
            toast.success('Employee record permanently deleted.');
          }
          setIsDeleteConfirmOpen(false);
        }}
        title="Delete Employee Record"
        message="Are you absolutely sure you want to permanently delete this employee profile? This will remove them from directory payroll calculations."
        confirmLabel="Delete Profile"
        cancelLabel="Cancel"
        type="danger"
      />

      {/* Bulk Employees Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isBulkDeleteConfirmOpen}
        onClose={() => setIsBulkDeleteConfirmOpen(false)}
        onConfirm={() => {
          setEmployees(employees.filter((e) => !selectedRows.includes(e._id)));
          setSelectedRows([]);
          setIsBulkDeleteConfirmOpen(false);
          toast.success('Selected employee records deleted.');
        }}
        title="Delete Selected Profiles"
        message={`Are you sure you want to permanently delete all ${selectedRows.length} selected employee records?`}
        confirmLabel="Delete Selected"
        cancelLabel="Cancel"
        type="danger"
      />
    </div>
  );
}
