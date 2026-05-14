"use client";

import { PageHeader, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { BarChart3, TrendingUp, Users, Activity } from "lucide-react";

export default function DashboardPage() {
  const stats = [
    {
      title: "Total Contacts",
      value: "2,543",
      description: "+420 from last month",
      icon: Users,
    },
    {
      title: "Revenue",
      value: "$45,231.89",
      description: "+12.5% from last month",
      icon: TrendingUp,
    },
    {
      title: "Active Projects",
      value: "12",
      description: "+2 new projects",
      icon: BarChart3,
    },
    {
      title: "Engagement",
      value: "84.2%",
      description: "+5.2% from last month",
      icon: Activity,
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Welcome back to SyncGrid. Here's what's happening with your business today."
        actions={<Button>View Report</Button>}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} interactive>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest updates and activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b last:border-0">
                <div>
                  <p className="font-medium">New contact created</p>
                  <p className="text-sm text-muted-foreground">John Doe was added to your contacts</p>
                </div>
                <span className="text-xs text-muted-foreground">2 hours ago</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}