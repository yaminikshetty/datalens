import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SelectGroup } from "@/components/ui/select";
import { useListReports, useCreateReport, useDeleteReport, getListReportsQueryKey, getGetDashboardOverviewQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Trash2, Plus, FileText, Download, Eye } from "lucide-react";
import { toast } from "sonner";

export default function ReportsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newReport, setNewReport] = useState({
    title: "",
    description: "",
    type: "summary" as const,
    category: "system"
  });

  const queryClient = useQueryClient();
  const { data: reports, isLoading } = useListReports({ query: { queryKey: ["reports"] } });
  
  const createReport = useCreateReport();
  const deleteReport = useDeleteReport();

  const handleCreate = () => {
    if (!newReport.title) {
      toast.error("Please enter a title");
      return;
    }

    createReport.mutate({
      data: {
        title: newReport.title,
        description: newReport.description,
        type: newReport.type,
        category: newReport.category,
        data: JSON.stringify({ generated: true, timestamp: new Date().toISOString() })
      }
    }, {
      onSuccess: () => {
        toast.success("Report generated successfully");
        setIsCreateOpen(false);
        setNewReport({ title: "", description: "", type: "summary", category: "system" });
        queryClient.invalidateQueries({ queryKey: getListReportsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardOverviewQueryKey() });
      },
      onError: () => toast.error("Failed to generate report")
    });
  };

  const handleDelete = (id: number) => {
    deleteReport.mutate({ id }, {
      onSuccess: () => {
        toast.success("Report deleted");
        queryClient.invalidateQueries({ queryKey: getListReportsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardOverviewQueryKey() });
      },
      onError: () => toast.error("Failed to delete report")
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Reports</h1>
            <p className="text-muted-foreground mt-1">Generated intelligence and performance summaries.</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-report">
                <Plus className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Generate New Report</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" placeholder="e.g. Q3 Infrastructure Performance" value={newReport.title} onChange={e => setNewReport({...newReport, title: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="desc">Description (Optional)</Label>
                  <Textarea id="desc" placeholder="Brief context about this report..." value={newReport.description} onChange={e => setNewReport({...newReport, description: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="type">Report Type</Label>
                    <Select value={newReport.type} onValueChange={(v: any) => setNewReport({...newReport, type: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="summary">Summary</SelectItem>
                          <SelectItem value="performance">Performance</SelectItem>
                          <SelectItem value="trend">Trend</SelectItem>
                          <SelectItem value="comparison">Comparison</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category">Focus Category</Label>
                    <Select value={newReport.category} onValueChange={v => setNewReport({...newReport, category: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="system">System</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="product">Product</SelectItem>
                          <SelectItem value="all">All Categories</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleCreate} disabled={createReport.isPending} data-testid="button-submit-report">
                  {createReport.isPending ? "Generating..." : "Generate"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="bg-card">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : reports && reports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <Card key={report.id} className="bg-card flex flex-col hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <CardTitle className="text-lg leading-tight line-clamp-2">{report.title}</CardTitle>
                      <CardDescription className="mt-1 flex items-center gap-1.5">
                        <span className="capitalize">{report.type}</span> • {report.category}
                      </CardDescription>
                    </div>
                    <div className="p-2 bg-primary/10 rounded-md shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 pb-4">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {report.description || "No description provided for this generated report."}
                  </p>
                </CardContent>
                <CardFooter className="pt-0 flex justify-between items-center border-t border-border mt-auto p-4">
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(report.createdAt), "MMM d, yyyy")}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(report.id)}
                      disabled={deleteReport.isPending}
                      data-testid={`button-delete-report-${report.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-border rounded-lg bg-card/50">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground">No reports generated</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-2 mb-6">
              Generate your first intelligence report to analyze metric trends and performance across categories.
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>Generate First Report</Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}