import { Link, useLocation } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import { 
  LayoutDashboard, 
  BarChart2, 
  FileText, 
  Target, 
  MessageSquare, 
  Settings, 
  LogOut,
  Menu,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Metrics", href: "/metrics", icon: BarChart2 },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "KPI Targets", href: "/kpi-targets", icon: Target },
  { name: "AI Assistant", href: "/ai-assistant", icon: MessageSquare },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  const handleLogout = () => {
    signOut({ redirectUrl: basePath || "/" });
  };

  const NavContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-border">
        <Activity className="h-6 w-6 text-primary mr-2" />
        <span className="text-xl font-bold text-foreground">DataLens</span>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto">
        <nav className="flex-1 space-y-1 px-4 py-4">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors
                  ${isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }
                `}
                onClick={() => setOpen(false)}
              >
                <item.icon 
                  className={`
                    mr-3 h-5 w-5 shrink-0
                    ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}
                  `} 
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="border-t border-border p-4 space-y-1">
          <Link
            href="/settings"
            className={`
              group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors
              ${location === "/settings" 
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }
            `}
            onClick={() => setOpen(false)}
          >
            <Settings className={`
              mr-3 h-5 w-5 shrink-0
              ${location === "/settings" ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}
            `} />
            Settings
          </Link>
          <button
            onClick={handleLogout}
            className="group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5 shrink-0 text-muted-foreground group-hover:text-destructive" />
            Sign Out
          </button>
        </div>
        
        {user && (
          <div className="border-t border-border p-4 flex items-center">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium shrink-0">
              {user.firstName?.charAt(0) || user.emailAddresses[0]?.emailAddress?.charAt(0)?.toUpperCase()}
            </div>
            <div className="ml-3 truncate">
              <p className="text-sm font-medium text-foreground truncate">
                {user.fullName || user.emailAddresses[0]?.emailAddress}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col border-r border-border bg-card">
        <NavContent />
      </div>

      {/* Mobile nav header */}
      <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-border bg-card px-4 sm:gap-x-6 sm:px-6 lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="-m-2.5 p-2.5 text-muted-foreground">
              <span className="sr-only">Open sidebar</span>
              <Menu className="h-6 w-6" aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 bg-card">
            <NavContent />
          </SheetContent>
        </Sheet>
        <div className="flex flex-1 items-center gap-x-4 self-stretch lg:gap-x-6">
          <Activity className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold text-foreground">DataLens</span>
        </div>
      </div>

      {/* Main content */}
      <main className="lg:pl-64 flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
