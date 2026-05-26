import { useGetDashboardOverview, useGetMetricsSummary, useListActivity } from "@workspace/api-client-react";
import { Activity, BarChart2, FileText, Target, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, CartesianGrid } from "recharts";

export default function DashboardPage() {
  const { data: overview, isLoading: overviewLoading } = useGetDashboardOverview({ query: { queryKey: ["dashboardOverview"] } });
  const { data: metricsSummary, isLoading: summaryLoading } = useGetMetricsSummary({ query: { queryKey: ["metricsSummary"] } });
  const { data: activity, isLoading: activityLoading } = useListActivity({ limit: 5 }, { query: { queryKey: ["activity", { limit: 5 }] } });

  // Dummy data for sparklines since we don't have a specific endpoint for just sparklines in overview
  const sparklineData = [
    { date: "Mon", value: 40 },
    { date: "Tue", value: 30 },
    { date: "Wed", value: 55 },
    { date: "Thu", value: 45 },
    { date: "Fri", value: 70 },
    { date: "Sat", value: 65 },
    { date: "Sun", value: 85 },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Overview</h1>
          <p className="text-muted-foreground mt-1">Your high-level system metrics and performance.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Metrics</CardTitle>
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {overviewLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-3xl font-bold text-foreground">{overview?.totalMetrics || 0}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Across all categories</p>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">KPI Health</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {overviewLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-3xl font-bold text-foreground">{overview?.kpiHealthPct || 0}%</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Targets on track</p>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Reports</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {overviewLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-3xl font-bold text-foreground">{overview?.totalReports || 0}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Generated this month</p>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">System Activity</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {overviewLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-3xl font-bold text-foreground">{overview?.recentMetricsCount || 0}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Events in last 24h</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-7">
          {/* Main Chart Area */}
          <Card className="col-span-7 lg:col-span-4 bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">System Performance Trend</CardTitle>
              <CardDescription>Aggregate view of top categories over the last 7 days.</CardDescription>
            </CardHeader>
            <CardContent className="pl-0">
              <div className="h-[300px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparklineData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                      itemStyle={{ color: 'hsl(var(--primary))' }}
                    />
                    <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card className="col-span-7 lg:col-span-3 bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Recent Activity</CardTitle>
              <CardDescription>Latest events and updates in the system.</CardDescription>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex items-start gap-4">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activity && activity.length > 0 ? (
                <div className="space-y-6">
                  {activity.map((event) => (
                    <div key={event.id} className="flex items-start gap-4">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                        <Activity className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <p className="text-sm text-foreground break-words leading-tight">{event.description}</p>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          {format(new Date(event.createdAt), "MMM d, h:mm a")} • {event.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No recent activity found.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Metrics Summary breakdown */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Metric Trends</CardTitle>
            <CardDescription>Distribution of metric movements.</CardDescription>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex flex-col p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-2 text-green-500 mb-2">
                    <TrendingUp className="h-5 w-5" />
                    <span className="font-semibold text-sm">Trending Up</span>
                  </div>
                  <span className="text-3xl font-bold text-white">{metricsSummary?.upTrendCount || 0}</span>
                </div>
                <div className="flex flex-col p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center gap-2 text-red-500 mb-2">
                    <TrendingDown className="h-5 w-5" />
                    <span className="font-semibold text-sm">Trending Down</span>
                  </div>
                  <span className="text-3xl font-bold text-white">{metricsSummary?.downTrendCount || 0}</span>
                </div>
                <div className="flex flex-col p-4 rounded-lg bg-gray-500/10 border border-gray-500/20">
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <Minus className="h-5 w-5" />
                    <span className="font-semibold text-sm">Flat</span>
                  </div>
                  <span className="text-3xl font-bold text-white">{metricsSummary?.flatTrendCount || 0}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
