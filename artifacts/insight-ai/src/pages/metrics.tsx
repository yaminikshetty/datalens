import { useState, useRef } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  useListMetrics, useCreateMetric, useDeleteMetric, useGetMetricsByCategory,
  getListMetricsQueryKey, getGetMetricsByCategoryQueryKey,
  getGetMetricsSummaryQueryKey, getGetMetricsTrendsQueryKey, getGetDashboardOverviewQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Trash2, Plus, BarChart2, Upload, Download, CheckCircle2, AlertCircle, X } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { toast } from "sonner";

const CATEGORIES = ["Revenue", "Marketing", "Product", "Operations", "Customer Success"];

const CSV_TEMPLATE = `name,value,unit,category,trend,date
Monthly Recurring Revenue,284500,$,Revenue,up,2026-05-01
Daily Active Users,12840,users,Product,up,2026-05-01
Customer Acquisition Cost,312,$,Marketing,down,2026-05-01
API Uptime,99.97,%,Operations,up,2026-05-01
Churn Rate,1.4,%,Customer Success,up,2026-05-01`;

type ImportRow = {
  name: string;
  value: string;
  unit: string;
  category: string;
  trend: string;
  date: string;
  status?: "pending" | "success" | "error";
  error?: string;
};

export default function MetricsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newMetric, setNewMetric] = useState({
    name: "",
    value: "",
    unit: "",
    category: "Revenue",
    trend: "flat" as "up" | "down" | "flat",
  });

  const queryClient = useQueryClient();
  const { data: metrics, isLoading } = useListMetrics({ limit: 200 }, { query: { queryKey: getListMetricsQueryKey({ limit: 200 }) } });
  const { data: byCategory, isLoading: categoryLoading } = useGetMetricsByCategory({ query: { queryKey: getGetMetricsByCategoryQueryKey() } });
  const createMetric = useCreateMetric();
  const deleteMetric = useDeleteMetric();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: getListMetricsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetMetricsByCategoryQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetMetricsSummaryQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetMetricsTrendsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardOverviewQueryKey() });
  };

  const handleCreate = () => {
    if (!newMetric.name || !newMetric.value || !newMetric.unit) {
      toast.error("Please fill in all required fields");
      return;
    }
    createMetric.mutate({ data: { name: newMetric.name, value: Number(newMetric.value), unit: newMetric.unit, category: newMetric.category, trend: newMetric.trend } }, {
      onSuccess: () => {
        toast.success("Metric created");
        setIsCreateOpen(false);
        setNewMetric({ name: "", value: "", unit: "", category: "Revenue", trend: "flat" });
        invalidateAll();
      },
      onError: () => toast.error("Failed to create metric"),
    });
  };

  const handleDelete = (id: number) => {
    deleteMetric.mutate({ id }, { onSuccess: () => { toast.success("Metric deleted"); invalidateAll(); }, onError: () => toast.error("Failed to delete metric") });
  };

  const parseCSV = (text: string): ImportRow[] => {
    const lines = text.trim().split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    return lines.slice(1).map(line => {
      const vals = line.split(",").map(v => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = vals[i] ?? ""; });
      return {
        name: row.name ?? "",
        value: row.value ?? "",
        unit: row.unit ?? "",
        category: row.category ?? "Product",
        trend: (row.trend ?? "flat") as string,
        date: row.date ?? new Date().toISOString().split("T")[0],
        status: "pending",
      };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      if (rows.length === 0) {
        toast.error("No valid rows found — check your CSV format");
        return;
      }
      setImportRows(rows);
      setImportDone(false);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleImport = async () => {
    setImporting(true);
    const updated = [...importRows];
    for (let i = 0; i < updated.length; i++) {
      const row = updated[i];
      if (!row.name || !row.value || !row.unit) {
        updated[i] = { ...row, status: "error", error: "Missing name, value, or unit" };
        continue;
      }
      const val = Number(row.value);
      if (isNaN(val)) {
        updated[i] = { ...row, status: "error", error: "Value must be a number" };
        continue;
      }
      try {
        await new Promise<void>((resolve, reject) => {
          createMetric.mutate({
            data: {
              name: row.name,
              value: val,
              unit: row.unit,
              category: row.category || "Product",
              trend: (["up", "down", "flat"].includes(row.trend) ? row.trend : "flat") as "up" | "down" | "flat",
              date: row.date ? new Date(row.date).toISOString() : undefined,
            }
          }, { onSuccess: () => resolve(), onError: () => reject() });
        });
        updated[i] = { ...row, status: "success" };
      } catch {
        updated[i] = { ...row, status: "error", error: "Import failed" };
      }
      setImportRows([...updated]);
    }
    setImporting(false);
    setImportDone(true);
    invalidateAll();
    const succeeded = updated.filter(r => r.status === "success").length;
    const failed = updated.filter(r => r.status === "error").length;
    if (succeeded > 0) toast.success(`Imported ${succeeded} metric${succeeded !== 1 ? "s" : ""}${failed > 0 ? `, ${failed} failed` : ""}`);
    else toast.error("All rows failed to import — check the errors below");
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "datalens-metrics-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const uniqueMetrics = metrics
    ? metrics.reduce((acc: typeof metrics, m) => {
        const existing = acc.findIndex(e => e.name === m.name);
        if (existing === -1 || new Date(m.date) > new Date(acc[existing].date)) {
          if (existing !== -1) acc.splice(existing, 1);
          acc.push(m);
        }
        return acc;
      }, [])
    : [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Metrics</h1>
            <p className="text-muted-foreground mt-1">Track any quantifiable business, product, or operational data point.</p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isImportOpen} onOpenChange={(open) => { setIsImportOpen(open); if (!open) { setImportRows([]); setImportDone(false); } }}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="button-import-csv">
                  <Upload className="h-4 w-4 mr-2" />
                  Import CSV
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Import Metrics from CSV</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                    <p className="font-medium text-foreground">CSV Format</p>
                    <p className="text-muted-foreground">Your file needs these columns (header row required):</p>
                    <code className="block text-xs bg-background border border-border rounded px-3 py-2 font-mono text-foreground">
                      name, value, unit, category, trend, date
                    </code>
                    <ul className="text-muted-foreground text-xs space-y-1 mt-2">
                      <li><span className="text-foreground font-medium">trend</span> — must be <code className="bg-background px-1 rounded">up</code>, <code className="bg-background px-1 rounded">down</code>, or <code className="bg-background px-1 rounded">flat</code></li>
                      <li><span className="text-foreground font-medium">date</span> — optional, format YYYY-MM-DD (defaults to today)</li>
                      <li><span className="text-foreground font-medium">category</span> — any label (Revenue, Product, Marketing, etc.)</li>
                    </ul>
                    <Button variant="outline" size="sm" onClick={downloadTemplate} className="mt-2">
                      <Download className="h-3 w-3 mr-2" />
                      Download Template
                    </Button>
                  </div>

                  {importRows.length === 0 ? (
                    <div
                      className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
                      <p className="text-foreground font-medium">Click to select a CSV file</p>
                      <p className="text-muted-foreground text-sm mt-1">or drag and drop</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,text/csv"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">{importRows.length} row{importRows.length !== 1 ? "s" : ""} detected</p>
                        <Button variant="ghost" size="sm" onClick={() => { setImportRows([]); setImportDone(false); }}>
                          <X className="h-4 w-4 mr-1" />
                          Clear
                        </Button>
                      </div>
                      <div className="rounded-md border border-border overflow-x-auto max-h-64 overflow-y-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-muted/50 sticky top-0">
                            <tr>
                              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Status</th>
                              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Name</th>
                              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Value</th>
                              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Unit</th>
                              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Category</th>
                              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Trend</th>
                              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {importRows.map((row, i) => (
                              <tr key={i} className={`border-t border-border ${row.status === "error" ? "bg-destructive/5" : row.status === "success" ? "bg-green-500/5" : ""}`}>
                                <td className="px-3 py-2">
                                  {row.status === "success" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                                  {row.status === "error" && <span title={row.error}><AlertCircle className="h-4 w-4 text-destructive" /></span>}
                                  {row.status === "pending" && <span className="text-muted-foreground">—</span>}
                                </td>
                                <td className="px-3 py-2 font-medium text-foreground max-w-[160px] truncate">{row.name || <span className="text-destructive">missing</span>}</td>
                                <td className="px-3 py-2 text-foreground">{row.value || <span className="text-destructive">missing</span>}</td>
                                <td className="px-3 py-2 text-foreground">{row.unit || <span className="text-destructive">missing</span>}</td>
                                <td className="px-3 py-2 text-muted-foreground">{row.category}</td>
                                <td className="px-3 py-2 text-muted-foreground">{row.trend}</td>
                                <td className="px-3 py-2 text-muted-foreground">{row.date}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {!importDone && (
                        <Button onClick={handleImport} disabled={importing} className="w-full" data-testid="button-confirm-import">
                          {importing ? `Importing... (${importRows.filter(r => r.status === "success").length}/${importRows.length})` : `Import ${importRows.length} Row${importRows.length !== 1 ? "s" : ""}`}
                        </Button>
                      )}
                      {importDone && (
                        <div className="flex gap-2">
                          <Button variant="outline" className="flex-1" onClick={() => { setImportRows([]); setImportDone(false); }}>Import More</Button>
                          <Button className="flex-1" onClick={() => setIsImportOpen(false)}>Done</Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-metric">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Metric
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[440px]">
                <DialogHeader>
                  <DialogTitle>Add Metric</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  <div className="space-y-1.5">
                    <Label>Metric Name</Label>
                    <Input placeholder="e.g. Monthly Recurring Revenue" value={newMetric.name} onChange={e => setNewMetric({ ...newMetric, name: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Value</Label>
                      <Input type="number" placeholder="0" value={newMetric.value} onChange={e => setNewMetric({ ...newMetric, value: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Unit</Label>
                      <Input placeholder="$, %, users, ms..." value={newMetric.unit} onChange={e => setNewMetric({ ...newMetric, unit: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Category</Label>
                      <Select value={newMetric.category} onValueChange={v => setNewMetric({ ...newMetric, category: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Trend Direction</Label>
                      <Select value={newMetric.trend} onValueChange={(v: "up" | "down" | "flat") => setNewMetric({ ...newMetric, trend: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="up">Trending Up</SelectItem>
                            <SelectItem value="down">Trending Down</SelectItem>
                            <SelectItem value="flat">Flat</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreate} disabled={createMetric.isPending} data-testid="button-submit-metric">
                    {createMetric.isPending ? "Saving..." : "Save Metric"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Metrics by Category</CardTitle>
            <CardDescription>Number of tracked metrics per business area.</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryLoading ? (
              <Skeleton className="h-[220px] w-full" />
            ) : (
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byCategory || []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="category" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <RechartsTooltip
                      cursor={{ fill: "hsl(var(--muted)/0.4)" }}
                      contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))", fontSize: 12 }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={60} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Metrics</CardTitle>
                <CardDescription>Most recent value per metric. Use Import CSV to bulk-upload historical data.</CardDescription>
              </div>
              {metrics && <Badge variant="secondary">{uniqueMetrics.length} tracked</Badge>}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : uniqueMetrics.length > 0 ? (
              <div className="rounded-md border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="h-11 px-4 text-left font-medium">Name</th>
                      <th className="h-11 px-4 text-left font-medium">Category</th>
                      <th className="h-11 px-4 text-right font-medium">Value</th>
                      <th className="h-11 px-4 text-left font-medium">Trend</th>
                      <th className="h-11 px-4 text-left font-medium">Date</th>
                      <th className="h-11 px-4 w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {uniqueMetrics.map((m) => (
                      <tr key={m.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{m.name}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-xs font-normal">{m.category}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium">
                          {typeof m.value === "number" ? m.value.toLocaleString() : m.value}
                          <span className="text-muted-foreground text-xs ml-1">{m.unit}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                            m.trend === "up" ? "bg-green-500/10 text-green-500" :
                            m.trend === "down" ? "bg-red-500/10 text-red-500" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {m.trend === "up" ? "↑" : m.trend === "down" ? "↓" : "→"} {m.trend}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-sm">
                          {format(new Date(m.date), "MMM d, yyyy")}
                        </td>
                        <td className="px-4 py-3">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(m.id)} disabled={deleteMetric.isPending} data-testid={`button-delete-metric-${m.id}`}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16 border border-dashed border-border rounded-lg">
                <BarChart2 className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
                <h3 className="text-lg font-semibold text-foreground">No metrics yet</h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-2 mb-6">
                  Add metrics manually or import a CSV file with your business data.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Button variant="outline" onClick={() => setIsImportOpen(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Import CSV
                  </Button>
                  <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Metric
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
