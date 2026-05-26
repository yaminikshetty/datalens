import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SelectGroup } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useListKpiTargets, useCreateKpiTarget, useUpdateKpiTarget, useDeleteKpiTarget, getListKpiTargetsQueryKey, getGetDashboardOverviewQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Trash2, Plus, Target, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function KpiTargetsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [targetForm, setTargetForm] = useState({
    name: "",
    target: "",
    current: "",
    unit: "",
    category: "system",
    status: "on_track" as const
  });

  const queryClient = useQueryClient();
  const { data: kpiTargets, isLoading } = useListKpiTargets({ query: { queryKey: ["kpiTargets"] } });
  
  const createKpi = useCreateKpiTarget();
  const updateKpi = useUpdateKpiTarget();
  const deleteKpi = useDeleteKpiTarget();

  const resetForm = () => {
    setTargetForm({ name: "", target: "", current: "", unit: "", category: "system", status: "on_track" });
    setEditingId(null);
  };

  const handleCreate = () => {
    if (!targetForm.name || !targetForm.target || !targetForm.current || !targetForm.unit) {
      toast.error("Please fill in all required fields");
      return;
    }

    createKpi.mutate({
      data: {
        name: targetForm.name,
        target: Number(targetForm.target),
        current: Number(targetForm.current),
        unit: targetForm.unit,
        category: targetForm.category,
        status: targetForm.status
      }
    }, {
      onSuccess: () => {
        toast.success("KPI Target created");
        setIsCreateOpen(false);
        resetForm();
        queryClient.invalidateQueries({ queryKey: getListKpiTargetsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardOverviewQueryKey() });
      },
      onError: () => toast.error("Failed to create KPI target")
    });
  };

  const handleEditOpen = (kpi: any) => {
    setTargetForm({
      name: kpi.name,
      target: String(kpi.target),
      current: String(kpi.current),
      unit: kpi.unit,
      category: kpi.category,
      status: kpi.status
    });
    setEditingId(kpi.id);
    setIsEditOpen(true);
  };

  const handleEdit = () => {
    if (!editingId) return;
    
    updateKpi.mutate({
      id: editingId,
      data: {
        name: targetForm.name,
        target: Number(targetForm.target),
        current: Number(targetForm.current),
        unit: targetForm.unit,
        category: targetForm.category,
        status: targetForm.status
      }
    }, {
      onSuccess: () => {
        toast.success("KPI Target updated");
        setIsEditOpen(false);
        resetForm();
        queryClient.invalidateQueries({ queryKey: getListKpiTargetsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardOverviewQueryKey() });
      },
      onError: () => toast.error("Failed to update KPI target")
    });
  };

  const handleDelete = (id: number) => {
    deleteKpi.mutate({ id }, {
      onSuccess: () => {
        toast.success("KPI Target deleted");
        queryClient.invalidateQueries({ queryKey: getListKpiTargetsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardOverviewQueryKey() });
      },
      onError: () => toast.error("Failed to delete KPI target")
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "on_track": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "at_risk": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "behind": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "achieved": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default: return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const TargetFormContent = () => (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="text-right">Name</Label>
        <Input id="name" value={targetForm.name} onChange={e => setTargetForm({...targetForm, name: e.target.value})} className="col-span-3" />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="target" className="text-right">Goal Target</Label>
        <Input id="target" type="number" value={targetForm.target} onChange={e => setTargetForm({...targetForm, target: e.target.value})} className="col-span-3" />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="current" className="text-right">Current Value</Label>
        <Input id="current" type="number" value={targetForm.current} onChange={e => setTargetForm({...targetForm, current: e.target.value})} className="col-span-3" />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="unit" className="text-right">Unit</Label>
        <Input id="unit" placeholder="e.g. %, ms, users" value={targetForm.unit} onChange={e => setTargetForm({...targetForm, unit: e.target.value})} className="col-span-3" />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="category" className="text-right">Category</Label>
        <div className="col-span-3">
          <Select value={targetForm.category} onValueChange={v => setTargetForm({...targetForm, category: v})}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="status" className="text-right">Status</Label>
        <div className="col-span-3">
          <Select value={targetForm.status} onValueChange={(v: any) => setTargetForm({...targetForm, status: v})}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="on_track">On Track</SelectItem>
                <SelectItem value="at_risk">At Risk</SelectItem>
                <SelectItem value="behind">Behind</SelectItem>
                <SelectItem value="achieved">Achieved</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">KPI Targets</h1>
            <p className="text-muted-foreground mt-1">Track strategic goals against current metrics.</p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-kpi">
                <Plus className="h-4 w-4 mr-2" />
                Add Target
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create KPI Target</DialogTitle>
              </DialogHeader>
              <TargetFormContent />
              <div className="flex justify-end">
                <Button onClick={handleCreate} disabled={createKpi.isPending} data-testid="button-submit-kpi">
                  {createKpi.isPending ? "Creating..." : "Save Target"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Dialog (rendered outside map) */}
        <Dialog open={isEditOpen} onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) resetForm();
        }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit KPI Target</DialogTitle>
            </DialogHeader>
            <TargetFormContent />
            <div className="flex justify-end">
              <Button onClick={handleEdit} disabled={updateKpi.isPending} data-testid="button-update-kpi">
                {updateKpi.isPending ? "Updating..." : "Update Target"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="bg-card">
                <CardHeader>
                  <Skeleton className="h-6 w-1/2 mb-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : kpiTargets && kpiTargets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {kpiTargets.map((kpi) => {
              // Calculate progress percentage, clamped between 0 and 100
              const isHigherBetter = kpi.target > 0; // simplistic assumption for visual demo
              const pct = kpi.target === 0 ? 0 : Math.min(100, Math.max(0, (kpi.current / kpi.target) * 100));
              
              return (
                <Card key={kpi.id} className="bg-card flex flex-col">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <CardTitle className="text-lg">{kpi.name}</CardTitle>
                        <CardDescription className="mt-1 capitalize">{kpi.category}</CardDescription>
                      </div>
                      <Badge variant="outline" className={`${getStatusColor(kpi.status)} font-semibold`}>
                        {formatStatus(kpi.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4 flex-1">
                    <div className="flex justify-between items-end mb-2">
                      <div className="text-3xl font-bold tracking-tight">
                        {kpi.current.toLocaleString()}<span className="text-sm font-normal text-muted-foreground ml-1">{kpi.unit}</span>
                      </div>
                      <div className="text-sm text-muted-foreground text-right">
                        Goal: {kpi.target.toLocaleString()} {kpi.unit}
                      </div>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </CardContent>
                  <CardFooter className="pt-4 border-t border-border flex justify-between items-center bg-muted/20">
                    <div className="text-xs text-muted-foreground">
                      Created {format(new Date(kpi.createdAt), "MMM d, yyyy")}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => handleEditOpen(kpi)}
                        data-testid={`button-edit-kpi-${kpi.id}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(kpi.id)}
                        disabled={deleteKpi.isPending}
                        data-testid={`button-delete-kpi-${kpi.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-border rounded-lg bg-card/50">
            <Target className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground">No KPI targets set</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-2 mb-6">
              Define your first strategic goal to track performance across your infrastructure.
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>Create KPI Target</Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}