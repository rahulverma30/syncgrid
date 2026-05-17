import React from 'react';
import { Card, CardContent } from '@/components/ui';
import { AreaChartWrapper, PieChartWrapper, BarChartWrapper } from '@/components/ui/charts';
import { useClientsStore, ClientAccount } from '@/store/clientsStore';
import { Users, TrendingUp, DollarSign, Heart, ShieldCheck, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const ClientAnalytics: React.FC = () => {
  const { clients, setSelectedClient } = useClientsStore();

  // 1. Calculate Scorecard KPIs
  const clientCount = clients.length;
  const totalARR = clients.reduce((sum, c) => sum + (c.revenueContribution || 0), 0);
  const avgHealth =
    clientCount > 0
      ? Math.round(clients.reduce((sum, c) => sum + c.healthScore, 0) / clientCount)
      : 0;
  const onboardingCompletion =
    clientCount > 0
      ? Math.round(
          (clients.filter((c) => c.onboardingStatus === 'completed').length / clientCount) * 100
        )
      : 0;

  // 2. Generate Chart Data
  // ARR growth curve per month (mock dynamic curves based on active client revenues)
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const arrGrowthData = months.map((month, index) => {
    // Generate scaled value based on client revenue contribution
    const scaleFactor = 0.5 + (index / 11) * 0.5; // grows from 50% to 100%
    return {
      month,
      revenue: Math.round(totalARR * scaleFactor),
    };
  });

  // Client Classification ratios
  const classifications = ['VIP', 'Enterprise', 'Startup', 'Retainer', 'High Value', 'Inactive'];
  const typeChartData = classifications
    .map((type) => {
      const count = clients.filter((c) => c.clientType === type).length;
      return {
        name: type,
        value: count,
      };
    })
    .filter((d) => d.value > 0);

  // Workload distributions per manager
  const managers = Array.from(new Set(clients.map((c) => c.accountManager || 'Unassigned')));
  const managerDistribution = managers.map((name) => {
    const count = clients.filter((c) => c.accountManager === name).length;
    return {
      name: name.split(' ')[0], // first name for chart label brevity
      clients: count,
    };
  });

  return (
    <motion.div
      key="analytics"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6 text-left"
    >
      {/* Scorecard KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 select-none">
        <Card className="bg-card/40 backdrop-blur-md border border-border/80 hover:border-primary/20 transition-all duration-300">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Active Clients
              </p>
              <h3 className="text-2xl font-black font-mono">{clientCount}</h3>
              <p className="text-[10px] text-emerald-500 font-semibold flex items-center gap-0.5">
                <TrendingUp className="h-3 w-3" />
                Stable retention
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur-md border border-border/80 hover:border-primary/20 transition-all duration-300">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Aggregate ARR
              </p>
              <h3 className="text-2xl font-black font-mono text-primary">
                ${totalARR.toLocaleString()}
              </h3>
              <p className="text-[10px] text-muted-foreground">Contract sum value</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur-md border border-border/80 hover:border-primary/20 transition-all duration-300">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Avg Health Index
              </p>
              <h3 className="text-2xl font-black font-mono">{avgHealth}%</h3>
              <p className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wider">
                Stable relationship
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Heart className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur-md border border-border/80 hover:border-primary/20 transition-all duration-300">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Onboard Progress
              </p>
              <h3 className="text-2xl font-black font-mono">{onboardingCompletion}%</h3>
              <p className="text-[10px] text-rose-500 font-semibold uppercase tracking-wider">
                Fully converted
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphical grids */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2 bg-card/25 border border-border/80">
          <CardContent className="p-5 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-foreground">ARR Contribution Curve</h4>
              <p className="text-[10px] text-muted-foreground">
                Aggregated client recurring contract metrics per interval
              </p>
            </div>
            <AreaChartWrapper
              data={arrGrowthData}
              xKey="month"
              metrics={[{ key: 'revenue', label: 'ARR Yield ($)', color: 'hsl(var(--primary))' }]}
              height={200}
            />
          </CardContent>
        </Card>

        <Card className="bg-card/25 border border-border/80">
          <CardContent className="p-5 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-foreground">Account Classification</h4>
              <p className="text-[10px] text-muted-foreground">Contract category breakdown ratio</p>
            </div>
            {typeChartData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground">
                No clients registered.
              </div>
            ) : (
              <PieChartWrapper data={typeChartData} height={200} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom splits */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <Card className="bg-card/25 border border-border/80">
          <CardContent className="p-5 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-foreground">Workload Distribution</h4>
              <p className="text-[10px] text-muted-foreground">
                Number of accounts managed per staff leader
              </p>
            </div>
            <BarChartWrapper
              data={managerDistribution}
              xKey="name"
              metrics={[{ key: 'clients', label: 'Clients Managed', color: 'hsl(var(--primary))' }]}
              height={180}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 bg-card/25 border border-border/80">
          <CardContent className="p-5 space-y-3.5">
            <div>
              <h4 className="text-sm font-bold text-foreground">Active Churn Chokepoints</h4>
              <p className="text-[10px] text-muted-foreground">
                Accounts displaying churn risk indicators or low health indices
              </p>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {clients
                .filter((c) => c.healthScore < 80 || c.retentionStatus === 'churn-risk')
                .map((acc) => (
                  <div
                    key={acc._id}
                    onClick={() => setSelectedClient(acc)}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-card/45 hover:bg-card hover:border-border transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="h-7 w-7 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mt-0.5">
                        <AlertCircle className="h-4 w-4" />
                      </span>
                      <div className="space-y-0.5 min-w-0">
                        <h5 className="text-xs font-bold text-foreground truncate">{acc.name}</h5>
                        <p className="text-[10px] text-muted-foreground truncate">
                          Manager:{' '}
                          <span className="font-semibold text-foreground/80">
                            {acc.accountManager}
                          </span>{' '}
                          • Health:{' '}
                          <span className="font-bold text-rose-500">{acc.healthScore}%</span>
                        </p>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono rounded bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-0.5">
                      Alert: Churn Risk
                    </span>
                  </div>
                ))}
              {clients.every((c) => c.healthScore >= 80 && c.retentionStatus !== 'churn-risk') && (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  🎉 Magnificent! All client accounts maintain a high health rating!
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};
