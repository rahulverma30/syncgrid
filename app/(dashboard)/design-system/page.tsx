'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PageWrapper,
  ContentContainer,
  DashboardGrid,
  SplitLayout,
  ScrollRegion,
  SectionContainer,
} from '@/components/ui/layout-containers';
import {
  PageTitle,
  SectionTitle,
  MutedText,
  CaptionText,
  MetricText,
  GradientText,
} from '@/components/ui/typography';
import {
  AnalyticsCard,
  MetricCard,
  ActivityCard,
  InteractiveCard,
  GlassCard,
} from '@/components/ui/advanced-card';
import { AdvancedButton, IconButton, SplitButton } from '@/components/ui/advanced-button';
import {
  DatePicker,
  DateRangePicker,
  SearchableSelect,
  AsyncSelect,
  TagInput,
  PhoneInput,
  CurrencyInput,
  FileUploader,
  MultiSelect,
  RichTextarea,
} from '@/components/ui/advanced-form';
import { EnterpriseTableToolbar } from '@/components/ui/enterprise-table';
import {
  CenteredModal,
  DrawerModal,
  FullscreenModal,
  ConfirmationModal,
} from '@/components/ui/modal-system';
import {
  NotificationDropdown,
  ActivityTimeline,
  NotificationItem,
  ActivityTimelineItem,
} from '@/components/ui/notification-center';
import {
  CardSkeleton,
  TableSkeleton,
  ChartSkeleton,
  PremiumEmptyState,
} from '@/components/ui/skeletons-and-states';
import { KPIWidget, ProgressCircleWidget, DynamicMetricWidget } from '@/components/ui/widgets';
import {
  AreaChartWrapper,
  BarChartWrapper,
  LineChartWrapper,
  PieChartWrapper,
} from '@/components/ui/charts';
import {
  Eye,
  Settings,
  Share2,
  Trash2,
  AlertTriangle,
  UserCheck,
  Calendar,
  Layers,
  Sparkles,
  PlayCircle,
} from 'lucide-react';
import { toast } from 'sonner';

export default function DesignSystemPlayground() {
  const [activeTab, setActiveTab] = useState<
    'tokens' | 'buttons' | 'forms' | 'tables' | 'modals' | 'analytics'
  >('tokens');

  // --- FORM PLAYGROUND STATES ---
  const [selectVal, setSelectVal] = useState('');
  const [asyncVal, setAsyncVal] = useState('');
  const [tags, setTags] = useState<string[]>(['NextJS', 'Tailwind', 'SaaS']);
  const [startDate, setStartDate] = useState('2026-05-17');
  const [endDate, setEndDate] = useState('2026-05-24');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedTools, setSelectedTools] = useState<string[]>(['recharts']);
  const [textareaVal, setTextareaVal] = useState(
    '**SyncGrid Premium ERP** integrates complex React Hook Form boundaries.'
  );

  // --- MODALS PLAYGROUND STATES ---
  const [isCenteredOpen, setIsCenteredOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // --- TABLES PLAYGROUND STATES ---
  const [tableSearch, setTableSearch] = useState('');
  const [selectedTableRows, setSelectedTableRows] = useState(0);
  const [activeTableFilters, setActiveTableFilters] = useState<Record<string, string>>({
    role: '',
    status: '',
  });

  // --- NOTIFICATIONS PLAYGROUND STATES ---
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'n1',
      title: 'Database connection verified',
      description: 'Mongoose connection pooling initialized with 10 max sockets.',
      time: 'Just now',
      read: false,
      type: 'success',
    },
    {
      id: 'n2',
      title: 'Zod Validator warning',
      description: 'AUTH_SECRET parsed close to limit restrictions.',
      time: '5 mins ago',
      read: false,
      type: 'warning',
    },
  ]);

  const handleMarkRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  // --- MOCK DATABASE SEARCH FOR ASYNC SELECT ---
  const loadAsyncOptions = async (query: string) => {
    return [
      { value: 'db-1', label: 'Stripe Integration Layer' },
      { value: 'db-2', label: 'Vercel Serverless Gateway' },
      { value: 'db-3', label: 'MongoDB Replica Primary' },
    ].filter((opt) => opt.label.toLowerCase().includes(query.toLowerCase()));
  };

  // --- MOCK CHART DATA ---
  const sampleAnalyticsData = [
    { name: 'Jan', revenue: 4000, expenses: 2400 },
    { name: 'Feb', revenue: 4500, expenses: 2800 },
    { name: 'Mar', revenue: 5100, expenses: 3100 },
    { name: 'Apr', revenue: 6000, expenses: 3500 },
    { name: 'May', revenue: 7800, expenses: 4000 },
  ];

  const sampleRatioData = [
    { name: 'Enterprise CRM', value: 450 },
    { name: 'Project Boards', value: 300 },
    { name: 'HR Hub', value: 150 },
  ];

  // --- MOCK TIMELINE DATA ---
  const sampleTimeline: ActivityTimelineItem[] = [
    {
      id: 't1',
      title: 'Module 3 Architecture verified',
      description: 'Complete premium design token definitions established in globals.css config.',
      time: '10:14 AM',
      user: { name: 'Rahul Verma' },
      type: 'audit',
    },
    {
      id: 't2',
      title: 'Interactive Playground created',
      description: 'Visual testing playground configured under /dashboard/design-system.',
      time: '11:45 AM',
      user: { name: 'Principal SaaS Architect' },
      type: 'status',
    },
  ];

  return (
    <PageWrapper>
      <ContentContainer>
        {/* Page Title & Notifications Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border/80 pb-6 gap-4">
          <div className="space-y-1.5 text-left">
            <GradientText animate className="text-3xl sm:text-4xl md:text-5xl tracking-tight">
              Design Infrastructure
            </GradientText>
            <MutedText>
              Premium reusable Agency ERP component registry. Verify visual standards and tokens.
            </MutedText>
          </div>
          <div className="flex items-center gap-3">
            <NotificationDropdown
              notifications={notifications}
              onMarkRead={handleMarkRead}
              onMarkAllRead={handleMarkAllRead}
              onClearAll={handleClearNotifications}
            />
            <AdvancedButton
              variant="default"
              icon={<Sparkles className="h-4.5 w-4.5" />}
              onClick={() => toast.success('Module 3 UI Tokens Synchronized!')}
            >
              Sync Tokens
            </AdvancedButton>
          </div>
        </div>

        {/* Responsive Tab Panel */}
        <div className="flex items-center border-b border-border/80 overflow-x-auto scrollbar-hide py-1 gap-2 select-none">
          {(
            [
              { id: 'tokens', label: 'Tokens & Typography' },
              { id: 'buttons', label: 'Buttons & Cards' },
              { id: 'forms', label: 'Form Controls' },
              { id: 'tables', label: 'Grids & Skeletons' },
              { id: 'modals', label: 'Modal Overlays' },
              { id: 'analytics', label: 'KPIs & Visuals' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'whitespace-nowrap px-4 py-2 text-xs sm:text-sm font-bold tracking-tight rounded-md transition-all select-none',
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sandbox Content Panels */}
        <div className="min-h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {/* --- TOKENS & TYPOGRAPHY PANEL --- */}
              {activeTab === 'tokens' && (
                <div className="space-y-8 text-left">
                  <SectionContainer>
                    <SectionTitle>Design Token Grid</SectionTitle>
                    <MutedText>
                      Tailwind semantic custom layers synced under strict guidelines.
                    </MutedText>
                    <DashboardGrid cols={4}>
                      <GlassCard>
                        <div className="h-10 w-full bg-primary rounded mb-3 flex items-center justify-center text-primary-foreground font-mono text-xs font-bold">
                          Primary
                        </div>
                        <h4 className="text-xs font-bold uppercase text-muted-foreground leading-none">
                          Primary HSL
                        </h4>
                        <p className="text-xs font-mono font-bold mt-1 text-foreground leading-none">
                          var(--primary)
                        </p>
                      </GlassCard>
                      <GlassCard>
                        <div className="h-10 w-full bg-secondary rounded mb-3 flex items-center justify-center text-secondary-foreground font-mono text-xs font-bold border border-border/40">
                          Secondary
                        </div>
                        <h4 className="text-xs font-bold uppercase text-muted-foreground leading-none">
                          Secondary HSL
                        </h4>
                        <p className="text-xs font-mono font-bold mt-1 text-foreground leading-none">
                          var(--secondary)
                        </p>
                      </GlassCard>
                      <GlassCard>
                        <div className="h-10 w-full bg-card rounded mb-3 flex items-center justify-center text-card-foreground font-mono text-xs font-bold border border-border/60">
                          Card HSL
                        </div>
                        <h4 className="text-xs font-bold uppercase text-muted-foreground leading-none">
                          Card Background
                        </h4>
                        <p className="text-xs font-mono font-bold mt-1 text-foreground leading-none">
                          var(--card)
                        </p>
                      </GlassCard>
                      <GlassCard>
                        <div className="h-10 w-full rounded mb-3 border-2 border-dashed border-border flex items-center justify-center text-muted-foreground font-mono text-xs font-bold">
                          Border
                        </div>
                        <h4 className="text-xs font-bold uppercase text-muted-foreground leading-none">
                          Border Token
                        </h4>
                        <p className="text-xs font-mono font-bold mt-1 text-foreground leading-none">
                          var(--border)
                        </p>
                      </GlassCard>
                    </DashboardGrid>
                  </SectionContainer>

                  <SectionContainer>
                    <SectionTitle>Typography Hierarchy</SectionTitle>
                    <MutedText>Standard elements offering fluid typography bounds.</MutedText>
                    <div className="border border-border/60 rounded-xl p-6 bg-card/40 space-y-6">
                      <div className="space-y-1">
                        <CaptionText>PageTitle heading component</CaptionText>
                        <PageTitle className="text-2xl sm:text-3xl md:text-4xl text-left">
                          SyncGrid ERP Framework
                        </PageTitle>
                      </div>
                      <div className="space-y-1">
                        <CaptionText>SectionTitle heading component</CaptionText>
                        <SectionTitle>Metric Analytics Hub</SectionTitle>
                      </div>
                      <div className="space-y-1">
                        <CaptionText>MetricText extra-large bold number</CaptionText>
                        <MetricText>$4,850,290.00</MetricText>
                      </div>
                      <div className="space-y-1">
                        <CaptionText>MutedText annotation helper</CaptionText>
                        <MutedText>
                          Provides description logs detailing dashboard components.
                        </MutedText>
                      </div>
                      <div className="space-y-1">
                        <CaptionText>GradientText highlighting premium metrics</CaptionText>
                        <div>
                          <GradientText className="text-xl">
                            Building premium Vercel and Stripe Dashboard frameworks.
                          </GradientText>
                        </div>
                      </div>
                    </div>
                  </SectionContainer>
                </div>
              )}

              {/* --- BUTTONS & CARDS PANEL --- */}
              {activeTab === 'buttons' && (
                <div className="space-y-8 text-left">
                  <SectionContainer>
                    <SectionTitle>Tactile Button Matrix</SectionTitle>
                    <MutedText>Framer-motion spring-based interactive tap targets.</MutedText>
                    <div className="border border-border/60 rounded-xl p-6 bg-card/40 flex flex-wrap gap-4 items-center">
                      <AdvancedButton variant="default">Primary Spring</AdvancedButton>
                      <AdvancedButton variant="secondary">Secondary Button</AdvancedButton>
                      <AdvancedButton variant="outline">Outline Trigger</AdvancedButton>
                      <AdvancedButton variant="destructive">Destructive Action</AdvancedButton>
                      <AdvancedButton variant="ghost">Ghost Button</AdvancedButton>
                      <AdvancedButton variant="default" isLoading>
                        Loading State
                      </AdvancedButton>
                      <IconButton
                        icon={<Settings className="h-4.5 w-4.5" />}
                        title="Settings button"
                      />
                      <SplitButton
                        label="Publish Code"
                        onClick={() => toast.success('Publish primary action triggered')}
                        options={[
                          {
                            label: 'Staging Release',
                            onClick: () => toast.success('Staging release initialized.'),
                          },
                          {
                            label: 'Production Push',
                            onClick: () => toast.success('Production release approved!'),
                          },
                        ]}
                      />
                    </div>
                  </SectionContainer>

                  <SectionContainer>
                    <SectionTitle>Advanced Card Systems</SectionTitle>
                    <MutedText>
                      Visual layouts supporting analytics actions, status grids, and spring scaling.
                    </MutedText>
                    <DashboardGrid cols={3}>
                      <AnalyticsCard
                        title="Interactive Actions Card"
                        description="Includes custom actions buttons"
                        actions={
                          <IconButton
                            icon={<Share2 className="h-4 w-4" />}
                            onClick={() => toast.info('Share clicked')}
                          />
                        }
                        footer={
                          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                            Updated just now
                          </span>
                        }
                      >
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          AnalyticsCard supports dynamic action bars and responsive footer labels
                          neatly.
                        </p>
                      </AnalyticsCard>

                      <MetricCard
                        title="Sales KPI Tracker"
                        value="$84,200.00"
                        trend={14.8}
                        trendLabel="vs last month"
                        progress={75}
                      />

                      <InteractiveCard
                        onClick={() => toast.success('Interactive Spring Card clicked!')}
                      >
                        <div className="space-y-2 select-none">
                          <span className="inline-flex items-center gap-1 rounded bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider leading-none">
                            Interactive
                          </span>
                          <h4 className="text-sm font-bold text-foreground tracking-tight leading-none">
                            Spring Hover Card
                          </h4>
                          <p className="text-xs text-muted-foreground/80 leading-relaxed mt-1">
                            InteractiveCard utilizes dynamic Framer Motion scaling when clicked or
                            hovered.
                          </p>
                        </div>
                      </InteractiveCard>
                    </DashboardGrid>
                  </SectionContainer>
                </div>
              )}

              {/* --- FORM CONTROLS PANEL --- */}
              {activeTab === 'forms' && (
                <div className="space-y-8 text-left">
                  <SectionContainer>
                    <SectionTitle>Advanced Inputs & Upload System</SectionTitle>
                    <MutedText>
                      Fully customizable keyboard combobox select inputs, monetary text, and drag
                      uploader.
                    </MutedText>
                    <div className="border border-border/60 rounded-xl p-6 bg-card/40 space-y-6">
                      <SplitLayout>
                        <div className="space-y-4">
                          <SearchableSelect
                            label="Searchable Select (Combobox)"
                            options={[
                              { value: 'crm', label: 'Customer Relations Management' },
                              { value: 'projects', label: 'Team Project Boards' },
                              { value: 'tasks', label: 'Global Task Sprints' },
                            ]}
                            value={selectVal}
                            onChange={setSelectVal}
                            placeholder="Select modules..."
                          />

                          <AsyncSelect
                            label="Async DB Select"
                            loadOptions={loadAsyncOptions}
                            value={asyncVal}
                            onChange={setAsyncVal}
                            placeholder="Query databases..."
                          />

                          <TagInput
                            label="Dynamic Tag Registry"
                            tags={tags}
                            onChange={setTags}
                            placeholder="Add tag and press Enter..."
                          />

                          <DateRangePicker
                            label="Calendar Date Range Picker"
                            startDate={startDate}
                            endDate={endDate}
                            onStartChange={setStartDate}
                            onEndChange={setEndDate}
                          />
                        </div>

                        <div className="space-y-4">
                          <PhoneInput
                            label="Phone Field Validator"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                          />

                          <CurrencyInput
                            label="Monetary Currency Field"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                          />

                          <MultiSelect
                            label="Multiple Element Select"
                            options={[
                              { value: 'recharts', label: 'Recharts Graphs' },
                              { value: 'framer', label: 'Framer Springs' },
                              { value: 'zustand', label: 'Zustand Modules' },
                            ]}
                            selectedValues={selectedTools}
                            onChange={setSelectedTools}
                          />

                          <RichTextarea
                            label="Rich Text area (Markdown tabs)"
                            value={textareaVal}
                            onChange={(e) => setTextareaVal(e.target.value)}
                          />
                        </div>
                      </SplitLayout>

                      <div className="border-t border-border/40 pt-6">
                        <FileUploader
                          label="Drag-and-Drop File Uploader"
                          maxSizeMB={8}
                          onFilesSelected={(files) =>
                            toast.success(`Uploaded ${files.length} mock files successfully!`)
                          }
                        />
                      </div>
                    </div>
                  </SectionContainer>
                </div>
              )}

              {/* --- TABLES PANEL --- */}
              {activeTab === 'tables' && (
                <div className="space-y-8 text-left">
                  <SectionContainer>
                    <SectionTitle>Enterprise Data Toolbar Upgrade</SectionTitle>
                    <MutedText>
                      Active filter lists, column pin presets, bulk actions, and CSV/Excel exports.
                    </MutedText>
                    <div className="border border-border/60 rounded-xl p-6 bg-card/40 space-y-4">
                      <EnterpriseTableToolbar
                        globalFilter={tableSearch}
                        setGlobalFilter={setTableSearch}
                        selectedRowsCount={selectedTableRows}
                        bulkActions={[
                          {
                            label: 'Bulk Delete',
                            onClick: () => {
                              toast.error('Bulk deletion of mock items simulated');
                              setSelectedTableRows(0);
                            },
                            destructive: true,
                            icon: <Trash2 className="h-4 w-4" />,
                          },
                        ]}
                        filters={[
                          {
                            column: 'role',
                            label: 'Access Role',
                            options: [
                              { label: 'Super Admin', value: 'super-admin' },
                              { label: 'Billing Manager', value: 'billing' },
                            ],
                          },
                          {
                            column: 'status',
                            label: 'Account Status',
                            options: [
                              { label: 'Active', value: 'active' },
                              { label: 'Deactivated', value: 'disabled' },
                            ],
                          },
                        ]}
                        activeFilters={activeTableFilters}
                        onFilterChange={(col, val) =>
                          setActiveTableFilters((prev) => ({ ...prev, [col]: val }))
                        }
                        onClearFilters={() => setActiveTableFilters({ role: '', status: '' })}
                        columnsList={[
                          {
                            id: 'user',
                            label: 'Full User Profile',
                            visible: true,
                            onToggle: () => {},
                          },
                          {
                            id: 'role',
                            label: 'RBAC Authorization',
                            visible: true,
                            onToggle: () => {},
                          },
                          {
                            id: 'activity',
                            label: 'Audit Timeline Logs',
                            visible: true,
                            onToggle: () => {},
                          },
                        ]}
                      />

                      {/* Interactive Selection Sandbox helper */}
                      <div className="flex justify-between items-center bg-accent/20 border border-border/60 rounded-md p-3 select-none">
                        <span className="text-xs text-muted-foreground font-semibold">
                          Simulate table selections inside playground to view bulk tools:
                        </span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedTableRows(2)}
                            className="h-8 text-xs"
                          >
                            Select 2 rows
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedTableRows(0)}
                            className="h-8 text-xs text-muted-foreground"
                          >
                            Reset
                          </Button>
                        </div>
                      </div>
                    </div>
                  </SectionContainer>

                  <SectionContainer>
                    <SectionTitle>Dashboard Skeleton States</SectionTitle>
                    <MutedText>
                      Premium custom route boundaries preventing dynamic flashing.
                    </MutedText>
                    <SplitLayout>
                      <CardSkeleton />
                      <TableSkeleton rows={2} />
                    </SplitLayout>
                  </SectionContainer>
                </div>
              )}

              {/* --- MODALS PANEL --- */}
              {activeTab === 'modals' && (
                <div className="space-y-8 text-left">
                  <SectionContainer>
                    <SectionTitle>Animated Modal & Overlays Grid</SectionTitle>
                    <MutedText>
                      Framer-motion spring sheet animations, confirmation prompts, and drawers.
                    </MutedText>
                    <div className="border border-border/60 rounded-xl p-6 bg-card/40 flex flex-wrap gap-4 items-center">
                      <AdvancedButton variant="outline" onClick={() => setIsCenteredOpen(true)}>
                        Centered Modal
                      </AdvancedButton>
                      <AdvancedButton variant="outline" onClick={() => setIsDrawerOpen(true)}>
                        Drawer Sheet
                      </AdvancedButton>
                      <AdvancedButton variant="outline" onClick={() => setIsFullscreenOpen(true)}>
                        Fullscreen Overlay
                      </AdvancedButton>
                      <AdvancedButton variant="destructive" onClick={() => setIsConfirmOpen(true)}>
                        Confirmation Alert
                      </AdvancedButton>
                    </div>

                    {/* Centered Modal Sandbox */}
                    <CenteredModal
                      isOpen={isCenteredOpen}
                      onClose={() => setIsCenteredOpen(false)}
                      title="Centered Settings Panel"
                      footer={
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsCenteredOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              toast.success('Settings synchronized!');
                              setIsCenteredOpen(false);
                            }}
                          >
                            Save Changes
                          </Button>
                        </>
                      }
                    >
                      <div className="space-y-4">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          CenteredModal includes a standard frosted backdrop blur, Esc closing key
                          listeners, and accessibility focus rules.
                        </p>
                        <SearchableSelect
                          label="Preferred Module Theme"
                          options={[
                            { value: 'system', label: 'System Default' },
                            { value: 'dark', label: 'Dark Mode HSL' },
                            { value: 'light', label: 'OLED Light Mode' },
                          ]}
                          value=""
                          onChange={() => {}}
                        />
                      </div>
                    </CenteredModal>

                    {/* Drawer Modal Sandbox */}
                    <DrawerModal
                      isOpen={isDrawerOpen}
                      onClose={() => setIsDrawerOpen(false)}
                      title="Collapsible Filter Drawer"
                    >
                      <div className="space-y-4 select-none">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          DrawerModal provides a mobile-friendly drawer sliding up from the viewport
                          bottom elegantly.
                        </p>
                        <DatePicker
                          label="Restrict Start Logs"
                          value={startDate}
                          onChange={() => {}}
                        />
                      </div>
                    </DrawerModal>

                    {/* Fullscreen Modal Sandbox */}
                    <FullscreenModal
                      isOpen={isFullscreenOpen}
                      onClose={() => setIsFullscreenOpen(false)}
                      title="Fullscreen Audit Analytics Studio"
                    >
                      <div className="space-y-6 select-none max-w-4xl mx-auto py-10">
                        <div className="space-y-2">
                          <SectionTitle>Enterprise Database Analytics</SectionTitle>
                          <MutedText>
                            Inspect system activities, and user registration queries globally.
                          </MutedText>
                        </div>
                        <DashboardGrid cols={3}>
                          <KPIWidget title="Active Sockets" value="10/10" trend={0} />
                          <KPIWidget title="Mongoose Pools" value="Active" trend={100} />
                          <KPIWidget title="Zod Errors" value="0" trend={0} />
                        </DashboardGrid>
                      </div>
                    </FullscreenModal>

                    {/* Confirmation Modal Sandbox */}
                    <ConfirmationModal
                      isOpen={isConfirmOpen}
                      onClose={() => setIsConfirmOpen(false)}
                      onConfirm={() => {
                        toast.success('Simulation deletion of database logs completed!');
                        setIsConfirmOpen(false);
                      }}
                      title="Purge Active User Session Logs"
                      message="Are you absolutely sure you want to permanently clear the historical activity and audit logs in the DB?"
                      confirmLabel="Clear Logs"
                      type="danger"
                    />
                  </SectionContainer>
                </div>
              )}

              {/* --- ANALYTICS PANEL --- */}
              {activeTab === 'analytics' && (
                <div className="space-y-8 text-left">
                  <SectionContainer>
                    <SectionTitle>Dashboard Analytics Widgets</SectionTitle>
                    <MutedText>
                      Radial percentage tracks, miniature sparklines, and KPI widgets.
                    </MutedText>
                    <DashboardGrid cols={3}>
                      <ProgressCircleWidget
                        title="Dynamic Target progress"
                        percentage={82}
                        subtitle="Reaching quarter goals"
                        icon={<Sparkles className="h-5 w-5 text-primary" />}
                      />
                      <DynamicMetricWidget
                        title="Zustand Store Frame Rate"
                        value="60 FPS"
                        points={[55, 60, 58, 60, 59, 60, 60, 57, 60]}
                        color="hsl(var(--primary))"
                      />
                      <KPIWidget
                        title="Database Write queries"
                        value="98.5K"
                        trend={25.4}
                        progress={82}
                      />
                    </DashboardGrid>
                  </SectionContainer>

                  <SectionContainer>
                    <SectionTitle>Premium Recharts Wrappers</SectionTitle>
                    <MutedText>
                      Highly customizable visual charts automatically synchronizing colors with HSL
                      themes.
                    </MutedText>
                    <SplitLayout>
                      <AnalyticsCard title="Monthly ERP Revenue Area Plot">
                        <AreaChartWrapper
                          data={sampleAnalyticsData}
                          xKey="name"
                          metrics={[
                            { key: 'revenue', label: 'Company Revenue' },
                            { key: 'expenses', label: 'SaaS Expenses', color: '#f59e0b' },
                          ]}
                        />
                      </AnalyticsCard>

                      <AnalyticsCard title="Enterprise Module Distribution Ratio">
                        <PieChartWrapper data={sampleRatioData} />
                      </AnalyticsCard>
                    </SplitLayout>
                  </SectionContainer>

                  <SectionContainer>
                    <SectionTitle>Activity & Audit Trail timelines</SectionTitle>
                    <MutedText>
                      Activity timelines extracting user audits, status events, and system logging.
                    </MutedText>
                    <div className="border border-border/60 rounded-xl p-6 bg-card/40 max-w-2xl">
                      <ActivityTimeline items={sampleTimeline} />
                    </div>
                  </SectionContainer>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </ContentContainer>
    </PageWrapper>
  );
}
