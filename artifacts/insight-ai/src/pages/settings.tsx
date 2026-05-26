import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useUser, useClerk } from "@clerk/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Save, LogOut, User, Shield, Bell } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function SettingsPage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Preferences saved successfully");
    }, 800);
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account and application preferences.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-[1fr_300px]">
          <div className="space-y-8">
            {/* Profile Settings */}
            <Card className="bg-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <CardTitle>Profile</CardTitle>
                </div>
                <CardDescription>Your personal information from Clerk Auth.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="h-20 w-20 border border-border">
                    <AvatarImage src={user?.imageUrl} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xl">
                      {user?.firstName?.charAt(0) || user?.emailAddresses[0]?.emailAddress?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium text-foreground text-lg">{user?.fullName || "User"}</p>
                    <p className="text-muted-foreground">{user?.emailAddresses[0]?.emailAddress}</p>
                    <Badge variant="outline" className="mt-1">Active Session</Badge>
                  </div>
                </div>

                <div className="grid gap-4 border-t border-border pt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" value={user?.firstName || ""} disabled className="bg-muted/50" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" value={user?.lastName || ""} disabled className="bg-muted/50" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" value={user?.emailAddresses[0]?.emailAddress || ""} disabled className="bg-muted/50" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Profile information is managed securely by Clerk. To update these details, use the Clerk portal.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Application Preferences */}
            <Card className="bg-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  <CardTitle>Preferences</CardTitle>
                </div>
                <CardDescription>Customize your DataLens experience.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div className="space-y-0.5">
                    <Label className="text-base font-medium">Anomaly Alerts</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications when metrics deviate from expected trends.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div className="space-y-0.5">
                    <Label className="text-base font-medium">Weekly Reports</Label>
                    <p className="text-sm text-muted-foreground">Get automated summary reports sent to your email.</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between pb-2">
                  <div className="space-y-0.5">
                    <Label className="text-base font-medium">Dense Layout</Label>
                    <p className="text-sm text-muted-foreground">Reduce padding across all dashboards for maximum data density.</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="pt-4 flex justify-end">
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Preferences"}
                    {!isSaving && <Save className="ml-2 h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="bg-card border-destructive/20">
              <CardHeader>
                <div className="flex items-center gap-2 text-destructive">
                  <Shield className="h-5 w-5" />
                  <CardTitle>Security</CardTitle>
                </div>
                <CardDescription>Session management.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  End your current session across this device.
                </p>
                <Button 
                  variant="destructive" 
                  className="w-full bg-destructive/10 text-destructive hover:bg-destructive hover:text-white"
                  onClick={() => signOut({ redirectUrl: basePath || "/" })}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

// Simple fallback badge for settings
function Badge({ className, variant = "default", children }: any) {
  const variants = {
    default: "bg-primary text-primary-foreground",
    outline: "border border-border text-foreground bg-transparent"
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${variants[variant as keyof typeof variants]} ${className}`}>
      {children}
    </span>
  );
}