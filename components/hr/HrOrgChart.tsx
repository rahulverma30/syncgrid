'use client';

import { useState } from 'react';
import { useHRStore } from '@/store/hrStore';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  Input,
  Modal,
  Select,
} from '@/components/ui';
import { Network, Plus, User, Users, ChevronDown, ChevronRight, FolderOpen } from 'lucide-react';

import { toast } from 'sonner';

export function HrOrgChart() {
  const { departmentsTree, departmentsList, employees, createDepartment, loading } = useHRStore();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    code: '',
    parentDepartmentId: '',
    managerId: '',
    description: '',
  });

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.code) {
      toast.error('Name and Code are required!');
      return;
    }

    const success = await createDepartment({
      name: form.name,
      code: form.code,
      parentDepartmentId: form.parentDepartmentId || null,
      managerId: form.managerId || null,
      description: form.description,
    });

    if (success) {
      setIsAddOpen(false);
      setForm({
        name: '',
        code: '',
        parentDepartmentId: '',
        managerId: '',
        description: '',
      });
    }
  };

  // Recursive Node component to render tree levels
  const TreeNode = ({ node }: { node: any }) => {
    const [collapsed, setCollapsed] = useState(false);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div className="pl-6 border-l border-border/80 relative space-y-2 pt-2">
        {/* Connector line dot */}
        <div className="absolute top-5 left-0 w-3 h-[1px] bg-border/80"></div>

        <div className="flex items-center gap-3">
          {hasChildren && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 hover:bg-card rounded text-muted-foreground hover:text-foreground focus:outline-none"
            >
              {collapsed ? (
                <ChevronRight className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          )}

          <div className="flex-1 max-w-sm p-4 rounded-xl border border-border bg-card/30 hover:bg-card/50 transition-all duration-200">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-sm tracking-tight text-foreground">{node.name}</span>
              <Badge variant="outline" className="text-[10px] uppercase font-bold py-0.5">
                {node.code}
              </Badge>
            </div>
            {node.description && (
              <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                {node.description}
              </p>
            )}

            <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold pt-2 border-t border-border/40 mt-2">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                Mgr: {node.managerId?.name || 'Unassigned'}
              </span>
              <span className="flex items-center gap-1 text-primary">
                <Users className="h-3 w-3" />
                Staff: {node.headcount || 0}
              </span>
            </div>
          </div>
        </div>

        {hasChildren && !collapsed && (
          <div className="space-y-1">
            {node.children.map((child: any) => (
              <TreeNode key={child._id} node={child} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Org Chart Info Block */}
      <Card className="bg-card/40 border-border/80 backdrop-blur-md">
        <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Network className="h-5 w-5 text-primary" />
              Company Reporting Tree
            </h3>
            <p className="text-xs text-muted-foreground">
              Visualize department hierarchies, managers reporting structures, and workforce
              divisions recursively.
            </p>
          </div>
          <Button
            onClick={() => setIsAddOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs py-5 px-4 rounded-xl gap-2 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)] self-start sm:self-center"
          >
            <Plus className="h-4 w-4" />
            Add New Department
          </Button>
        </CardContent>
      </Card>

      {/* Main Hierarchical Tree display */}
      <Card className="bg-card/40 border-border/80 backdrop-blur-md overflow-x-auto">
        <CardContent className="pt-6 min-w-[600px] pb-12">
          {departmentsTree.length === 0 ? (
            <div className="py-20 text-center text-xs text-muted-foreground border border-dashed border-border/40 rounded-2xl bg-card/10 flex flex-col items-center justify-center space-y-2">
              <FolderOpen className="h-8 w-8 text-muted-foreground/60 animate-pulse" />
              <p className="font-semibold text-sm">No departments registered</p>
              <p className="max-w-xs">
                Seeding the HR database will automatically configure your organizational structures.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {departmentsTree.map((rootNode) => (
                <div key={rootNode._id} className="space-y-1">
                  <div className="flex items-center gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5 max-w-sm">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      ROOT
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground leading-none">
                        {rootNode.name}
                      </h4>
                      <p className="text-[10px] text-muted-foreground font-medium pt-1">
                        Code: {rootNode.code} | Manager: {rootNode.managerId?.name || 'Unassigned'}
                      </p>
                    </div>
                  </div>
                  {rootNode.children &&
                    rootNode.children.map((child: any) => (
                      <TreeNode key={child._id} node={child} />
                    ))}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Department Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Register New Department">
        <form onSubmit={handleCreateDept} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Department Name
              </label>
              <Input
                placeholder="Product Operations"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Department Code
              </label>
              <Input
                placeholder="PROD"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                required
                className="text-xs"
              />
            </div>
          </div>

          <div>
            <Select
              label="Parent Department"
              value={form.parentDepartmentId}
              onChange={(value) => setForm({ ...form, parentDepartmentId: value })}
              options={[
                { value: '', label: 'None (Make Root Department)' },
                ...departmentsList.map((d) => ({
                  value: d._id,
                  label: d.name,
                })),
              ]}
            />
          </div>

          <div>
            <Select
              label="Manager"
              value={form.managerId}
              onChange={(value) => setForm({ ...form, managerId: value })}
              options={[
                { value: '', label: 'Select Manager...' },
                ...employees.map((emp) => ({
                  value: emp.userId?._id || '',
                  label: emp.fullName,
                })),
              ]}
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
              Description
            </label>
            <Input
              placeholder="Brief description of department scope..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
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
              disabled={loading.createDept}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs px-4"
            >
              Register Department
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
