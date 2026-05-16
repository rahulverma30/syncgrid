'use client';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageHeader,
} from '@/components/ui';
import { useCommandPaletteStore } from '@/store';
import { Boxes, Command, Database, LockKeyhole, PanelLeft, Sparkles } from 'lucide-react';

const foundations = [
  {
    title: 'Application Shell',
    description:
      'Responsive dashboard frame with route-aware navigation, breadcrumbs, and page containers.',
    icon: PanelLeft,
  },
  {
    title: 'Reusable UI System',
    description:
      'Shared primitives for forms, dialogs, alerts, tables, loading states, and empty states.',
    icon: Sparkles,
  },
  {
    title: 'State Infrastructure',
    description:
      'Zustand stores for sidebar, theme, notifications, modals, and command palette behavior.',
    icon: Database,
  },
  {
    title: 'Access Ready',
    description: 'Navigation config is role-aware and prepared for future enterprise permissions.',
    icon: LockKeyhole,
  },
];

export default function DashboardPage() {
  const { togglePalette } = useCommandPaletteStore();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Module 1"
        title="Enterprise Foundation"
        description="Core architecture for SyncGrid before CRM, projects, finance, HR, and analytics modules are added."
        actions={
          <Button variant="outline" onClick={togglePalette}>
            <Command className="mr-2 h-4 w-4" />
            Command K
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {foundations.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.title} interactive>
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge variant="secondary">Ready</Badge>
                </div>
                <div>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scalable Architecture Map</CardTitle>
          <CardDescription>
            The foundation is intentionally module-neutral and ready for future feature domains.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              'App Router route groups',
              'Provider composition',
              'Role-ready navigation config',
              'Command palette registry',
              'Modal and drawer primitives',
              'Reusable TanStack table',
            ].map((label) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-md border border-border bg-background px-4 py-3 text-sm"
              >
                <Boxes className="h-4 w-4 text-muted-foreground" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
